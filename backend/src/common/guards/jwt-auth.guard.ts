import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {

  //redis accesstoken blacklist logic goes here

  private redisClient: Redis;

  constructor(private configService: ConfigService) {
    super();
    this.redisClient = new Redis({
      host: this.configService.get<string>('REDIS_HOST', 'localhost'),
      port: this.configService.get<number>('REDIS_PORT', 6379),
    });
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    
    const isValid = (await super.canActivate(context)) as boolean;
    if (!isValid) return false;

    
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const isBlacklisted = await this.redisClient.get(`blacklist:access:${token}`);
      if (isBlacklisted) {
        throw new UnauthorizedException({
          success: false,
          data: null,
          error: {
            code: 'TOKEN_REVOKED',
            message: 'Access token has been revoked due to logout',
            details: [],
          },
          timestamp: new Date().toISOString(),
        });
      }
    }

    return true;
  }
  
  handleRequest(err: any, user: any, info: any) {
    if (err || !user) {
      throw err || new UnauthorizedException({
        success: false,
        data: null,
        error: { code: 'UNAUTHORIZED', message: 'Access token is missing or expired', details: [] },
        timestamp: new Date().toISOString(),
      });
    }
    return user;
  }
}