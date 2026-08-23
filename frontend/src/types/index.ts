// src/types/index.ts

export type UserRole = "CLIENT" | "DISPATCHER" | "TECHNICIAN" | "ADMIN";

export type WorkOrderStatus =
  | "CREATED"
  | "DISPATCHED"
  | "OFFERED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CLOSED";

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: UserRole;
  created_at?: string;
  updated_at?: string;
}

export interface WorkOrder {
  id: number;
  title: string;
  description: string;
  status: WorkOrderStatus;
  client_id: number;
  technician_id?: number | null;
  client?: User;
  technician?: User;
  created_at: string;
  updated_at: string;
}

export interface WorkLog {
  _id?: string;
  work_order_id: number;
  technician_id: number;
  checklists: string[];
  hardware_metadata?: Record<string, any>;
  technician_notes: string;
  created_at?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: {
    code: string;
    message: string;
    details?: unknown[];
  } | null;
  timestamp: string;
}

export interface AuthResponseData {
  access_token: string;
  refresh_token: string;
  user: User;
}