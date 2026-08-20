import { Controller, Get, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../../common/guards/optional-jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '../../common/enums/role.enum';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  /**
   * Asosiy Universal Dashboard:
   * Foydalanuvchining roliga qarab (GUEST, USER, HEAD_DEPARTMENT, ADMIN, SUPERADMIN)
   * avtomatik moslashtirilgan diagramma va KPI datalarini qaytaradi.
   */
  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  getMainDashboard(@CurrentUser() currentUser: any) {
    return this.dashboardService.getMainDashboard(currentUser);
  }

  @Get('guest')
  getGuestDashboard() {
    return this.dashboardService.getGuestDashboard();
  }

  @Get('user')
  @UseGuards(JwtAuthGuard)
  getUserDashboard(@CurrentUser() currentUser: any) {
    return this.dashboardService.getUserDashboard(currentUser);
  }

  @Get('department')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.HEAD_DEPARTMENT, Role.ADMIN, Role.SUPERADMIN)
  getDepartmentDashboard(@CurrentUser() currentUser: any) {
    return this.dashboardService.getDepartmentHeadDashboard(currentUser);
  }

  @Get('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  getAdminDashboard(@CurrentUser() currentUser: any) {
    return this.dashboardService.getAdminDashboard(currentUser);
  }

  @Get('superadmin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPERADMIN)
  getSuperadminDashboard(@CurrentUser() currentUser: any) {
    return this.dashboardService.getSuperadminDashboard(currentUser);
  }
}
