import { Injectable, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, IsNull, Not } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';
import { SeminarFile } from '../../database/entities/seminar-file.entity';
import { Seminar } from '../../database/entities/seminar.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { ModelConverterService, ModelMetadata } from './model-converter.service';
import { MarkCleanupDto } from './dto/mark-cleanup.dto';
import {
  ApiResponse,
  successResponse,
  errorResponse,
  MESSAGES,
} from '../../common/response';
import { Role } from '../../common/enums/role.enum';
import { FileAccess } from '../../common/enums';

const MAX_3D_SIZE = 100 * 1024 * 1024; // 100MB
const MAX_DOC_SIZE = 50 * 1024 * 1024; // 50MB

@Injectable()
export class FilesService {
  private readonly uploadBase = path.resolve(process.cwd(), 'uploads');

  constructor(
    @InjectRepository(SeminarFile)
    private readonly fileRepo: Repository<SeminarFile>,
    @InjectRepository(Seminar)
    private readonly seminarRepo: Repository<Seminar>,
    private readonly notificationsService: NotificationsService,
    @Optional()
    private readonly modelConverter?: ModelConverterService,
  ) {
    this.ensureDirectories();
  }

  private ensureDirectories() {
    const dirs = ['pdf', 'glb', 'models', 'media', 'temp'];
    for (const d of dirs) {
      const full = path.join(this.uploadBase, d);
      if (!fs.existsSync(full)) {
        fs.mkdirSync(full, { recursive: true });
      }
    }
  }

  async uploadSeminarFile(
    seminarId: string,
    file: Express.Multer.File,
    userId: string,
    userRole: Role,
  ): Promise<ApiResponse> {
    const seminar = await this.seminarRepo.findOne({
      where: { id: seminarId },
    });
    if (!seminar) {
      this.safeUnlink(file.path);
      return errorResponse(MESSAGES.SEMINAR_NOT_FOUND);
    }

    if (
      seminar.authorId !== userId &&
      userRole !== Role.ADMIN &&
      userRole !== Role.SUPERADMIN
    ) {
      this.safeUnlink(file.path);
      return errorResponse(MESSAGES.FORBIDDEN);
    }

    const validation = this.validateFileSizeAndType(file);
    if (!validation.valid) {
      this.safeUnlink(file.path);
      return errorResponse(validation.error || MESSAGES.FILE_TOO_LARGE);
    }

    const currentCount = await this.fileRepo.count({ where: { seminarId } });

    const semFile = this.fileRepo.create({
      seminarId,
      originalName: file.originalname,
      storedName: file.filename,
      fileType: validation.fileType,
      mimeType: file.mimetype,
      size: file.size,
      storagePath: file.path,
      sortOrder: currentCount + 1,
    });

    const saved = await this.fileRepo.save(semFile);
    return successResponse(saved, MESSAGES.FILE_UPLOADED);
  }

  async uploadCoverImage(file: Express.Multer.File): Promise<ApiResponse> {
    const ext = path.extname(file.originalname).toLowerCase();
    const validImageExts = ['.png', '.jpg', '.jpeg', '.webp', '.svg'];
    if (!validImageExts.includes(ext)) {
      this.safeUnlink(file.path);
      return errorResponse({
        uz: 'Faqat rasm formatlari (.png, .jpg, .jpeg, .webp, .svg) qabul qilinadi',
        ru: 'Поддерживаются только форматы изображений (.png, .jpg, .jpeg, .webp, .svg)',
      });
    }

    const relativeUrl = `/uploads/media/${file.filename}`;
    return successResponse(
      {
        url: relativeUrl,
        filename: file.filename,
        originalName: file.originalname,
        size: file.size,
      },
      MESSAGES.FILE_UPLOADED,
    );
  }

  async uploadMultipleSeminarFiles(
    seminarId: string,
    files: Express.Multer.File[],
    userId: string,
    userRole: Role,
  ): Promise<ApiResponse> {
    const seminar = await this.seminarRepo.findOne({
      where: { id: seminarId },
    });
    if (!seminar) {
      files.forEach((f) => this.safeUnlink(f.path));
      return errorResponse(MESSAGES.SEMINAR_NOT_FOUND);
    }

    if (
      seminar.authorId !== userId &&
      userRole !== Role.ADMIN &&
      userRole !== Role.SUPERADMIN
    ) {
      files.forEach((f) => this.safeUnlink(f.path));
      return errorResponse(MESSAGES.FORBIDDEN);
    }

    let currentOrder = await this.fileRepo.count({ where: { seminarId } });
    const savedFiles: SeminarFile[] = [];
    const errors: { filename: string; reason: string }[] = [];

    for (const file of files) {
      const validation = this.validateFileSizeAndType(file);
      if (!validation.valid) {
        this.safeUnlink(file.path);
        errors.push({
          filename: file.originalname,
          reason: validation.error?.uz || 'Fayl hajmi yoki formati noto`g`ri',
        });
        continue;
      }

      currentOrder += 1;
      const semFile = this.fileRepo.create({
        seminarId,
        originalName: file.originalname,
        storedName: file.filename,
        fileType: validation.fileType,
        mimeType: file.mimetype,
        size: file.size,
        storagePath: file.path,
        sortOrder: currentOrder,
      });

      const saved = await this.fileRepo.save(semFile);
      savedFiles.push(saved);
    }

    return successResponse(
      {
        total: files.length,
        successCount: savedFiles.length,
        failedCount: errors.length,
        uploadedFiles: savedFiles,
        errors,
      },
      {
        uz: `${savedFiles.length} ta fayl muvaffaqiyatli yuklandi`,
        ru: `${savedFiles.length} файлов успешно загружено`,
      },
    );
  }

