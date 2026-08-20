import { SeminarsService } from './seminars.service';
import { CreateSeminarDto } from './dto/create-seminar.dto';
import { UpdateSeminarDto } from './dto/update-seminar.dto';
import { UpdateSeminarStatusDto } from './dto/update-seminar-status.dto';
import { ReorderFilesDto } from './dto/reorder-files.dto';
import { QuerySeminarDto } from './dto/query-seminar.dto';
import { Role } from '../../common/enums/role.enum';
export declare class SeminarsController {
    private readonly seminarsService;
    constructor(seminarsService: SeminarsService);
    getDashboardStats(currentUser: any): Promise<import("../../common/response").ApiResponse<any>>;
    getPopularTags(): Promise<import("../../common/response").ApiResponse<any>>;
    getTargetSeminars(userId: string, page?: number, limit?: number): Promise<import("../../common/response").ApiResponse<any>>;
    findAll(query: QuerySeminarDto, currentUser: any): Promise<import("../../common/response").ApiResponse<any>>;
    findOne(id: string, currentUser: any): Promise<import("../../common/response").ApiResponse<any>>;
    getBookmarkedSeminars(userId: string, page?: number, limit?: number): Promise<import("../../common/response").ApiResponse<any>>;
    toggleBookmark(id: string, userId: string): Promise<import("../../common/response").ApiResponse<any>>;
    create(userId: string, userRole: Role, dto: CreateSeminarDto): Promise<import("../../common/response").ApiResponse<any>>;
    update(id: string, currentUser: any, dto: UpdateSeminarDto): Promise<import("../../common/response").ApiResponse<any>>;
    updateStatus(id: string, currentUser: any, dto: UpdateSeminarStatusDto): Promise<import("../../common/response").ApiResponse<any>>;
    reorderFiles(id: string, currentUser: any, dto: ReorderFilesDto): Promise<import("../../common/response").ApiResponse<any>>;
    remove(id: string, currentUser: any): Promise<import("../../common/response").ApiResponse<any>>;
}
