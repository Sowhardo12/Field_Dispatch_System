import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersRepository } from '../users/users.repository';
import { RegisterDto,LoginDto,RefreshTokenDto,LogoutDto } from './dto/auth.dto';
import { v4 as uuidv4 } from 'uuid';
import Redis from 'ioredis';
import {ConfigService } from '@nestjs/config';
import { access } from 'fs';

@Injectable()
export class AuthService {
  private redisClient:Redis;
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    this.redisClient = new Redis({
      host: this.configService.get<string>('REDIS_HOST', 'localhost'),
      port: this.configService.get<number>('REDIS_PORT', 6379),
    });
  }
  
  private async generateTokenPair(userId: number, email: string, role: string) {
    const tokenId = uuidv4();
    const payload = { sub: userId, email, role, tokenId };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: '15m',
    });

    const refreshToken = this.jwtService.sign(
      { sub: userId, tokenId },
      { expiresIn: '7d' },
    );

    // Save refresh token key to Redis with 7-day TTL (604800 seconds)
    const redisKey = `refresh:${userId}:${tokenId}`;
    await this.redisClient.set(redisKey, refreshToken, 'EX', 604800);

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      token_type: 'Bearer',
      expires_in: 900, // 15 minutes in seconds
    };
  }

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
    //explanation sudocode 
    //1. const {SALT, HashingInfo} = getFrom(user.password_hash)
    //2. const newHash = bcrypt.hash(dto.password,SALT)
    //3. compare (newHash, user.password_hash) ? VALID : Refuse 



    if (!isPasswordValid) {
      throw new UnauthorizedException({
        success: false,
        data: null,
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password', details: [] },
        timestamp: new Date().toISOString(),
      });
    }
    const tokens = await this.generateTokenPair(user.id,user.email,user.role);
    const {password_hash,...userWithoutPassword} = user;
    return {
      ...tokens, user: userWithoutPassword,
    }
    // const payload = { sub: user.id, email: user.email, role: user.role };
    // const accessToken = this.jwtService.sign(payload);

    // const { password_hash, ...userWithoutPassword } = user;

    // return {
    //   access_token: accessToken,
    //   token_type: 'Bearer',
    //   expires_in: 86400,    //for development, we take 24 hours token validity
    //   user: userWithoutPassword,
    // };
  }

  async refreshToken(dto:RefreshTokenDto){
    let payload:any;
    try{
      payload=this.jwtService.verify(dto.refresh_token);
    }catch{
      //in case refresh token is not valid anymore 
      throw new UnauthorizedException({
        success: false,
        data: null,
        error: { code: 'INVALID_TOKEN', message: 'Invalid or expired refresh token', details: [] },
        timestamp: new Date().toISOString(),
      });
    }
    const {sub:userId,tokenId} = payload;
    const redisKey = `refresh:${userId}:${tokenId}`;
    const storedToken = await this.redisClient.get(redisKey);
    if(!storedToken || storedToken!==dto.refresh_token){
      //either token expired/user logged out/someone using users old token
      throw new UnauthorizedException({
        success: false,
        data: null,
        error: { code: 'TOKEN_REVOKED', message: 'Refresh token has been revoked or expired', details: [] },
        timestamp: new Date().toISOString(),
      });
    }
    const user = await this.usersRepository.findById(userId);
    if (!user) {
      throw new UnauthorizedException({
        success: false,
        data: null,
        error: { code: 'USER_NOT_FOUND', message: 'User associated with token no longer exists', details: [] },
        timestamp: new Date().toISOString(),
      });
    }

    //user is found:  invalidate old refreshtoken 
    await this.redisClient.del(redisKey);

    //issue new pair of tokens
    const tokens = await this.generateTokenPair(user.id, user.email, user.role);
    const { password_hash, ...userWithoutPassword } = user;

    return {
      ...tokens,
      user: userWithoutPassword,
    };
  }

  async logout(accessToken:string,dto:LogoutDto){
    // from refreshtoken, extract payload and then build redisKey, and delete the key 
    try {
      const refreshPayload  = this.jwtService.verify(dto.refresh_token);
  
      const { sub: userId, tokenId } = refreshPayload;
      const redisKey = `refresh:${userId}:${tokenId}`;
      await this.redisClient.del(redisKey);  // deleting refreshToken from redis
    } catch {
      return { message: 'Logged out successfully (token already expired)' };
    }
    //black list access token to prevent hacking
    try{
      const accessPayload : any = this.jwtService.decode(accessToken);
      if(accessPayload && accessPayload.exp){
        const now = Math.floor(Date.now() / 1000);
        const ttl = accessPayload.exp - now;
        if(ttl>0){
          //if token is still valid during logout
          const blacklistKey = `blacklist:access:${accessToken}`;
          await this.redisClient.set(blacklistKey, 'revoked', 'EX', ttl);
        }
      }
    }catch{return { message: 'something went wrong regarding redis' };}
    return { message: 'Logged out successfully' };

  }

  async getProfile(userId: number) {
    const user = await this.usersRepository.findById(userId);
    if (!user) {
      throw new UnauthorizedException({
        success: false,
        data: null,
        error: { code: 'USER_NOT_FOUND', message: 'User not found', details: [] },
        timestamp: new Date().toISOString(),
      });
    }

    const { password_hash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}