import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BullModule } from '@nestjs/bull';
import { WorkOrdersController } from './work-orders.controller';
import { WorkOrdersService } from './work-orders.service';
import { WorkOrdersRepository } from './work-orders.repository';
// import { WorkLog, WorkLogSchema } from '../../execution-logs/schemas/work-log.schema';
// import { WorkLog,WorkLogSchema } from 'src/execution-logs/schemas/work-log-schema';
import { WorkLog,WorkLogSchema } from '../../execution-logs/schema/work-log-schema';
import { PostgresModule } from '../../database/postgres/postgres.module';
import { AssignmentProcessor,WORK_ORDER_QUEUE } from './assignment.processor';

@Module({
  imports: [PostgresModule,
    MongooseModule.forFeature([{ name: WorkLog.name, schema: WorkLogSchema }]),
    BullModule.registerQueue({name:WORK_ORDER_QUEUE,}),
  ],
  controllers: [WorkOrdersController],
  providers: [WorkOrdersService, WorkOrdersRepository,AssignmentProcessor],
  exports: [WorkOrdersService, WorkOrdersRepository],
})
export class WorkOrdersModule {}