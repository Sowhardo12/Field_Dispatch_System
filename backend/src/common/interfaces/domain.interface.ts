export enum UserRole {
  CLIENT = 'CLIENT',
  DISPATCHER = 'DISPATCHER',
  TECHNICIAN = 'TECHNICIAN',
  ADMIN = 'ADMIN',
}

export enum WorkOrderStatus {
  CREATED = 'CREATED',
  DISPATCHED = 'DISPATCHED',
  OFFERED = 'OFFERED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CLOSED = 'CLOSED',
}

export interface UserEntity {
  id: number;
  email: string;
  password_hash: string;
  full_name: string;
  role: UserRole;
  created_at: Date;
  updated_at: Date;
}

export interface WorkOrderEntity {
  id: number;
  title: string;
  description: string;
  status: WorkOrderStatus;
  client_id: number;
  technician_id: number | null;
  created_at: Date;
  updated_at: Date;
}