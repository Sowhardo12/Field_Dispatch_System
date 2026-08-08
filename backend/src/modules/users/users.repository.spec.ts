
import { UsersRepository } from './users.repository';
import { UserRole } from '../../common/interfaces/domain.interface';

describe('UsersRepository', () => {
  let repository: UsersRepository;
  let mockPool: any;

  beforeEach(() => {
    mockPool = {
      query: jest.fn(),
    };
    repository = new UsersRepository(mockPool);
  });

  it('should insert and return a created user', async () => {
    const mockUser = {
      id: 1,
      email: 'test@example.com',
      password_hash: 'hashed',
      full_name: 'Test User',
      role: UserRole.CLIENT,
      created_at: new Date(),
      updated_at: new Date(),
    };

    mockPool.query.mockResolvedValueOnce({ rows: [mockUser] });

    const result = await repository.createUser(
      'test@example.com',
      'hashed',
      'Test User',
      UserRole.CLIENT,
    );

    expect(mockPool.query).toHaveBeenCalledTimes(1);
    expect(result).toEqual(mockUser);
  });

  it('should query user by email', async () => {
    const mockUser = { id: 1, email: 'test@example.com' };
    mockPool.query.mockResolvedValueOnce({ rows: [mockUser] });

    const result = await repository.findByEmail('test@example.com');
    expect(result).toEqual(mockUser);
  });
});