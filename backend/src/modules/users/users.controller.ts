import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  NotFoundException,
  Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import type { Response } from 'express';
import * as path from 'path';
import * as fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { UsersService } from './users.service';
import { RegisterDto } from '../auth/dto/register.dto';
import { QueryUserDto } from './dto/query-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { BulkImportUsersDto } from './dto/bulk-import-user.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Audit } from '../../common/decorators/audit.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Role } from '../../common/enums/role.enum';

const avatarStorage = diskStorage({
  destination: (_req, _file, cb) => {
    const dir = path.resolve(process.cwd(), 'uploads', 'avatars');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.png';
    const uniqueName = `${uuidv4()}${ext}`;
    cb(null, uniqueName);
  },
});

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('profile/avatar')
  @Audit({ action: 'avatar_uploaded', entityType: 'user' })
  @UseInterceptors(
    FileInterceptor('avatar', {
      storage: avatarStorage,
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB max
      },
      fileFilter: (_req, file, cb) => {
        const allowedMimes = [
          'image/jpeg',
          'image/png',
          'image/webp',
          'image/jpg',
        ];
        if (allowedMimes.includes(file.mimetype.toLowerCase())) {
          cb(null, true);
        } else {
          cb(
            new BadRequestException(
              'Faqat rasm formatidagi fayllar qabul qilinadi (.jpg, .png, .webp)',
            ),
            false,
          );
        }
      },
    }),
  )
  uploadAvatar(
    @CurrentUser('id') userId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('Rasm fayli yuborilmadi');
    }
    return this.usersService.uploadAvatar(userId, file);
  }

  @Delete('profile/avatar')
  @Audit({ action: 'avatar_deleted', entityType: 'user' })
  deleteAvatar(@CurrentUser('id') userId: string) {
    return this.usersService.deleteAvatar(userId);
  }

  @Get('profile/avatar/file/:filename')
  @Public()
  serveAvatar(@Param('filename') filename: string, @Res() res: Response) {
    const filePath = this.usersService.getAvatarFilePath(filename);
    if (!filePath) {
      throw new NotFoundException('Rasm topilmadi');
    }
    res.sendFile(filePath);
  }

  @Post('bulk-import')
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @Audit({ action: 'users_bulk_imported', entityType: 'user' })
  bulkImport(@Body() dto: BulkImportUsersDto) {
    return this.usersService.bulkImport(dto);
  }

  @Get('department/my-team')
  @Roles(Role.HEAD_DEPARTMENT, Role.ADMIN, Role.SUPERADMIN)
  getMyTeam(@CurrentUser() currentUser: any, @Query() query: QueryUserDto) {
    return this.usersService.getMyTeam(currentUser, query);
  }

  @Get('profile/me')
  getMyProfile(@CurrentUser('id') userId: string) {
    return this.usersService.findOne(userId);
  }

  @Patch('profile/me')
  @Audit({ action: 'profile_updated', entityType: 'user' })
  updateMyProfile(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(userId, dto);
  }

  @Post()
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @Audit({ action: 'user_created', entityType: 'user' })
  create(@Body() dto: RegisterDto) {
    return this.usersService.create(dto);
  }

  @Get()
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  findAll(@Query() query: QueryUserDto) {
    return this.usersService.findAll(query);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Put(':id')
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @Audit({ action: 'user_updated', entityType: 'user' })
  update(@Param('id') id: string, @Body() dto: Partial<RegisterDto>) {
    return this.usersService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @Audit({ action: 'user_deleted', entityType: 'user' })
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }

  @Patch(':id/toggle-active')
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @Audit({ action: 'user_status_toggled', entityType: 'user' })
  toggleActive(@Param('id') id: string) {
    return this.usersService.toggleActive(id);
  }
}
