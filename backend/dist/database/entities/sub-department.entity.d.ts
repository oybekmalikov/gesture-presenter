import { Department } from './department.entity';
export declare class SubDepartment {
    id: string;
    name: string;
    code: string;
    description: string;
    departmentId: string;
    department: Department;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    users: any[];
}
