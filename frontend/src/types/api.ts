export interface ApiResponse<T> {
  success: true;
  data: T;
  error: null;
  timestamp: string;
}

export interface ApiErrorResponse {
  success: false;
  data: null;
  error: {
    code: string;
    message: string;
    details: Array<{ field: string; message: string }>;
  };
  timestamp: string;
}

export type Role = 'CLIENT' | 'TECHNICIAN' | 'DISPATCHER' | 'ADMIN';

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: Role;
}