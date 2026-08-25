import { Process, Processor } from '@nestjs/bull';
import { Logger, Inject } from '@nestjs/common';
import type { Job } from 'bull';
import { PostgresService } from '../../database/postgres/postgres.service';
import { WorkOrderStatus, UserRole } from '../../common/interfaces/domain.interface';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import { AiClassifierService } from './services/ai-classifier';
import { calculateHaversineDistance } from '../../common/utils/geo.util';

export const WORK_ORDER_QUEUE = 'work-order-assignment';
export const AUTO_ASSIGN_JOB = 'auto-assign';

interface AutoAssignJobData {
  workOrderId: number;
}

@Processor(WORK_ORDER_QUEUE)
export class AssignmentProcessor {
  private readonly logger = new Logger(AssignmentProcessor.name);

  constructor(
    @Inject(PostgresService) private readonly postgresService: PostgresService,
    private readonly notificationsGateway: NotificationsGateway,
    private readonly aiClassifierService: AiClassifierService,
  ) {}

  @Process(AUTO_ASSIGN_JOB)
  async handleAutoAssign(job: Job<AutoAssignJobData>) {
    const { workOrderId } = job.data;
    this.logger.log(`Processing auto-assignment for Work Order #${workOrderId} (Attempt ${job.attemptsMade + 1})`);

    // 1. Fetch Work Order Details + JOIN Client User profile to get client's area_name & coordinates
    const orderRes = await this.postgresService.query(
      `SELECT wo.id, wo.status, wo.client_id, wo.title, wo.description,
              client.area_name AS client_area_name,
              da.latitude AS order_lat, da.longitude AS order_lon
       FROM work_orders wo
       JOIN users client ON wo.client_id = client.id
       LEFT JOIN dhaka_areas da ON LOWER(client.area_name) = LOWER(da.area_name)
       WHERE wo.id = $1`,
      [workOrderId],
    );

    if (orderRes.rows.length === 0) {
      this.logger.warn(`Work order #${workOrderId} not found. Aborting assignment.`);
      return;
    }

    const order = orderRes.rows[0];
    if (order.status !== WorkOrderStatus.DISPATCHED) {
      this.logger.warn(`Work order #${workOrderId} status is ${order.status}, expected DISPATCHED. Skipping.`);
      return;
    }

    // 2. Classify Required Technician Type via Groq AI
    const requiredType = await this.aiClassifierService.classifyWorkOrder(
      order.title,
      order.description,
    );

    // 3. Build Dynamic Candidate Query based on AI Classification
    let findCandidateQuery = '';
    let queryParams: any[] = [UserRole.TECHNICIAN];

    if (requiredType === 'universal') {
      // 🟢 UNIVERSAL FALLBACK: Include ALL active technicians regardless of specialization
      this.logger.log(`Classification is 'universal'. Querying ALL available technicians across all types...`);
      findCandidateQuery = `
        SELECT 
          u.id, 
          u.full_name, 
          u.technician_type, 
          u.area_name AS tech_area_name,
          da.latitude AS tech_lat,
          da.longitude AS tech_lon,
          COUNT(w.id) AS active_order_count
        FROM users u
        LEFT JOIN dhaka_areas da ON LOWER(u.area_name) = LOWER(da.area_name)
        LEFT JOIN work_orders w ON u.id = w.technician_id AND w.status IN ('OFFERED', 'IN_PROGRESS')
        WHERE u.role = $1
        GROUP BY u.id, u.full_name, u.technician_type, u.area_name, da.latitude, da.longitude;
      `;
    } else {
      // 🎯 SPECIFIC CATEGORY: Filter for tech matching specific type OR 'universal'/NULL
      this.logger.log(`Filtering technicians specialized in [${requiredType}] or [universal]...`);
      findCandidateQuery = `
        SELECT 
          u.id, 
          u.full_name, 
          u.technician_type, 
          u.area_name AS tech_area_name,
          da.latitude AS tech_lat,
          da.longitude AS tech_lon,
          COUNT(w.id) AS active_order_count
        FROM users u
        LEFT JOIN dhaka_areas da ON LOWER(u.area_name) = LOWER(da.area_name)
        LEFT JOIN work_orders w ON u.id = w.technician_id AND w.status IN ('OFFERED', 'IN_PROGRESS')
        WHERE u.role = $1
          AND (
            u.technician_type IS NULL 
            OR LOWER(u.technician_type) = 'universal' 
            OR LOWER(u.technician_type) = $2
          )
        GROUP BY u.id, u.full_name, u.technician_type, u.area_name, da.latitude, da.longitude;
      `;
      queryParams.push(requiredType);
    }

    const candidatesRes = await this.postgresService.query(findCandidateQuery, queryParams);

    if (candidatesRes.rows.length === 0) {
      this.logger.error(`No candidate technicians found in the system. Retrying via queue...`);
      throw new Error(`No available technician found for assignment`);
    }

    // 4. Calculate Distance (in KM) from Client's Area
    const scoredCandidates = candidatesRes.rows.map((tech) => {
      let distanceKm = 999; // Default penalty if area coordinates are missing

      if (order.order_lat && order.order_lon && tech.tech_lat && tech.tech_lon) {
        distanceKm = calculateHaversineDistance(
          Number(order.order_lat),
          Number(order.order_lon),
          Number(tech.tech_lat),
          Number(tech.tech_lon),
        );
      }

      return {
        ...tech,
        distanceKm,
        activeOrders: Number(tech.active_order_count),
      };
    });

    // 5. Smart Sorting Logic
    scoredCandidates.sort((a, b) => {
      if (requiredType === 'universal') {
        // When Universal/Ambiguous: Primary = Proximity (Distance ASC), Secondary = Least Busy
        if (a.distanceKm !== b.distanceKm) {
          return a.distanceKm - b.distanceKm;
        }
        return a.activeOrders - b.activeOrders;
      } else {
        // When Specific Category: Primary = Least Busy (Workload ASC), Secondary = Proximity (Distance ASC)
        if (a.activeOrders !== b.activeOrders) {
          return a.activeOrders - b.activeOrders;
        }
        return a.distanceKm - b.distanceKm;
      }
    });

    const selectedTechnician = scoredCandidates[0];

    // 6. Assign Selected Technician
    await this.postgresService.query(
      `UPDATE work_orders
       SET technician_id = $1, status = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3`,
      [selectedTechnician.id, WorkOrderStatus.OFFERED, workOrderId],
    );

    // 7. Send Real-Time WebSocket Notification to Client
    this.notificationsGateway.notifyUser(order.client_id, 'TECHNICIAN_ALLOCATED', {
      work_order_id: order.id,
      title: order.title,
      status: WorkOrderStatus.OFFERED,
      technician: {
        id: selectedTechnician.id,
        full_name: selectedTechnician.full_name,
        type: selectedTechnician.technician_type || 'universal',
        area: selectedTechnician.tech_area_name || 'Dhaka Central',
      },
      message: `Technician ${selectedTechnician.full_name} (${selectedTechnician.technician_type || 'General'}) from ${selectedTechnician.tech_area_name || 'nearby'} has been allocated to your work order.`,
    });

    this.logger.log(
      `Successfully assigned Work Order #${workOrderId} -> Tech #${selectedTechnician.id} (${selectedTechnician.full_name}, ${selectedTechnician.distanceKm.toFixed(2)}km away from client in ${order.client_area_name || 'unknown'}, Category: ${selectedTechnician.technician_type || 'universal'})`,
    );
  }
}