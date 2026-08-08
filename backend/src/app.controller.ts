import { Controller, Get, Inject } from '@nestjs/common';
import { AppService } from './app.service';
import { InjectConnection } from '@nestjs/mongoose';
import {Connection} from 'mongoose';
import { Pool } from 'pg';
import Redis from 'ioredis';
import { PG_CONNECTION } from './database/postgres/postgres.module';
import { ConfigService } from '@nestjs/config';


@Controller('health')
export class AppController {
  private redisClient : Redis;
  constructor(
    @Inject(PG_CONNECTION) private readonly pgPool: Pool,
    @InjectConnection() private readonly mongoConnection: Connection,
    private readonly configService: ConfigService,
  ) {
    this.redisClient = new Redis({
      host: this.configService.get<string>('REDIS_HOST'),
      port: this.configService.get<number>('REDIS_PORT'),
    });
  }
  
@Get()
  async checkHealth() {
    // 1. Check PostgreSQL
    let pgStatus = 'DOWN';
    try {
      const res = await this.pgPool.query('SELECT 1');
      if (res.rows.length > 0) pgStatus = 'UP';
    } catch {
      pgStatus = 'DOWN';
    }

    // 2. Check MongoDB
    const mongoStatus = this.mongoConnection.readyState === 1 ? 'UP' : 'DOWN';

    // 3. Check Redis
    let redisStatus = 'DOWN';
    try {
      const ping = await this.redisClient.ping();
      if (ping === 'PONG') redisStatus = 'UP';
    } catch {
      redisStatus = 'DOWN';
    }

    return {
      success: true,
      data: {
        status: 'ok',
        services: {
          postgres: pgStatus,
          mongodb: mongoStatus,
          redis: redisStatus,
        },
      },
      error: null,
      timestamp: new Date().toISOString(),
    };
  }
}
