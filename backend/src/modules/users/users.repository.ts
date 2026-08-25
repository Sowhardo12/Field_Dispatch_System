import { Injectable, Inject } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_CONNECTION } from '../../database/postgres/postgres.module';
import { UserEntity, UserRole } from '../../common/interfaces/domain.interface';

@Injectable()
export class UsersRepository{
  constructor(@Inject(PG_CONNECTION) private readonly pool:Pool){}
  async createUser(
    email:string,
    password_hash: string,
    fullName: string,
    role: UserRole,
    technician_type?:string,
    area_name?:string,
  ):Promise<UserEntity>{
    const query = `
      INSERT INTO users (email, password_hash, full_name, role,technician_type,area_name)
      VALUES ($1, $2, $3, $4,$5,$6)
      RETURNING id, email, password_hash, full_name, role, technician_type,area_name, created_at, updated_at;
    `;
    const values = [email,password_hash,fullName,role,technician_type || null, area_name || null];
    const result = await this.pool.query(query,values);
    return result.rows[0];
  }
  async findByEmail(email: string): Promise<UserEntity | null> {
    const query = `
      SELECT id, email, password_hash, full_name, role, created_at, updated_at
      FROM users
      WHERE email = $1;
    `;
    const result = await this.pool.query(query, [email]);
    return result.rows[0] || null;
  }

  async findById(id: number): Promise<UserEntity | null> {
    const query = `
      SELECT id, email, password_hash, full_name, role, created_at, updated_at
      FROM users
      WHERE id = $1;
    `;
    const result = await this.pool.query(query, [id]);
    return result.rows[0] || null;
  }

}