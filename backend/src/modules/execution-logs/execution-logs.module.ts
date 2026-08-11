import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ExecutionLogsController } from './execution-logs.controller';
import { ExecutionLogsService } from './execution-logs.service';
import { WorkLog,WorkLogSchema } from '../../execution-logs/schema/work-log-schema';
import { WorkOrdersRepository } from '../work-orders/work-orders.repository';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: WorkLog.name, schema: WorkLogSchema }]),
  ],
  controllers: [ExecutionLogsController],
  providers: [ExecutionLogsService, WorkOrdersRepository],
  exports: [ExecutionLogsService],
})
export class ExecutionLogsModule {}