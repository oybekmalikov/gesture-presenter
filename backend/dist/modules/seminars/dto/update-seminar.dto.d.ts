import { SeminarStatus, FileAccess } from '../../../common/enums';
export declare class UpdateSeminarDto {
    title?: string;
    description?: string;
    targetUserId?: string;
    departmentId?: string;
    status?: SeminarStatus;
    fileAccess?: FileAccess;
    scheduledAt?: string;
    isLive?: boolean;
    isRecorded?: boolean;
    tags?: string[];
}
