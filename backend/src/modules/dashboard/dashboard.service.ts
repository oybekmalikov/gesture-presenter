import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
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
import { Role } from '../../common/enums/role.enum';
import { SeminarStatus, FileAccess } from '../../common/enums';
import { ApiResponse, successResponse, MESSAGES } from '../../common/response';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Seminar)
    private readonly seminarRepo: Repository<Seminar>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Department)
    private readonly departmentRepo: Repository<Department>,
    @InjectRepository(SeminarFile)
    private readonly fileRepo: Repository<SeminarFile>,
    @InjectRepository(Like)
    private readonly likeRepo: Repository<Like>,
    @InjectRepository(Comment)
    private readonly commentRepo: Repository<Comment>,
    @InjectRepository(SavedSeminar)
    private readonly savedRepo: Repository<SavedSeminar>,
    @InjectRepository(AuditLog)
    private readonly auditRepo: Repository<AuditLog>,
    @InjectRepository(Tag)
    private readonly tagRepo: Repository<Tag>,
  ) {}

  async getMainDashboard(currentUser?: any): Promise<ApiResponse> {
    if (!currentUser) {
      return this.getGuestDashboard();
    }

    switch (currentUser.role) {
      case Role.SUPERADMIN:
        return this.getSuperadminDashboard(currentUser);
      case Role.ADMIN:
        return this.getAdminDashboard(currentUser);
      case Role.HEAD_DEPARTMENT:
        return this.getDepartmentHeadDashboard(currentUser);
      case Role.USER:
      default:
        return this.getUserDashboard(currentUser);
    }
  }

  // ==================== 1. GUEST DASHBOARD ====================
  async getGuestDashboard(): Promise<ApiResponse> {
    const [publicSeminarsCount, liveSeminarsCount, topTrending, popularTags] =
      await Promise.all([
        this.seminarRepo.count({
          where: { fileAccess: FileAccess.PUBLIC },
        }),
        this.seminarRepo.count({
          where: { isLive: true, fileAccess: FileAccess.PUBLIC },
        }),
        this.seminarRepo.find({
          where: { fileAccess: FileAccess.PUBLIC },
          relations: { author: true, department: true, tags: true },
          order: { viewCount: 'DESC', createdAt: 'DESC' },
          take: 6,
        }),
        this.tagRepo
          .createQueryBuilder('tag')
          .leftJoin('tag.seminars', 'seminar')
          .select('tag.name', 'name')
          .addSelect('COUNT(seminar.id)', 'count')
          .groupBy('tag.id')
          .addGroupBy('tag.name')
          .orderBy('count', 'DESC')
          .take(10)
          .getRawMany(),
      ]);

    const data = {
      role: 'GUEST',
      summary: {
        publicSeminarsCount,
        liveSeminarsCount,
      },
      topTrending,
      popularTags,
    };

    return successResponse(data, MESSAGES.FETCHED);
  }

  // ==================== 2. USER DASHBOARD ====================
  async getUserDashboard(currentUser: any): Promise<ApiResponse> {
    const userId = currentUser.id;
    const deptId = currentUser.departmentId;

    const [
      mySeminarsCount,
      myLikesReceived,
      mySavedCount,
      assignedForMe,
      liveSeminars,
      departmentRecent,
    ] = await Promise.all([
      this.seminarRepo.count({ where: { authorId: userId } }),
      this.likeRepo
        .createQueryBuilder('like')
        .innerJoin('like.seminar', 'seminar')
        .where('seminar.authorId = :userId', { userId })
        .getCount(),
      this.savedRepo.count({ where: { userId } }),
      this.seminarRepo.find({
        where: { targetUserId: userId, status: SeminarStatus.SCHEDULED },
        relations: { author: true, department: true, files: true },
        order: { scheduledAt: 'ASC' },
        take: 5,
      }),
      this.seminarRepo.find({
        where: { isLive: true },
        relations: { author: true, department: true },
        take: 5,
      }),
      deptId
        ? this.seminarRepo.find({
            where: { departmentId: deptId },
            relations: { author: true },
            order: { createdAt: 'DESC' },
            take: 5,
          })
        : Promise.resolve([]),
    ]);

    const data = {
      role: Role.USER,
      kpi: {
        mySeminarsCount,
        myLikesReceived,
        mySavedCount,
      },
      assignedForMe,
      liveSeminars,
      departmentRecent,
    };

    return successResponse(data, MESSAGES.FETCHED);
  }

  // ==================== 3. HEAD DEPARTMENT DASHBOARD ====================
  async getDepartmentHeadDashboard(currentUser: any): Promise<ApiResponse> {
    const deptId = currentUser.departmentId;

    let department = null;
    let deptActiveUsersCount = 0;
    const seminarsByStatus: Record<string, number> = {
      draft: 0,
      scheduled: 0,
      live: 0,
      completed: 0,
      cancelled: 0,
      total: 0,
    };
    let topSpeakers: any[] = [];
    let monthlyTrend: any[] = [];
    let recentDepartmentSeminars: Seminar[] = [];

    if (deptId) {
      department = await this.departmentRepo.findOne({
        where: { id: deptId },
        relations: { subDepartments: true },
      });

      deptActiveUsersCount = await this.userRepo.count({
        where: { departmentId: deptId, isActive: true },
      });

      // Status breakdown
      const statusCounts = await this.seminarRepo
        .createQueryBuilder('seminar')
        .select('seminar.status', 'status')
        .addSelect('COUNT(seminar.id)', 'count')
        .where('seminar.departmentId = :deptId', { deptId })
        .groupBy('seminar.status')
        .getRawMany();

      let totalSem = 0;
      statusCounts.forEach((r: any) => {
        const count = parseInt(r.count, 10);
        seminarsByStatus[r.status] = count;
        totalSem += count;
      });
      seminarsByStatus.total = totalSem;

      // Top speakers in department
      topSpeakers = await this.seminarRepo
        .createQueryBuilder('seminar')
        .innerJoin('seminar.author', 'author')
        .select('author.id', 'userId')
        .addSelect('author.fio', 'fio')
        .addSelect('author.lavozim', 'lavozim')
        .addSelect('author.avatarUrl', 'avatarUrl')
        .addSelect('COUNT(seminar.id)', 'seminarsCount')
        .addSelect('COALESCE(SUM(seminar.viewCount), 0)', 'totalViews')
        .where('seminar.departmentId = :deptId', { deptId })
        .groupBy('author.id')
        .addGroupBy('author.fio')
        .addGroupBy('author.lavozim')
        .addGroupBy('author.avatarUrl')
        .orderBy('"seminarsCount"', 'DESC')
        .take(5)
        .getRawMany();

      // Monthly trend (last 6 months)
      monthlyTrend = await this.seminarRepo
        .createQueryBuilder('seminar')
        .select("TO_CHAR(seminar.createdAt, 'YYYY-MM')", 'month')
        .addSelect('COUNT(seminar.id)', 'count')
        .where('seminar.departmentId = :deptId', { deptId })
        .groupBy("TO_CHAR(seminar.createdAt, 'YYYY-MM')")
        .orderBy('month', 'ASC')
        .take(6)
        .getRawMany();

      // Recent department seminars
      recentDepartmentSeminars = await this.seminarRepo.find({
        where: { departmentId: deptId },
        relations: { author: true, tags: true },
        order: { createdAt: 'DESC' },
        take: 6,
      });
    }

    const data = {
      role: Role.HEAD_DEPARTMENT,
      department: department
        ? {
            id: department.id,
            name: department.name,
            code: department.code,
            subDepartmentsCount: department.subDepartments?.length || 0,
            activeUsersCount: deptActiveUsersCount,
          }
        : null,
      seminarsByStatus,
      topSpeakers,
      monthlyTrend,
      recentSeminars: recentDepartmentSeminars,
    };

    return successResponse(data, MESSAGES.FETCHED);
  }

  // ==================== 4. ADMIN DASHBOARD ====================
  async getAdminDashboard(currentUser?: any): Promise<ApiResponse> {
    const [
      totalUsers,
      activeUsers,
      totalDepartments,
      totalSeminars,
      liveSeminars,
      scheduledSeminars,
      departmentComparison,
      monthlyGrowthTrend,
      storageStats,
      popularTags,
    ] = await Promise.all([
      this.userRepo.count(),
      this.userRepo.count({ where: { isActive: true } }),
      this.departmentRepo.count(),
      this.seminarRepo.count(),
      this.seminarRepo.count({
        where: [{ isLive: true }, { status: SeminarStatus.LIVE }],
      }),
      this.seminarRepo.count({ where: { status: SeminarStatus.SCHEDULED } }),
      // Bar Chart: Top 10 Departments by seminar count
      this.departmentRepo
        .createQueryBuilder('dep')
        .leftJoin('dep.seminars', 'seminar')
        .select('dep.id', 'id')
        .addSelect('dep.name', 'name')
        .addSelect('dep.code', 'code')
        .addSelect('COUNT(seminar.id)', 'seminarsCount')
        .groupBy('dep.id')
        .addGroupBy('dep.name')
        .addGroupBy('dep.code')
        .orderBy('"seminarsCount"', 'DESC')
        .take(10)
        .getRawMany(),
      // Line Chart: Monthly Seminar Growth (Last 6 months)
      this.seminarRepo
        .createQueryBuilder('seminar')
        .select("TO_CHAR(seminar.createdAt, 'YYYY-MM')", 'month')
        .addSelect('COUNT(seminar.id)', 'total')
        .addSelect(
          `COUNT(CASE WHEN seminar.status = '${SeminarStatus.COMPLETED}' THEN 1 END)`,
          'completed',
        )
        .groupBy("TO_CHAR(seminar.createdAt, 'YYYY-MM')")
        .orderBy('month', 'ASC')
        .take(12)
        .getRawMany(),
      // Pie Chart: Storage by file type
      this.fileRepo
        .createQueryBuilder('file')
        .select('file.fileType', 'fileType')
        .addSelect('COUNT(file.id)', 'count')
        .addSelect('COALESCE(SUM(file.size), 0)', 'totalBytes')
        .groupBy('file.fileType')
        .getRawMany(),
      // Tag Cloud
      this.tagRepo
        .createQueryBuilder('tag')
        .leftJoin('tag.seminars', 'seminar')
        .select('tag.name', 'name')
        .addSelect('COUNT(seminar.id)', 'count')
        .groupBy('tag.id')
        .addGroupBy('tag.name')
        .orderBy('count', 'DESC')
        .take(15)
        .getRawMany(),
    ]);

    // Format storage stats
    let totalStorageBytes = 0;
    const storageBreakdown = storageStats.map((s: any) => {
      const bytes = parseInt(s.totalBytes, 10);
      totalStorageBytes += bytes;
      return {
        fileType: s.fileType,
        count: parseInt(s.count, 10),
        totalBytes: bytes,
        totalMB: Number((bytes / (1024 * 1024)).toFixed(2)),
      };
    });

    const totalStorageMB = Number(
      (totalStorageBytes / (1024 * 1024)).toFixed(2),
    );

    const data = {
      role: currentUser?.role || Role.ADMIN,
      summary: {
        totalUsers,
        activeUsers,
        totalDepartments,
        totalSeminars,
        liveSeminars,
        scheduledSeminars,
        totalStorageMB,
      },
      charts: {
        departmentActivityBarChart: departmentComparison.map((d: any) => ({
          id: d.id,
          name: d.name,
          code: d.code,
          seminarsCount: parseInt(d.seminarsCount, 10),
        })),
        monthlySeminarGrowthLineChart: monthlyGrowthTrend.map((m: any) => ({
          month: m.month,
          total: parseInt(m.total, 10),
          completed: parseInt(m.completed, 10),
        })),
        storageBreakdownPieChart: storageBreakdown,
        popularTagsCloud: popularTags.map((t: any) => ({
          name: t.name,
          count: parseInt(t.count, 10),
        })),
      },
    };

    return successResponse(data, MESSAGES.FETCHED);
  }

  // ==================== 5. SUPERADMIN DASHBOARD ====================
  async getSuperadminDashboard(currentUser: any): Promise<ApiResponse> {
    const adminRes = await this.getAdminDashboard(currentUser);
    const adminData = adminRes.data;

    const [recentAuditLogs, totalLogsCount] = await Promise.all([
      this.auditRepo.find({
        relations: { user: true },
        order: { createdAt: 'DESC' },
        take: 10,
      }),
      this.auditRepo.count(),
    ]);

    const data = {
      ...adminData,
      role: Role.SUPERADMIN,
      audit: {
        totalLogsCount,
        recentLogs: recentAuditLogs.map((log) => ({
          id: log.id,
          action: log.action,
          entityType: log.entityType,
          entityId: log.entityId,
          ipAddress: log.ipAddress,
          user: log.user
            ? {
                id: log.user.id,
                fio: log.user.fio,
                username: log.user.username,
                role: log.user.role,
              }
            : null,
          createdAt: log.createdAt,
        })),
      },
    };

    return successResponse(data, MESSAGES.FETCHED);
  }
}
