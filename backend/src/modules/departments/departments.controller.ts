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
} from '@nestjs/common';
import { DepartmentsService } from './departments.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { CreateSubDepartmentDto } from './dto/create-sub-department.dto';
import { CreatePositionDto } from './dto/create-position.dto';
import { SetDepartmentHeadDto } from './dto/set-department-head.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

@Controller('departments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  // Tree view (accessible to all authenticated users for selectors/org chart)
  @Get('tree')
  getOrgTree() {
    return this.departmentsService.getOrgTree();
  }

  // ==================== DEPARTMENTS ====================
  @Get()
  findAllDepartments() {
    return this.departmentsService.findAllDepartments();
  }

  @Get(':id/stats')
  getDepartmentStats(@Param('id') id: string) {
    return this.departmentsService.getDepartmentStats(id);
  }

  @Get(':id')
  findOneDepartment(@Param('id') id: string) {
    return this.departmentsService.findOneDepartment(id);
  }

  @Post()
  @Roles(Role.ADMIN)
  createDepartment(@Body() dto: CreateDepartmentDto) {
    return this.departmentsService.createDepartment(dto);
  }

  @Put(':id')
  @Roles(Role.ADMIN)
  updateDepartment(
    @Param('id') id: string,
    @Body() dto: Partial<CreateDepartmentDto>,
  ) {
    return this.departmentsService.updateDepartment(id, dto);
  }

  @Patch(':id/head')
  @Roles(Role.ADMIN)
  setDepartmentHead(
    @Param('id') id: string,
    @Body() dto: SetDepartmentHeadDto,
  ) {
    return this.departmentsService.setDepartmentHead(id, dto.userId);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  removeDepartment(@Param('id') id: string) {
    return this.departmentsService.removeDepartment(id);
  }

  // ==================== SUB-DEPARTMENTS ====================
  @Get('sub/list')
  findAllSubDepartments(@Query('departmentId') departmentId?: string) {
    return this.departmentsService.findAllSubDepartments(departmentId);
  }

  @Post('sub')
  @Roles(Role.ADMIN)
  createSubDepartment(@Body() dto: CreateSubDepartmentDto) {
    return this.departmentsService.createSubDepartment(dto);
  }

  @Put('sub/:id')
  @Roles(Role.ADMIN)
  updateSubDepartment(
    @Param('id') id: string,
    @Body() dto: Partial<CreateSubDepartmentDto>,
  ) {
    return this.departmentsService.updateSubDepartment(id, dto);
  }

  @Delete('sub/:id')
  @Roles(Role.ADMIN)
  removeSubDepartment(@Param('id') id: string) {
    return this.departmentsService.removeSubDepartment(id);
  }

  // ==================== POSITIONS ====================
  @Get('positions/list')
  findAllPositions() {
    return this.departmentsService.findAllPositions();
  }

  @Post('positions')
  @Roles(Role.ADMIN)
  createPosition(@Body() dto: CreatePositionDto) {
    return this.departmentsService.createPosition(dto);
  }

  @Put('positions/:id')
  @Roles(Role.ADMIN)
  updatePosition(
    @Param('id') id: string,
    @Body() dto: Partial<CreatePositionDto>,
  ) {
    return this.departmentsService.updatePosition(id, dto);
  }

  @Delete('positions/:id')
  @Roles(Role.ADMIN)
  removePosition(@Param('id') id: string) {
    return this.departmentsService.removePosition(id);
  }
}
