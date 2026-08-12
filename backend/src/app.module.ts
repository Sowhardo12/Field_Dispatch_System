import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { PostgresModule } from './database/postgres/postgres.module';
import { AppController } from './app.controller';
import { AuthModule } from './modules/auth/auth.module';
import { WorkOrdersModule } from './modules/work-orders/work-orders.module';
import { BullModule } from '@nestjs/bull';
import { ExecutionLogsModule } from './modules/execution-logs/execution-logs.module';
import { HealthController } from './modules/health/health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    PostgresModule,

    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('MONGO_URI'),
      }),
      inject: [ConfigService],
    }),
    BullModule.forRootAsync({
      imports:[ConfigModule],
      useFactory:(configService:ConfigService)=>({
        redis:{
          host: configService.get<string>('REDIS_HOST', 'localhost'),
          port: configService.get<number>('REDIS_PORT', 5356),
        },
      }),inject:[ConfigService],
    }),
    AuthModule,
    WorkOrdersModule,
    ExecutionLogsModule,

  ],
  controllers: [AppController,HealthController],
})
export class AppModule {}