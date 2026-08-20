import { User } from './user.entity';
export declare class Department {
    id: string;
    name: string;
    code: string;
    description: string;
    headUserId: string;
    headUser: User;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    subDepartments: any[];
    users: any[];
}
