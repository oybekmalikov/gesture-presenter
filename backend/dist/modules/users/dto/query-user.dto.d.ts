import { Role } from '../../../common/enums/role.enum';
export declare class QueryUserDto {
    search?: string;
    role?: Role;
    departmentId?: string;
    isActive?: boolean;
    page?: number;
    limit?: number;
}
