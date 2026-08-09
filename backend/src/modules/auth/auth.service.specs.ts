import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersRepository } from '../users/users.repository';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from '../../common/interfaces/domain.interface';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let authService: AuthService;
  let usersRepository: jest.Mocked<UsersRepository>;
  let jwtService: jest.Mocked<JwtService>;

  beforeEach(async () => {
    const mockUsersRepository = {
      findByEmail: jest.fn(),
      createUser: jest.fn(),
    };
    const mockJwtService = {
      sign: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersRepository, useValue: mockUsersRepository },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    usersRepository = module.get(UsersRepository);
    jwtService = module.get(JwtService);
  });

  it('should register a new user with hashed password', async () => {
    usersRepository.findByEmail.mockResolvedValue(null);
    usersRepository.createUser.mockResolvedValue({
      id: 1,
      email: 'client@test.com',
      password_hash: 'hashed',
      full_name: 'John Client',
      role: UserRole.CLIENT,
      created_at: new Date(),
      updated_at: new Date(),
    });

    const result = await authService.register({
      email: 'client@test.com',
      password: 'password123',
      full_name: 'John Client',
      role: UserRole.CLIENT,
    });

    expect(result.id).toBe(1);
    expect(result.email).toBe('client@test.com');
    expect((result as any).password_hash).toBeUndefined();
  });

  it('should authenticate and return JWT token on login', async () => {
    const rawPassword = 'password123';
    const hashedPassword = await bcrypt.hash(rawPassword, 10);

    usersRepository.findByEmail.mockResolvedValue({
      id: 1,
      email: 'client@test.com',
      password_hash: hashedPassword,
      full_name: 'John Client',
      role: UserRole.CLIENT,
      created_at: new Date(),
      updated_at: new Date(),
    });

    jwtService.sign.mockReturnValue('mock_jwt_token');

    const result = await authService.login({
      email: 'client@test.com',
      password: rawPassword,
    });

    expect(result.access_token).toBe('mock_jwt_token');
    expect(result.user.email).toBe('client@test.com');
  });
});