import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { SeminarsService } from './seminars.service';
import { CreateSeminarDto } from './dto/create-seminar.dto';
import { UpdateSeminarDto } from './dto/update-seminar.dto';
import { UpdateSeminarStatusDto } from './dto/update-seminar-status.dto';
import { ReorderFilesDto } from './dto/reorder-files.dto';
import { QuerySeminarDto } from './dto/query-seminar.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../../common/guards/optional-jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Audit } from '../../common/decorators/audit.decorator';
import { Role } from '../../common/enums/role.enum';

@Controller('seminars')
export class SeminarsController {
  constructor(private readonly seminarsService: SeminarsService) {}

  @Get('dashboard')
  @UseGuards(OptionalJwtAuthGuard)
  getDashboardStats(@CurrentUser() currentUser: any) {
    return this.seminarsService.getDashboardStats(currentUser);
  }

  @Get('tags/popular')
  getPopularTags() {
    return this.seminarsService.getPopularTags();
  }

  @Get('assigned/for-me')
  @UseGuards(JwtAuthGuard)
  getTargetSeminars(
    @CurrentUser('id') userId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.seminarsService.getTargetSeminars(
      userId,
      Number(page) || 1,
      Number(limit) || 12,
    );
  }

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  findAll(@Query() query: QuerySeminarDto, @CurrentUser() currentUser: any) {
    return this.seminarsService.findAll(query, currentUser);
  }

  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  findOne(@Param('id') id: string, @CurrentUser() currentUser: any) {
    return this.seminarsService.findOne(id, currentUser);
  }

  @Get('bookmarks')
  @UseGuards(JwtAuthGuard)
  getBookmarkedSeminars(
    @CurrentUser('id') userId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.seminarsService.getBookmarkedSeminars(
      userId,
      Number(page) || 1,
      Number(limit) || 12,
    );
  }

  @Post(':id/bookmark')
  @UseGuards(JwtAuthGuard)
  toggleBookmark(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.seminarsService.toggleBookmark(id, userId);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @Audit({ action: 'seminar_create', entityType: 'seminar' })
  create(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: Role,
    @Body() dto: CreateSeminarDto,
  ) {
    return this.seminarsService.create(userId, dto, userRole);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @Audit({ action: 'seminar_update', entityType: 'seminar' })
  update(
    @Param('id') id: string,
    @CurrentUser() currentUser: any,
    @Body() dto: UpdateSeminarDto,
  ) {
    return this.seminarsService.update(
      id,
      currentUser.id,
      currentUser.role,
      dto,
    );
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard)
  @Audit({ action: 'seminar_status_change', entityType: 'seminar' })
  updateStatus(
    @Param('id') id: string,
    @CurrentUser() currentUser: any,
    @Body() dto: UpdateSeminarStatusDto,
  ) {
    return this.seminarsService.updateStatus(
      id,
      dto.status,
      currentUser.id,
      currentUser.role,
    );
  }

  @Patch(':id/files/reorder')
  @UseGuards(JwtAuthGuard)
  reorderFiles(
    @Param('id') id: string,
    @CurrentUser() currentUser: any,
    @Body() dto: ReorderFilesDto,
  ) {
    return this.seminarsService.reorderFiles(
      id,
      dto.fileIds,
      currentUser.id,
      currentUser.role,
    );
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @Audit({ action: 'seminar_delete', entityType: 'seminar' })
  remove(@Param('id') id: string, @CurrentUser() currentUser: any) {
    return this.seminarsService.remove(id, currentUser.id, currentUser.role);
  }
}
