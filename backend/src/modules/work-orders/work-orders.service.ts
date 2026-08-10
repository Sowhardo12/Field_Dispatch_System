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
import { WorkLog, WorkLogDocument } from 'src/execution-logs/schemas/work-log-schema';
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

    this.workOrdersRepository.updateStatus(id,WorkOrderStatus.DISPATCHED);
  }

  
}