  async findBySeminar(seminarId: string): Promise<ApiResponse> {
    const files = await this.fileRepo.find({
      where: { seminarId },
      order: { sortOrder: 'ASC', createdAt: 'ASC' },
    });
    return successResponse(files, MESSAGES.FETCHED);
  }

  async findOne(id: string): Promise<SeminarFile | null> {
    return this.fileRepo.findOne({
      where: { id },
      relations: { seminar: true },
    });
  }

  checkFilePermission(
    file: SeminarFile,
    currentUser: any,
    action: 'view' | 'download',
  ): boolean {
    const seminar = file.seminar;
    if (!seminar) return true;

    // 1. PUBLIC files: both view and download are open to everyone
    if (seminar.fileAccess === FileAccess.PUBLIC) {
      return true;
    }

    // 2. READABLE files: view is open, download is restricted
    if (seminar.fileAccess === FileAccess.READABLE) {
      if (action === 'view') {
        return true;
      }
      if (action === 'download') {
        if (
          currentUser &&
          (currentUser.role === Role.ADMIN ||
            currentUser.role === Role.SUPERADMIN ||
            currentUser.id === seminar.authorId)
        ) {
          return true;
        }
        return false;
      }
    }

    // 3. PRIVATE files: restricted for both view and download
    if (seminar.fileAccess === FileAccess.PRIVATE) {
      if (!currentUser) return false;
      if (
        currentUser.role === Role.ADMIN ||
        currentUser.role === Role.SUPERADMIN ||
        currentUser.id === seminar.authorId ||
        currentUser.id === seminar.targetUserId ||
        (currentUser.departmentId &&
          currentUser.departmentId === seminar.departmentId)
      ) {
        return true;
      }
      return false;
    }

    return true;
  }

  async remove(
    id: string,
    userId: string,
    userRole: Role,
  ): Promise<ApiResponse> {
    const file = await this.fileRepo.findOne({
      where: { id },
      relations: { seminar: true },
    });

    if (!file) {
      return errorResponse(MESSAGES.FILE_NOT_FOUND);
    }

    if (
      file.seminar?.authorId !== userId &&
      userRole !== Role.ADMIN &&
      userRole !== Role.SUPERADMIN
    ) {
      return errorResponse(MESSAGES.FORBIDDEN);
    }

    this.safeUnlink(file.storagePath);
    await this.fileRepo.remove(file);
    return successResponse(null, MESSAGES.FILE_DELETED);
  }

  // ==================== ADMIN RETENTION & SCHEDULED CLEANUP ====================

  async markFilesForCleanup(
    dto: MarkCleanupDto,
    adminId: string,
  ): Promise<ApiResponse> {
    if (!dto.fileIds || dto.fileIds.length === 0) {
      return errorResponse({
        uz: 'O`chirish uchun fayllar tanlanmadi',
        ru: 'Файлы для удаления не выбраны',
      });
    }

    const files = await this.fileRepo.find({
      where: { id: In(dto.fileIds) },
      relations: { seminar: { author: true } },
    });

    if (files.length === 0) {
      return errorResponse(MESSAGES.NOT_FOUND);
    }

    const now = new Date();
    const scheduledDate = new Date(
      now.getTime() + dto.retentionDays * 24 * 3600 * 1000,
    );

    for (const file of files) {
      file.markedForDeletionAt = now;
      file.deletionScheduledDate = scheduledDate;
      file.deletionReason =
        dto.reason ||
        'Eski yoki kam foydalanilgan fayllar xotirani tejash maqsadida o`chirilishga qo`yildi';
      file.markedByUserId = adminId;
      await this.fileRepo.save(file);

      // Send warning notification to owner
      if (file.seminar?.authorId) {
        this.notificationsService.notifyFileDeleteWarning(
          file.seminar.authorId,
          file.originalName,
          file.seminar.title,
          dto.retentionDays,
        ).catch(() => {});
      }
    }

    return successResponse(
      {
        count: files.length,
        scheduledDate,
        retentionDays: dto.retentionDays,
      },
      {
        uz: `${files.length} ta fayl ${dto.retentionDays} kundan so'ng o'chirilishga belgilandi va egalari ogohlantirildi`,
        ru: `${files.length} файлов запланированы к удалению через ${dto.retentionDays} дн. Владельцы уведомлены.`,
      },
    );
  }

