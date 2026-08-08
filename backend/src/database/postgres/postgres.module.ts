import { Module, Global, OnApplicationShutdown, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';

export const PG_CONNECTION = 'PG_CONNECTION';

@Global()
@Module({
  providers: [
    {
      provide: PG_CONNECTION,
      useFactory: (configService: ConfigService) => {
        return new Pool({
          host: configService.get<string>('POSTGRES_HOST'),
          port: configService.get<number>('POSTGRES_PORT'),
          user: configService.get<string>('POSTGRES_USER'),
          password: configService.get<string>('POSTGRES_PASSWORD'),
          database: configService.get<string>('POSTGRES_DB'),
        });
      },
      inject: [ConfigService],
    },
  ],
  exports: [PG_CONNECTION],
})
export class PostgresModule implements OnApplicationShutdown {
  constructor(@Inject(PG_CONNECTION) private readonly pool: Pool) {}

  async onApplicationShutdown() {
    await this.pool.end();
  }
}