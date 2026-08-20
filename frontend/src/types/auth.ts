export enum Role {
  SUPERADMIN = 'superadmin',
  ADMIN = 'admin',
  HEAD_DEPARTMENT = 'head_department',
  USER = 'user',
}

export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
}

export interface User {
  id: string;
  fio: string;
  username: string;
  role: Role;
  gender?: Gender;
  lavozim?: string;
  positionId?: string;
  position?: {
    id: string;
    name: string;
    code?: string;
  };
  departmentId?: string;
  department?: {
    id: string;
    name: string;
    code: string;
  };
  subDepartmentId?: string;
  subDepartment?: {
    id: string;
    name: string;
    code: string;
  };
  email?: string;
  phone?: string;
  avatarUrl?: string;
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: {
    uz: string;
    ru: string;
  } | string;
  data: T;
  timestamp?: string;
}
