import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersRepository } from '../users/users.repository';
import { RegisterDto,LoginDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existingUser = await this.usersRepository.findByEmail(dto.email);
    if (existingUser) {
      throw new ConflictException({
        success: false,
        data: null,
        error: { code: 'USER_EXISTS', message: 'User with this email already exists', details: [] },
        timestamp: new Date().toISOString(),
      });
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.usersRepository.createUser(
      dto.email,
      passwordHash,
      dto.full_name,
      dto.role,
    );

    const { password_hash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async login(dto: LoginDto) {
    const user = await this.usersRepository.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException({
        success: false,
        data: null,
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password', details: [] },
        timestamp: new Date().toISOString(),
      });
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password_hash);
    if (!isPasswordValid) {
      throw new UnauthorizedException({
        success: false,
        data: null,
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password', details: [] },
        timestamp: new Date().toISOString(),
      });
    }

    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = this.jwtService.sign(payload);

    const { password_hash, ...userWithoutPassword } = user;

    return {
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: 86400,
      user: userWithoutPassword,
    };
  }
}