import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { WorkOrdersController } from './work-orders.controller';
import { WorkOrdersService } from './work-orders.service';
import { WorkOrdersRepository } from './work-orders.repository';
// import { WorkLog, WorkLogSchema } from '../../execution-logs/schemas/work-log.schema';
// import { WorkLog,WorkLogSchema } from 'src/execution-logs/schemas/work-log-schema';
import { WorkLog,WorkLogSchema } from 'src/execution-logs/schema/work-log-schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: WorkLog.name, schema: WorkLogSchema }]),
  ],
  controllers: [WorkOrdersController],
  providers: [WorkOrdersService, WorkOrdersRepository],
  exports: [WorkOrdersService, WorkOrdersRepository],
})
export class WorkOrdersModule {}