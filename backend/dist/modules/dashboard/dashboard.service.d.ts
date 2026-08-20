import { Repository } from 'typeorm';
import { Seminar } from '../../database/entities/seminar.entity';
import { User } from '../../database/entities/user.entity';
import { Department } from '../../database/entities/department.entity';
import { SeminarFile } from '../../database/entities/seminar-file.entity';
import { Like } from '../../database/entities/like.entity';
import { Comment } from '../../database/entities/comment.entity';
import { SavedSeminar } from '../../database/entities/saved-seminar.entity';
import { AuditLog } from '../../database/entities/audit-log.entity';
import { Tag } from '../../database/entities/tag.entity';
import { ApiResponse } from '../../common/response';
export declare class DashboardService {
    private readonly seminarRepo;
    private readonly userRepo;
    private readonly departmentRepo;
    private readonly fileRepo;
    private readonly likeRepo;
    private readonly commentRepo;
    private readonly savedRepo;
    private readonly auditRepo;
    private readonly tagRepo;
    constructor(seminarRepo: Repository<Seminar>, userRepo: Repository<User>, departmentRepo: Repository<Department>, fileRepo: Repository<SeminarFile>, likeRepo: Repository<Like>, commentRepo: Repository<Comment>, savedRepo: Repository<SavedSeminar>, auditRepo: Repository<AuditLog>, tagRepo: Repository<Tag>);
    getMainDashboard(currentUser?: any): Promise<ApiResponse>;
    getGuestDashboard(): Promise<ApiResponse>;
    getUserDashboard(currentUser: any): Promise<ApiResponse>;
    getDepartmentHeadDashboard(currentUser: any): Promise<ApiResponse>;
    getAdminDashboard(currentUser?: any): Promise<ApiResponse>;
    getSuperadminDashboard(currentUser: any): Promise<ApiResponse>;
}
