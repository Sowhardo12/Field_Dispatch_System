import { Injectable, Inject } from '@nestjs/common';
import { Pool, QueryResult, QueryResultRow } from 'pg';
import { PG_CONNECTION } from './postgres.module';

@Injectable()
export class PostgresService {
  constructor(@Inject(PG_CONNECTION) private readonly pool: Pool) {}

  async query<T extends QueryResultRow = any>(
    text: string,
    params?: any[],
  ): Promise<QueryResult<T>> {
    return this.pool.query<T>(text, params);
  }

  getPool(): Pool {
    return this.pool;
  }
}