import { Test, TestingModule } from '@nestjs/testing';
import { WorkOrdersService } from './work-orders.service';
import { WorkOrdersRepository } from './work-orders.repository';
import { getModelToken } from '@nestjs/mongoose';
import { getQueueToken } from '@nestjs/bull'; 
import { WorkOrderStatus, UserRole } from '../../common/interfaces/domain.interface';
import { BadRequestException } from '@nestjs/common';
import { WORK_ORDER_QUEUE } from './assignment.processor';

describe('WorkOrdersService - State Machine', () => {
  let service: WorkOrdersService;
  let repository: jest.Mocked<WorkOrdersRepository>;
  let workLogModel: any;
  let queue: any;

  beforeEach(async () => {
    const mockRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findAllPaginated: jest.fn(),
      updateStatus: jest.fn(),
    };

    const mockWorkLogModel = {
      countDocuments: jest.fn(),
    };
    const mockQueue = {
      add: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkOrdersService,
        { provide: WorkOrdersRepository, useValue: mockRepository },
        { provide: getModelToken('WorkLog'), useValue: mockWorkLogModel },
         { 
          provide: getQueueToken(WORK_ORDER_QUEUE), 
          useValue: mockQueue 
        }
        ,

      ],
    }).compile();

    service = module.get<WorkOrdersService>(WorkOrdersService);
    repository = module.get(WorkOrdersRepository);
    workLogModel = module.get(getModelToken('WorkLog'));
    queue = module.get(getQueueToken(WORK_ORDER_QUEUE));
  });

  it('should prevent illegal state transition from CREATED directly to IN_PROGRESS', async () => {
    repository.findById.mockResolvedValue({
      id: 1,
      status: WorkOrderStatus.CREATED,
      client_id: 1,
      technician_id: null,
      title: 'Test',
      description: 'Test',
      created_at: new Date(),
      updated_at: new Date(),
    });

    await expect(service.acceptWorkOrder(1, 2)).rejects.toThrow(BadRequestException);
  });

  it('should successfully transition from CREATED to DISPATCHED', async () => {
    const mockOrder = {
      id: 1,
      status: WorkOrderStatus.CREATED,
      client_id: 1,
      technician_id: null,
      title: 'Test',
      description: 'Test',
      created_at: new Date(),
      updated_at: new Date(),
    };

    repository.findById.mockResolvedValue(mockOrder);
    repository.updateStatus.mockResolvedValue({
      ...mockOrder,
      status: WorkOrderStatus.DISPATCHED,
    });

    // const result = await service.dispatchWorkOrder(1);
    await service.dispatchWorkOrder(1);

    // expect(result.status).toBe(WorkOrderStatus.DISPATCHED);
    expect(repository.updateStatus).toHaveBeenCalledWith(1, WorkOrderStatus.DISPATCHED);

  });
});