  async cancelCleanup(fileIds: string[]): Promise<ApiResponse> {
    if (!fileIds || fileIds.length === 0) {
      return errorResponse(MESSAGES.BAD_REQUEST);
    }

    await this.fileRepo.update(
      { id: In(fileIds) },
      {
        markedForDeletionAt: null as any,
        deletionScheduledDate: null as any,
        deletionReason: null as any,
        markedByUserId: null as any,
      },
    );

    return successResponse(
      null,
      {
        uz: 'Fayllarni o`chirish bekor qilindi',
        ru: 'Удаление файлов отменено',
      },
    );
  }

  async forceDelete(fileId: string): Promise<ApiResponse> {
    const file = await this.fileRepo.findOne({ where: { id: fileId } });
    if (!file) {
      return errorResponse(MESSAGES.FILE_NOT_FOUND);
    }

    this.safeUnlink(file.storagePath);
    await this.fileRepo.remove(file);

    return successResponse(null, MESSAGES.FILE_DELETED);
  }

  async getPendingCleanupFiles(): Promise<ApiResponse> {
    const files = await this.fileRepo.find({
      where: {
        deletionScheduledDate: Not(IsNull()),
      },
      relations: { seminar: { author: true } },
      order: { deletionScheduledDate: 'ASC' },
    });

    const now = new Date().getTime();
    const result = files.map((f) => {
      const remainingMs = new Date(f.deletionScheduledDate).getTime() - now;
      const remainingDays = Math.max(0, Math.ceil(remainingMs / (24 * 3600 * 1000)));
      return {
        ...f,
        remainingDays,
      };
    });

    return successResponse(result, MESSAGES.FETCHED);
  }

  async getAdminCleanupCandidates(): Promise<ApiResponse> {
    const files = await this.fileRepo
      .createQueryBuilder('file')
      .leftJoinAndSelect('file.seminar', 'seminar')
      .leftJoinAndSelect('seminar.author', 'author')
      .where('file.deletionScheduledDate IS NULL')
      .orderBy('file.createdAt', 'ASC')
      .take(100)
      .getMany();

    return successResponse(files, MESSAGES.FETCHED);
  }

  // ==================== 3D MODEL INSPECTOR ====================
  async inspect3DModel(fileId: string): Promise<ApiResponse<ModelMetadata | null>> {
    const file = await this.fileRepo.findOne({ where: { id: fileId } });
    if (!file || !fs.existsSync(file.storagePath)) {
      return errorResponse(MESSAGES.FILE_NOT_FOUND);
    }

    if (!this.modelConverter) {
      return successResponse(null, MESSAGES.FETCHED);
    }

    const metadata = await this.modelConverter.inspect3DModel(file.storagePath);
    return successResponse(metadata, MESSAGES.FETCHED);
  }

  private validateFileSizeAndType(file: Express.Multer.File): {
    valid: boolean;
    fileType: string;
    error?: any;
  } {
    const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
    const is3D = ['step', 'stp', 'glb', 'gltf'].includes(ext);

    let fileType = 'other';
    if (['pdf'].includes(ext)) fileType = 'pdf';
    else if (is3D) fileType = '3d';
    else if (['pptx', 'ppt'].includes(ext)) fileType = 'presentation';
    else if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext))
      fileType = 'image';
    else if (['mp4', 'webm', 'mkv', 'mov'].includes(ext)) fileType = 'video';

    // 100MB for 3D, 50MB for all other documents/media
    const maxSize = is3D ? MAX_3D_SIZE : MAX_DOC_SIZE;
    if (file.size > maxSize) {
      return {
        valid: false,
        fileType,
        error: {
          uz: is3D
            ? '3D obyekt fayli 100 MB dan oshmasligi kerak'
            : 'Fayl hajmi 50 MB dan oshmasligi kerak',
          ru: is3D
            ? 'Размер 3D файла не должен превышать 100 МБ'
            : 'Размер файла не должен превышать 50 МБ',
        },
      };
    }

    return { valid: true, fileType };
  }

  private safeUnlink(filePath?: string) {
    if (filePath && fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch {
        // Ignore file removal errors
      }
    }
  }
}
