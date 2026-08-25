import { Process, Processor } from '@nestjs/bull';
import { Inject } from '@nestjs/common';
import { Logger } from '@nestjs/common';
import type { Job } from 'bull';
// import { PostgresService } from 'src/database/postgres/postgres.service';
import {PostgresService} from '../../database/postgres/postgres.service'
import { WorkOrderStatus, UserRole } from '../../common/interfaces/domain.interface';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import { AiClassifierService } from './services/ai-classifier';
import { calculateHaversineDistance } from 'src/common/utils/geo.util';

export const WORK_ORDER_QUEUE = 'work-order-assignment';
export const  AUTO_ASSIGN_JOB = 'auto-assign';

interface AutoAssignJobData{
  workOrderId: number;
}
//a consumer class 
@Processor(WORK_ORDER_QUEUE)
export class AssignmentProcessor{
  private readonly logger = new Logger(AssignmentProcessor.name);

  constructor(@Inject(PostgresService) private readonly postgresService: PostgresService,
              private readonly notificationsGateway : NotificationsGateway,
              private readonly aiClassifierService: AiClassifierService,
) {}
  @Process(AUTO_ASSIGN_JOB)
  async handleAutoAssign(job: Job<AutoAssignJobData>){
    //get the job id
    const {workOrderId} = job.data;
    this.logger.log(`Processing auto-assignment for Work Order #${workOrderId} (Attempt ${job.attemptsMade + 1})`);
    //query work order information (client_id,id,status,title)
    const orderRes = await this.postgresService.query(
      'select id,status,client_id,title from work_orders where id = $1',[workOrderId],
    )
    if (orderRes.rows.length === 0) {
      this.logger.warn(`Work order #${workOrderId} not found. Aborting assignment.`);
      return;
    }
    //get the order 
    const order = orderRes.rows[0];
    if (order.status !== WorkOrderStatus.DISPATCHED) {
      this.logger.warn(`Work order #${workOrderId} status is ${order.status}, expected DISPATCHED. Skipping.`);
      return;
    }

    //find the best suitable technician 
    //1. looks at all technicians
    //2. Counts how many jobs each is currently handling (OFFERED or IN_PROGRESS)
    //3. Picks the one with the lowest count (least busy)
    //4. return technician id and name
    const findCandidateQuery = `
      select u.id,u.full_name,count(w.id) as active_order_count
      from users u
      left join work_orders w on u.id = w.technician_id and 
      w.status in ('OFFERED','IN_PROGRESS')
      where u.role = $1
      group by u.id,u.full_name
      order by active_order_count asc limit 1;
    `;
    const findCandidateResult = await this.postgresService.query(findCandidateQuery,[UserRole.TECHNICIAN]);
    if(findCandidateResult.rows.length===0){
      this.logger.error(`No eligible technicians found for Work Order #${workOrderId}. Retrying via queue backoff...`);
      throw new Error(`No available technician for assignment of work order #${workOrderId}`);
    }
    // const technician_id = findCandidateResult.rows[0].id;
    const technician = findCandidateResult.rows[0];
    //allocate the found technician for the job
    await this.postgresService.query(
      ` update work_orders
      set technician_id = $1, status = $2, updated_at = CURRENT_TIMESTAMP 
      where id = $3
      `,[technician.id,WorkOrderStatus.OFFERED,workOrderId],
    );
    this.notificationsGateway.notifyUser(order.client_id,'TECHNICIAN_ALLOCATED',{
      work_order_id: order.id,
      title: order.title,
      status: WorkOrderStatus.OFFERED,
      technician:{
        id:technician.id, full_name:technician.full_name,
      },message:`Technician ${technician.full_name} has been matched with your work order: "${order.title}".`,
    })
    this.logger.log(
      `Successfully assigned Work Order #${workOrderId} to Technician #${technician.id} (Status: OFFERED) & notified Client #${order.client_id}`,
    );
  }
}






//faulty one

// import { Process, Processor } from '@nestjs/bull';
// import { Logger, Inject } from '@nestjs/common';
// // import { Job } from 'bull';
// import type { Job } from 'bull';
// import { PostgresService } from '../../database/postgres/postgres.service';
// import { WorkOrderStatus, UserRole } from '../../common/interfaces/domain.interface';
// import { NotificationsGateway } from '../notifications/notifications.gateway';
// // import { AiClassifierService } from './services/ai-classifier.service';
// import { AiClassifierService } from './services/ai-classifier';
// import { calculateHaversineDistance } from '../../common/utils/geo.util';

// export const WORK_ORDER_QUEUE = 'work-order-assignment';
// export const AUTO_ASSIGN_JOB = 'auto-assign';

// interface AutoAssignJobData {
//   workOrderId: number;
// }

// @Processor(WORK_ORDER_QUEUE)
// export class AssignmentProcessor {
//   private readonly logger = new Logger(AssignmentProcessor.name);

//   constructor(
//     @Inject(PostgresService) private readonly postgresService: PostgresService,
//     private readonly notificationsGateway: NotificationsGateway,
//     private readonly aiClassifierService: AiClassifierService,
//   ) {}

