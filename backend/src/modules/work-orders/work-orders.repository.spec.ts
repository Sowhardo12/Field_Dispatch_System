import { WorkOrdersRepository } from './work-orders.repository';
import { WorkOrderStatus } from '../../common/interfaces/domain.interface';

describe('WorkOrdersRepository', () => {
  let repository: WorkOrdersRepository;
  let mockPool: any;

  beforeEach(() => {
    mockPool = {
      query: jest.fn(),
    };
    repository = new WorkOrdersRepository(mockPool);
  });

  it('should insert a new work order in CREATED state', async () => {
    const mockWorkOrder = {
      id: 1,
      title: 'Fix AC',
      description: 'Air conditioner leaking',
      status: WorkOrderStatus.CREATED,
      client_id: 2,
      technician_id: null,
      created_at: new Date(),
      updated_at: new Date(),
    };

    mockPool.query.mockResolvedValueOnce({ rows: [mockWorkOrder] });

    const result = await repository.create('Fix AC', 'Air conditioner leaking', 2);
    expect(result).toEqual(mockWorkOrder);
  });

  it('should update work order status', async () => {
    const updatedWorkOrder = {
      id: 1,
      status: WorkOrderStatus.DISPATCHED,
    };

    mockPool.query.mockResolvedValueOnce({ rows: [updatedWorkOrder] });

    const result = await repository.updateStatus(1, WorkOrderStatus.DISPATCHED);
    expect(result).toEqual(updatedWorkOrder);
  });
});