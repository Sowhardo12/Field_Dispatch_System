import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { WorkOrdersRepository } from './work-orders.repository';
import { CreateWorkOrderDto, QueryWorkOrderDto } from './dto/work-order.dto';
import { WorkOrderStatus, UserRole } from '../../common/interfaces/domain.interface';
// import { WorkLog, WorkLogDocument } from 'src/execution-logs/schemas/work-log-schema';
import { WorkLog, WorkLogDocument } from 'src/execution-logs/schema/work-log-schema';
import { privateDecrypt } from 'crypto';

@Injectable()
export class WorkOrdersService{
  constructor(private readonly workOrdersRepository : WorkOrdersRepository,
    @InjectModel(WorkLog.name) private readonly workLogModel: Model<WorkLogDocument>,
  ) {}
  async createWorkOrder(clientId : number, dto: CreateWorkOrderDto){
    return this.workOrdersRepository.create(dto.title,dto.description,clientId);
  }
  async findAll(query:QueryWorkOrderDto){
    const {status,page=1,limit=10}=query;
    return this.workOrdersRepository.findAllPaginated(status,page,limit);
  }
  async findOne(id:number){
    const order = await this.workOrdersRepository.findById(id);
    if (!order) {
      throw new NotFoundException({
        success: false,
        data: null,
        error: { code: 'NOT_FOUND', message: `Work order with ID ${id} not found`, details: [] },
        timestamp: new Date().toISOString(),
      });
    }
    return order;
  }
  async dispatchWorkOrder(id:number){
    const order = await this.findOne(id);
    if(order.status!==WorkOrderStatus.CREATED){
      throw new BadRequestException({
        success: false,
        data: null,
        error: {
          code: 'INVALID_STATE_TRANSITION',
          message: `Cannot dispatch work order in state ${order.status}. Must be CREATED.`,
          details: [],
        },
        timestamp: new Date().toISOString(),
      });
    }

    // this.workOrdersRepository.updateStatus(id,WorkOrderStatus.DISPATCHED);
    await this.workOrdersRepository.updateStatus(id,WorkOrderStatus.DISPATCHED);
  }

  async acceptWorkOrder(id:number,technician_id:number){
    const order = await this.findOne(id); 
    if(order.status!== WorkOrderStatus.OFFERED){
      //anything except OFFERED status 
      throw new BadRequestException({
        success: false,
        data: null,
        error: {
          code: 'INVALID_STATE_TRANSITION',
          message: `Cannot accept work order in state ${order.status}.`,
          details: [],
        },
        timestamp: new Date().toISOString(),
      });
    }
    return this.workOrdersRepository.updateStatus(id, WorkOrderStatus.IN_PROGRESS, technician_id); 
  }

  //next 
  async completeWorkOrder(id: number, technicianId: number) {
    const order = await this.findOne(id);
    if (order.status !== WorkOrderStatus.IN_PROGRESS) {
      throw new BadRequestException({
        success: false,
        data: null,
        error: {
          code: 'INVALID_STATE_TRANSITION',
          message: `Cannot complete work order in state ${order.status}. Must be IN_PROGRESS.`,
          details: [],
        },
        timestamp: new Date().toISOString(),
      });
    }
    if (order.technician_id !== technicianId) {
      //if the technician id attached with the order does not match the technician id 
      //inserted while running this function
      throw new ForbiddenException({
        success: false,
        data: null,
        error: {
          code: 'FORBIDDEN',
          message: 'Only the assigned technician can complete this work order',
          details: [],
        },
        timestamp: new Date().toISOString(),
      });
    }
    const logCount = await this.workLogModel.countDocuments({work_order_id:id});
    if(logCount===0){
      throw new BadRequestException({
        success: false,
        data: null,
        error: {
          code: 'MISSING_EXECUTION_LOGS',
          message: 'At least one execution log is required before completing a work order',
          details: [],
        },
        timestamp: new Date().toISOString(),
      });
    }
    return this.workOrdersRepository.updateStatus(id, WorkOrderStatus.COMPLETED);
  }

  async closeWorkOrder(id: number, userId: number, userRole: UserRole) {
    const order = await this.findOne(id);
    if (order.status !== WorkOrderStatus.COMPLETED) {
      throw new BadRequestException({
        success: false,
        data: null,
        error: {
          code: 'INVALID_STATE_TRANSITION',
          message: `Cannot close work order in state ${order.status}. Must be COMPLETED.`,
          details: [],
        },
        timestamp: new Date().toISOString(),
      });
    }

    //only clients can close their own order, cant close someone else's order
    //admin,dispatcher,technician can also close order
    if (userRole === UserRole.CLIENT && order.client_id !== userId) {
      //case: a client trying to close some other client's order
      throw new ForbiddenException({
        success: false,
        data: null,
        error: {
          code: 'FORBIDDEN',
          message: 'Clients can only close their own work orders',
          details: [],
        },
        timestamp: new Date().toISOString(),
      });
    }

    return this.workOrdersRepository.updateStatus(id, WorkOrderStatus.CLOSED);
  }

}