//   @Process(AUTO_ASSIGN_JOB)
//   async handleAutoAssign(job: Job<AutoAssignJobData>) {
//     const { workOrderId } = job.data;
//     this.logger.log(`Processing auto-assignment for Work Order #${workOrderId} (Attempt ${job.attemptsMade + 1})`);

//     // 1. Fetch Work Order Details + JOIN Client User profile to get client's area_name & coordinates
//     const orderRes = await this.postgresService.query(
//       `SELECT wo.id, wo.status, wo.client_id, wo.title, wo.description,
//               client.area_name AS client_area_name,
//               da.latitude AS order_lat, da.longitude AS order_lon
//        FROM work_orders wo
//        JOIN users client ON wo.client_id = client.id
//        LEFT JOIN dhaka_areas da ON LOWER(client.area_name) = LOWER(da.area_name)
//        WHERE wo.id = $1`,
//       [workOrderId],
//     );

//     if (orderRes.rows.length === 0) {
//       this.logger.warn(`Work order #${workOrderId} not found. Aborting assignment.`);
//       return;
//     }

//     const order = orderRes.rows[0];
//     if (order.status !== WorkOrderStatus.DISPATCHED) {
//       this.logger.warn(`Work order #${workOrderId} status is ${order.status}, expected DISPATCHED. Skipping.`);
//       return;
//     }

//     // 2. Classify Required Technician Type via Groq AI
//     const requiredType = await this.aiClassifierService.classifyWorkOrder(
//       order.title,
//       order.description,
//     );

//     // 3. Fetch Candidate Technicians filtered by Role and Required Type (or Universal/NULL)
//     const findCandidateQuery = `
//       SELECT 
//         u.id, 
//         u.full_name, 
//         u.technician_type, 
//         u.area_name AS tech_area_name,
//         da.latitude AS tech_lat,
//         da.longitude AS tech_lon,
//         COUNT(w.id) AS active_order_count
//       FROM users u
//       LEFT JOIN dhaka_areas da ON LOWER(u.area_name) = LOWER(da.area_name)
//       LEFT JOIN work_orders w ON u.id = w.technician_id AND w.status IN ('OFFERED', 'IN_PROGRESS')
//       WHERE u.role = $1
//         AND (
//           u.technician_type IS NULL 
//           OR LOWER(u.technician_type) = 'universal' 
//           OR LOWER(u.technician_type) = $2
//         )
//       GROUP BY u.id, u.full_name, u.technician_type, u.area_name, da.latitude, da.longitude;
//     `;

//     const candidatesRes = await this.postgresService.query(findCandidateQuery, [
//       UserRole.TECHNICIAN,
//       requiredType,
//     ]);

//     if (candidatesRes.rows.length === 0) {
//       this.logger.error(`No candidate technicians found matching role requirement '${requiredType}'. Retrying via queue...`);
//       throw new Error(`No available technician matching category '${requiredType}'`);
//     }

//     // 4. Calculate Distances relative to Client's Location
//     const scoredCandidates = candidatesRes.rows.map((tech) => {
//       let distanceKm = 999; // Default penalty if area coordinates are missing

//       if (order.order_lat && order.order_lon && tech.tech_lat && tech.tech_lon) {
//         distanceKm = calculateHaversineDistance(
//           Number(order.order_lat),
//           Number(order.order_lon),
//           Number(tech.tech_lat),
//           Number(tech.tech_lon),
//         );
//       }

//       return {
//         ...tech,
//         distanceKm,
//         activeOrders: Number(tech.active_order_count),
//       };
//     });

//     // 5. Sort Candidates: Workload ASC (Primary), Distance ASC (Secondary)
//     scoredCandidates.sort((a, b) => {
//       if (a.activeOrders !== b.activeOrders) {
//         return a.activeOrders - b.activeOrders;
//       }
//       return a.distanceKm - b.distanceKm;
//     });

//     const selectedTechnician = scoredCandidates[0];

//     // 6. Assign Selected Technician
//     await this.postgresService.query(
//       `UPDATE work_orders
//        SET technician_id = $1, status = $2, updated_at = CURRENT_TIMESTAMP
//        WHERE id = $3`,
//       [selectedTechnician.id, WorkOrderStatus.OFFERED, workOrderId],
//     );

//     // 7. Send Real-Time Notification to Client
//     this.notificationsGateway.notifyUser(order.client_id, 'TECHNICIAN_ALLOCATED', {
//       work_order_id: order.id,
//       title: order.title,
//       status: WorkOrderStatus.OFFERED,
//       technician: {
//         id: selectedTechnician.id,
//         full_name: selectedTechnician.full_name,
//         type: selectedTechnician.technician_type || 'universal',
//         area: selectedTechnician.tech_area_name || 'Dhaka Central',
//       },
//       message: `Technician ${selectedTechnician.full_name} (${selectedTechnician.technician_type || 'General'}) has been allocated to your work order: "${order.title}".`,
//     });

//     this.logger.log(
//       `Assigned Work Order #${workOrderId} -> Tech #${selectedTechnician.id} (${selectedTechnician.full_name}, ${selectedTechnician.distanceKm.toFixed(1)}km from ${order.client_area_name || 'Client'}, Category: ${selectedTechnician.technician_type || 'universal'})`,
//     );
//   }
// }
