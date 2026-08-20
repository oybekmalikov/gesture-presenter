import type { Response } from 'express';
import { UsersService } from './users.service';
import { RegisterDto } from '../auth/dto/register.dto';
import { QueryUserDto } from './dto/query-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { BulkImportUsersDto } from './dto/bulk-import-user.dto';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    uploadAvatar(userId: string, file: Express.Multer.File): Promise<import("../../common/response").ApiResponse<any>>;
    deleteAvatar(userId: string): Promise<import("../../common/response").ApiResponse<any>>;
    serveAvatar(filename: string, res: Response): void;
    bulkImport(dto: BulkImportUsersDto): Promise<import("../../common/response").ApiResponse<any>>;
    getMyTeam(currentUser: any, query: QueryUserDto): Promise<import("../../common/response").ApiResponse<any>>;
    getMyProfile(userId: string): Promise<import("../../common/response").ApiResponse<any>>;
    updateMyProfile(userId: string, dto: UpdateProfileDto): Promise<import("../../common/response").ApiResponse<any>>;
    create(dto: RegisterDto): Promise<import("../../common/response").ApiResponse<any>>;
    findAll(query: QueryUserDto): Promise<import("../../common/response").ApiResponse<any>>;
    findOne(id: string): Promise<import("../../common/response").ApiResponse<any>>;
    update(id: string, dto: Partial<RegisterDto>): Promise<import("../../common/response").ApiResponse<any>>;
    remove(id: string): Promise<import("../../common/response").ApiResponse<any>>;
    toggleActive(id: string): Promise<import("../../common/response").ApiResponse<any>>;
}
