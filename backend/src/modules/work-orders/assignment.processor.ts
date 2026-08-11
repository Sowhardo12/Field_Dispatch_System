import { Process, Processor } from '@nestjs/bull';
import { Inject } from '@nestjs/common';
import { Logger } from '@nestjs/common';
import type { Job } from 'bull';
// import { PostgresService } from 'src/database/postgres/postgres.service';
import {PostgresService} from '../../database/postgres/postgres.service'
import { WorkOrderStatus, UserRole } from '../../common/interfaces/domain.interface';

export const WORK_ORDER_QUEUE = 'work-order-assignment';
export const  AUTO_ASSIGN_JOB = 'auto-assign';

interface AutoAssignJobData{
  workOrderId: number;
}
//a consumer class 
@Processor(WORK_ORDER_QUEUE)
export class AssignmentProcessor{
  private readonly logger = new Logger(AssignmentProcessor.name);
  constructor(@Inject(PostgresService) private readonly postgresService: PostgresService) {}
  @Process(AUTO_ASSIGN_JOB)
  async handleAutoAssign(job: Job<AutoAssignJobData>){
    const {workOrderId} = job.data;
    this.logger.log(`Processing auto-assignment for Work Order #${workOrderId} (Attempt ${job.attemptsMade + 1})`);
    const orderRes = await this.postgresService.query(
      'select id,status from work_orders where id = $1',[workOrderId],
    )
    if (orderRes.rows.length === 0) {
      this.logger.warn(`Work order #${workOrderId} not found. Aborting assignment.`);
      return;
    }
    const order = orderRes.rows[0];
    if (order.status !== WorkOrderStatus.DISPATCHED) {
      this.logger.warn(`Work order #${workOrderId} status is ${order.status}, expected DISPATCHED. Skipping.`);
      return;
    }
    const findCandidateQuery = `
      select u.id,count(w.id) as active_order_count
      from users u
      left join work_orders w on u.id = w.technician_id and 
      w.status in ('OFFERED','IN_PROGRESS')
      where u.role = $1
      group by u.id
      order by active_order_count asc limit 1;
    `;
    const findCandidateResult = await this.postgresService.query(findCandidateQuery,[UserRole.TECHNICIAN]);
    if(findCandidateResult.rows.length===0){
      this.logger.error(`No eligible technicians found for Work Order #${workOrderId}. Retrying via queue backoff...`);
      throw new Error(`No available technician for assignment of work order #${workOrderId}`);
    }
    const technician_id = findCandidateResult.rows[0].id;
    await this.postgresService.query(
      ` update work_orders
      set technician_id = $1, status = $2, updated_at = CURRENT_TIMESTAMP 
      where id = $3
      `,[technician_id,WorkOrderStatus.OFFERED,workOrderId],
    );
    this.logger.log(
      `Successfully assigned Work Order #${workOrderId} to Technician #${technician_id} (Status: OFFERED)`,
    );
  }
}
