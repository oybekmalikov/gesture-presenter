import { Role } from '../../../common/enums/role.enum';
import { Gender } from '../../../common/enums';
export declare class BulkImportUserItemDto {
    fio: string;
    username: string;
    password?: string;
    role?: Role;
    gender?: Gender;
    lavozim?: string;
    departmentCodeOrId?: string;
    subDepartmentCodeOrId?: string;
    positionCodeOrId?: string;
    email?: string;
    phone?: string;
}
export declare class BulkImportUsersDto {
    users: BulkImportUserItemDto[];
}
