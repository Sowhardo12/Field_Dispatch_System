import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { WorkLog,WorkLogDocument } from '../../execution-logs/schema/work-log-schema';
import { CreateWorkLogDto } from './dto/execution-log.dto';
import { WorkOrdersRepository } from '../work-orders/work-orders.repository';
import { WorkOrderStatus } from '../../common/interfaces/domain.interface';
import { privateDecrypt } from 'crypto';
//inside execution-log service

@Injectable()
export class ExecutionLogsService{
  constructor(
    @InjectModel(WorkLog.name) private readonly workLogModel : Model <WorkLogDocument>,
    private readonly workOrdersRepository : WorkOrdersRepository,
  ){}
  async createLog(workOrderId:number,technicianId:number, dto:CreateWorkLogDto){
    const workOrder = await this.workOrdersRepository.findById(workOrderId);
    if (!workOrder) {
      throw new NotFoundException({
        success: false,
        data: null,
        error: { code: 'NOT_FOUND', message: `Work order #${workOrderId} not found`, details: [] },
        timestamp: new Date().toISOString(),
      });
    }
    //log only can be created when the work is in IN_PROGRESS state 
    if(workOrder.status!== WorkOrderStatus.IN_PROGRESS){
      throw new BadRequestException({
        success: false,
        data: null,
        error: {
          code: 'INVALID_STATE',
          message: 'Execution logs can only be submitted when work order is IN_PROGRESS',
          details: [],
        },
        timestamp: new Date().toISOString(),
      });
    }
    const createdLog = new this.workLogModel({
      work_order_id: workOrderId,
      technician_id: technicianId,
      checklists: dto.checklists || [],
      hardware_metadata: dto.hardware_metadata || {},
      technician_notes: dto.technician_notes,
    });
    return createdLog.save();
  }
  async getLogsForWorkOrder(workOrderId: number) {
    return this.workLogModel.find({ work_order_id: workOrderId }).exec();
  }
}