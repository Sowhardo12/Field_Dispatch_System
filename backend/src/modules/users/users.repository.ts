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
  ):Promise<UserEntity>{
    const query = `
      INSERT INTO users (email, password_hash, full_name, role)
      VALUES ($1, $2, $3, $4)
      RETURNING id, email, password_hash, full_name, role, created_at, updated_at;
    `;
    const values = [email,password_hash,fullName,role];
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