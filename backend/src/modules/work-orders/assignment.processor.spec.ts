import { Test, TestingModule } from '@nestjs/testing';
import { AssignmentProcessor, WORK_ORDER_QUEUE, AUTO_ASSIGN_JOB } from './assignment.processor';
import { PostgresService } from '../../database/postgres/postgres.service';
import { WorkOrderStatus, UserRole } from '../../common/interfaces/domain.interface';

describe('AssignmentProcessor', () => {
  let processor: AssignmentProcessor;
  let postgresService: jest.Mocked<PostgresService>;

  beforeEach(async () => {
    const mockPostgresService = {
      query: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AssignmentProcessor,
        {
          provide: PostgresService,
          useValue: mockPostgresService,
        },
      ],
    }).compile();

    processor = module.get<AssignmentProcessor>(AssignmentProcessor);
    postgresService = module.get(PostgresService);
  });

  it('should assign technician with least workload and transition status to OFFERED', async () => {
    // Mock the queries in the exact order they are called
    postgresService.query
      // First call: Check if work order exists
      .mockResolvedValueOnce({ 
        rows: [{ id: 10, status: WorkOrderStatus.DISPATCHED }] 
      })
      // Second call: Find technician with least workload
      .mockResolvedValueOnce({ 
        rows: [{ id: 5, active_order_count: 0 }] 
      })
      // Third call: Update work order with technician assignment
      .mockResolvedValueOnce({ 
        rows: [{ id: 10, technician_id: 5, status: WorkOrderStatus.OFFERED }] 
      });

    const job = {
      data: { workOrderId: 10 },
      attemptsMade: 0,
    } as any;

    await processor.handleAutoAssign(job);

    // Verify all three queries were called
    expect(postgresService.query).toHaveBeenCalledTimes(3);
    
    // Verify the first query (check work order)
    expect(postgresService.query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('select id,status from work-orders'),
      [10]
    );
    
    // Verify the second query (find technician)
    expect(postgresService.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('select u.id,count(w.id)'),
      [UserRole.TECHNICIAN]
    );
    
    // Verify the third/last query (UPDATE)
    expect(postgresService.query).toHaveBeenLastCalledWith(
      expect.stringContaining('UPDATE work_orders'),
      [5, WorkOrderStatus.OFFERED, 10]
    );
  });

  it('should throw error when no technicians are available', async () => {
    // Mock: Work order exists
    postgresService.query
      .mockResolvedValueOnce({ 
        rows: [{ id: 10, status: WorkOrderStatus.DISPATCHED }] 
      })
      // Mock: No technicians found
      .mockResolvedValueOnce({ 
        rows: [] 
      });

    const job = {
      data: { workOrderId: 10 },
      attemptsMade: 0,
    } as any;

    await expect(processor.handleAutoAssign(job)).rejects.toThrow(
      'No available technician for assignment of work order #10'
    );
    
    expect(postgresService.query).toHaveBeenCalledTimes(2);
  });

  it('should skip when work order is not in DISPATCHED status', async () => {
    // Mock: Work order exists but is already IN_PROGRESS
    postgresService.query
      .mockResolvedValueOnce({ 
        rows: [{ id: 10, status: WorkOrderStatus.IN_PROGRESS }] 
      });

    const job = {
      data: { workOrderId: 10 },
      attemptsMade: 0,
    } as any;

    await processor.handleAutoAssign(job);
    
    // Should only query once to check status
    expect(postgresService.query).toHaveBeenCalledTimes(1);
    expect(postgresService.query).toHaveBeenCalledWith(
      expect.stringContaining('select id,status from work-orders'),
      [10]
    );
  });

  it('should skip when work order does not exist', async () => {
    // Mock: No work order found
    postgresService.query
      .mockResolvedValueOnce({ 
        rows: [] 
      });

    const job = {
      data: { workOrderId: 999 },
      attemptsMade: 0,
    } as any;

    await processor.handleAutoAssign(job);
    
    expect(postgresService.query).toHaveBeenCalledTimes(1);
    expect(postgresService.query).toHaveBeenCalledWith(
      expect.stringContaining('select id,status from work-orders'),
      [999]
    );
  });
});