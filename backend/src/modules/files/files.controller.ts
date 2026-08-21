import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  Res,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import type { Response } from 'express';
import * as path from 'path';
import * as fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { FilesService } from './files.service';
import { MarkCleanupDto } from './dto/mark-cleanup.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../../common/guards/optional-jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Audit } from '../../common/decorators/audit.decorator';
import { Role } from '../../common/enums/role.enum';

const uploadStorage = diskStorage({
  destination: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
    let subDir = 'media';
    if (['pdf', 'pptx', 'ppt'].includes(ext)) subDir = 'pdf';
    else if (['step', 'stp', 'glb', 'gltf'].includes(ext)) subDir = 'glb';
    else if (['mp4', 'webm', 'mkv', 'mov'].includes(ext)) subDir = 'media';

    const dir = path.resolve(process.cwd(), 'uploads', subDir);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = `${uuidv4()}${ext}`;
    cb(null, uniqueName);
  },
});

@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post('upload-cover')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: uploadStorage,
      limits: {
        fileSize: 10 * 1024 * 1024,
      },
    }),
  )
  uploadCover(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Rasm yuborilmadi');
    }
    return this.filesService.uploadCoverImage(file);
  }

  @Post('upload/:seminarId')
  @UseGuards(JwtAuthGuard)
  @Audit({ action: 'file_upload', entityType: 'file' })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: uploadStorage,
      limits: {
        fileSize: 100 * 1024 * 1024, // 100MB max
      },
    }),
  )
  uploadFile(
    @Param('seminarId') seminarId: string,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() currentUser: any,
  ) {
    if (!file) {
      throw new BadRequestException('Fayl yuborilmadi');
    }
    return this.filesService.uploadSeminarFile(
      seminarId,
      file,
      currentUser.id,
      currentUser.role,
    );
  }

  @Post('upload/:seminarId/multiple')
  @UseGuards(JwtAuthGuard)
  @Audit({ action: 'multiple_files_upload', entityType: 'file' })
  @UseInterceptors(
    FilesInterceptor('files', 20, {
      storage: uploadStorage,
      limits: {
        fileSize: 100 * 1024 * 1024,
      },
    }),
  )
  uploadMultiple(
    @Param('seminarId') seminarId: string,
    @UploadedFiles() files: Express.Multer.File[],
    @CurrentUser() currentUser: any,
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('Fayllar yuborilmadi');
    }
    return this.filesService.uploadMultipleSeminarFiles(
      seminarId,
      files,
      currentUser.id,
      currentUser.role,
    );
  }

  @Get('seminar/:seminarId')
  findBySeminar(@Param('seminarId') seminarId: string) {
    return this.filesService.findBySeminar(seminarId);
  }

  @Get(':id/view')
  @UseGuards(OptionalJwtAuthGuard)
  async viewFile(
    @Param('id') id: string,
    @CurrentUser() currentUser: any,
    @Res() res: Response,
  ) {
    const file = await this.filesService.findOne(id);
    if (!file || !file.storagePath || !fs.existsSync(file.storagePath)) {
      throw new NotFoundException('Fayl topilmadi');
    }

    const hasAccess = this.filesService.checkFilePermission(
      file,
      currentUser,
      'view',
    );
    if (!hasAccess) {
      throw new ForbiddenException('Ushbu faylni ko`rish uchun ruxsat yo`q');
    }

    res.sendFile(file.storagePath);
  }

  @Get(':id/download')
  @UseGuards(OptionalJwtAuthGuard)
  async downloadFile(
    @Param('id') id: string,
    @CurrentUser() currentUser: any,
    @Res() res: Response,
  ) {
    const file = await this.filesService.findOne(id);
    if (!file || !file.storagePath || !fs.existsSync(file.storagePath)) {
      throw new NotFoundException('Fayl topilmadi');
    }

    const hasAccess = this.filesService.checkFilePermission(
      file,
      currentUser,
      'download',
    );
    if (!hasAccess) {
      throw new ForbiddenException(
        'Ushbu faylni yuklab olish cheklangan (faqat ko`rish mumkin yoki ruxsat yo`q)',
      );
    }

    res.download(file.storagePath, file.originalName);
  }

  @Get(':id/inspect-3d')
  @UseGuards(OptionalJwtAuthGuard)
  inspect3DModel(@Param('id') id: string) {
    return this.filesService.inspect3DModel(id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @Audit({ action: 'file_delete', entityType: 'file' })
  remove(@Param('id') id: string, @CurrentUser() currentUser: any) {
    return this.filesService.remove(id, currentUser.id, currentUser.role);
  }

  // ==================== ADMIN RETENTION & CLEANUP ENDPOINTS ====================

  @Get('admin/cleanup-candidates')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  getCleanupCandidates() {
    return this.filesService.getAdminCleanupCandidates();
  }

  @Get('admin/pending-cleanup')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  getPendingCleanup() {
    return this.filesService.getPendingCleanupFiles();
  }

  @Post('admin/mark-cleanup')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @Audit({ action: 'files_marked_for_cleanup', entityType: 'file' })
  markCleanup(
    @Body() dto: MarkCleanupDto,
    @CurrentUser('id') adminId: string,
  ) {
    return this.filesService.markFilesForCleanup(dto, adminId);
  }

  @Post('admin/cancel-cleanup')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @Audit({ action: 'files_cleanup_cancelled', entityType: 'file' })
  cancelCleanup(@Body('fileIds') fileIds: string[]) {
    return this.filesService.cancelCleanup(fileIds);
  }

  @Delete('admin/force-delete/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @Audit({ action: 'file_force_deleted', entityType: 'file' })
  forceDelete(@Param('id') id: string) {
    return this.filesService.forceDelete(id);
  }
}
