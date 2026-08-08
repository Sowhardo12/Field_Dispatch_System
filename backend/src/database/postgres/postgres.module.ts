import { Module, Global, OnApplicationShutdown,OnModuleInit, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';


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
export class PostgresModule implements OnModuleInit, OnApplicationShutdown {
  constructor(@Inject(PG_CONNECTION) private readonly pool: Pool) {}

  async onModuleInit() {
      const schemaPath = path.join(__dirname,'init.sql')
      if(fs.existsSync(schemaPath)){
        const sql = fs.readFileSync(schemaPath,'utf-8')
        await this.pool.query(sql)
      }
  }
  async onApplicationShutdown() {
    await this.pool.end();
  }
}