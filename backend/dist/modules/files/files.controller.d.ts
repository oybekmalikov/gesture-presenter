import type { Response } from 'express';
import { FilesService } from './files.service';
import { MarkCleanupDto } from './dto/mark-cleanup.dto';
export declare class FilesController {
    private readonly filesService;
    constructor(filesService: FilesService);
    uploadFile(seminarId: string, file: Express.Multer.File, currentUser: any): Promise<import("../../common/response").ApiResponse<any>>;
    uploadMultiple(seminarId: string, files: Express.Multer.File[], currentUser: any): Promise<import("../../common/response").ApiResponse<any>>;
    findBySeminar(seminarId: string): Promise<import("../../common/response").ApiResponse<any>>;
    viewFile(id: string, currentUser: any, res: Response): Promise<void>;
    downloadFile(id: string, currentUser: any, res: Response): Promise<void>;
    inspect3DModel(id: string): Promise<import("../../common/response").ApiResponse<import("./model-converter.service").ModelMetadata | null>>;
    remove(id: string, currentUser: any): Promise<import("../../common/response").ApiResponse<any>>;
    getCleanupCandidates(): Promise<import("../../common/response").ApiResponse<any>>;
    getPendingCleanup(): Promise<import("../../common/response").ApiResponse<any>>;
    markCleanup(dto: MarkCleanupDto, adminId: string): Promise<import("../../common/response").ApiResponse<any>>;
    cancelCleanup(fileIds: string[]): Promise<import("../../common/response").ApiResponse<any>>;
    forceDelete(id: string): Promise<import("../../common/response").ApiResponse<any>>;
}
