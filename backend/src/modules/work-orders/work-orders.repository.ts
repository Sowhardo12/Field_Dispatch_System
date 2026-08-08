import { Injectable, Inject } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_CONNECTION } from '../../database/postgres/postgres.module';
import { WorkOrderEntity, WorkOrderStatus } from '../../common/interfaces/domain.interface';

@Injectable()
export class WorkOrdersRepository {
  constructor(@Inject(PG_CONNECTION) private readonly pool: Pool) {}

  async create(title: string, description: string, clientId: number): Promise<WorkOrderEntity> {
    const query = `
      INSERT INTO work_orders (title, description, client_id, status)
      VALUES ($1, $2, $3, 'CREATED')
      RETURNING id, title, description, status, client_id, technician_id, created_at, updated_at;
    `;
    const result = await this.pool.query(query, [title, description, clientId]);
    return result.rows[0];
  }

  async findById(id: number): Promise<WorkOrderEntity | null> {
    const query = `
      SELECT id, title, description, status, client_id, technician_id, created_at, updated_at
      FROM work_orders
      WHERE id = $1;
    `;
    const result = await this.pool.query(query, [id]);
    return result.rows[0] || null;
  }

  async findAllPaginated(
    status?: WorkOrderStatus,
    page = 1,
    limit = 10,
  ): Promise<{ data: WorkOrderEntity[]; total: number }> {
    const offset = (page - 1) * limit;
    let whereClause = '';
    const params: any[] = [];

    if (status) {
      whereClause = 'WHERE status = $1';
      params.push(status);
    }

    const countQuery = `SELECT COUNT(*) FROM work_orders ${whereClause};`;
    const countResult = await this.pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0].count, 10);

    const dataQuery = `
      SELECT id, title, description, status, client_id, technician_id, created_at, updated_at
      FROM work_orders
      ${whereClause}
      ORDER BY id DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2};
    `;
    params.push(limit, offset);

    const dataResult = await this.pool.query(dataQuery, params);
    return { data: dataResult.rows, total };
  }

  async updateStatus(
    id: number,
    status: WorkOrderStatus,
    technicianId?: number | null,
  ): Promise<WorkOrderEntity | null> {
    let query: string;
    let params: any[];

    if (technicianId !== undefined) {
      query = `
        UPDATE work_orders
        SET status = $1, technician_id = $2, updated_at = CURRENT_TIMESTAMP
        WHERE id = $3
        RETURNING id, title, description, status, client_id, technician_id, created_at, updated_at;
      `;
      params = [status, technicianId, id];
    } else {
      query = `
        UPDATE work_orders
        SET status = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING id, title, description, status, client_id, technician_id, created_at, updated_at;
      `;
      params = [status, id];
    }

    const result = await this.pool.query(query, params);
    return result.rows[0] || null;
  }
}