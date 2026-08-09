import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RateLimiterGuard implements CanActivate {
  private redisClient: Redis;
  private readonly limit = 10; // 10 requests
  private readonly windowInSeconds = 60; // per 1 minute

  constructor(private configService: ConfigService) {
    this.redisClient = new Redis({
      host: this.configService.get<string>('REDIS_HOST', 'localhost'),
      port: this.configService.get<number>('REDIS_PORT', 6379),
    });
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const identifier = request.user?.id || request.ip;
    const route = request.route?.path || request.url;
    const key = `ratelimit:${identifier}:${route}`;

    const currentCount = await this.redisClient.incr(key);

    if (currentCount === 1) {
      await this.redisClient.expire(key, this.windowInSeconds);
    }

    if (currentCount > this.limit) {
      throw new HttpException(
        {
          success: false,
          data: null,
          error: {
            code: 'TOO_MANY_REQUESTS',
            message: `Rate limit exceeded. Maximum ${this.limit} requests per minute allowed.`,
            details: [],
          },
          timestamp: new Date().toISOString(),
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return true;
  }
}