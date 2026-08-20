import { Role } from '../../../common/enums/role.enum';
import { Gender } from '../../../common/enums';
export declare class RegisterDto {
    id?: string;
    fio: string;
    username: string;
    password: string;
    role?: Role;
    gender?: Gender;
    lavozim?: string;
    positionId?: string;
    departmentId?: string;
    subDepartmentId?: string;
    email?: string;
    phone?: string;
}
