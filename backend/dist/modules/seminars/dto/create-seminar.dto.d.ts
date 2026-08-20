import { SeminarStatus, FileAccess } from '../../../common/enums';
export declare class CreateSeminarDto {
    title: string;
    description?: string;
    targetUserId?: string;
    departmentId?: string;
    status?: SeminarStatus;
    fileAccess?: FileAccess;
    scheduledAt?: string;
    tags?: string[];
}
