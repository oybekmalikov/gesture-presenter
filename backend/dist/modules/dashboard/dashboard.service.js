"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const seminar_entity_1 = require("../../database/entities/seminar.entity");
const user_entity_1 = require("../../database/entities/user.entity");
const department_entity_1 = require("../../database/entities/department.entity");
const seminar_file_entity_1 = require("../../database/entities/seminar-file.entity");
const like_entity_1 = require("../../database/entities/like.entity");
const comment_entity_1 = require("../../database/entities/comment.entity");
const saved_seminar_entity_1 = require("../../database/entities/saved-seminar.entity");
const audit_log_entity_1 = require("../../database/entities/audit-log.entity");
const tag_entity_1 = require("../../database/entities/tag.entity");
const role_enum_1 = require("../../common/enums/role.enum");
const enums_1 = require("../../common/enums");
const response_1 = require("../../common/response");
let DashboardService = class DashboardService {
    seminarRepo;
    userRepo;
    departmentRepo;
    fileRepo;
    likeRepo;
    commentRepo;
    savedRepo;
    auditRepo;
    tagRepo;
    constructor(seminarRepo, userRepo, departmentRepo, fileRepo, likeRepo, commentRepo, savedRepo, auditRepo, tagRepo) {
        this.seminarRepo = seminarRepo;
        this.userRepo = userRepo;
        this.departmentRepo = departmentRepo;
        this.fileRepo = fileRepo;
        this.likeRepo = likeRepo;
        this.commentRepo = commentRepo;
        this.savedRepo = savedRepo;
        this.auditRepo = auditRepo;
        this.tagRepo = tagRepo;
    }
    async getMainDashboard(currentUser) {
        if (!currentUser) {
            return this.getGuestDashboard();
        }
        switch (currentUser.role) {
            case role_enum_1.Role.SUPERADMIN:
                return this.getSuperadminDashboard(currentUser);
            case role_enum_1.Role.ADMIN:
                return this.getAdminDashboard(currentUser);
            case role_enum_1.Role.HEAD_DEPARTMENT:
                return this.getDepartmentHeadDashboard(currentUser);
            case role_enum_1.Role.USER:
            default:
                return this.getUserDashboard(currentUser);
        }
    }
    async getGuestDashboard() {
        const [publicSeminarsCount, liveSeminarsCount, topTrending, popularTags] = await Promise.all([
            this.seminarRepo.count({
                where: { fileAccess: enums_1.FileAccess.PUBLIC },
            }),
            this.seminarRepo.count({
                where: { isLive: true, fileAccess: enums_1.FileAccess.PUBLIC },
            }),
            this.seminarRepo.find({
                where: { fileAccess: enums_1.FileAccess.PUBLIC },
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
        return (0, response_1.successResponse)(data, response_1.MESSAGES.FETCHED);
    }
    async getUserDashboard(currentUser) {
        const userId = currentUser.id;
        const deptId = currentUser.departmentId;
        const [mySeminarsCount, myLikesReceived, mySavedCount, assignedForMe, liveSeminars, departmentRecent,] = await Promise.all([
            this.seminarRepo.count({ where: { authorId: userId } }),
            this.likeRepo
                .createQueryBuilder('like')
                .innerJoin('like.seminar', 'seminar')
                .where('seminar.authorId = :userId', { userId })
                .getCount(),
            this.savedRepo.count({ where: { userId } }),
            this.seminarRepo.find({
                where: { targetUserId: userId, status: enums_1.SeminarStatus.SCHEDULED },
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
            role: role_enum_1.Role.USER,
            kpi: {
                mySeminarsCount,
                myLikesReceived,
                mySavedCount,
            },
            assignedForMe,
            liveSeminars,
            departmentRecent,
        };
        return (0, response_1.successResponse)(data, response_1.MESSAGES.FETCHED);
    }
    async getDepartmentHeadDashboard(currentUser) {
        const deptId = currentUser.departmentId;
        let department = null;
        let deptActiveUsersCount = 0;
        const seminarsByStatus = {
            draft: 0,
            scheduled: 0,
            live: 0,
            completed: 0,
            cancelled: 0,
            total: 0,
        };
        let topSpeakers = [];
        let monthlyTrend = [];
        let recentDepartmentSeminars = [];
        if (deptId) {
            department = await this.departmentRepo.findOne({
                where: { id: deptId },
                relations: { subDepartments: true },
            });
            deptActiveUsersCount = await this.userRepo.count({
                where: { departmentId: deptId, isActive: true },
            });
            const statusCounts = await this.seminarRepo
                .createQueryBuilder('seminar')
                .select('seminar.status', 'status')
                .addSelect('COUNT(seminar.id)', 'count')
                .where('seminar.departmentId = :deptId', { deptId })
                .groupBy('seminar.status')
                .getRawMany();
            let totalSem = 0;
            statusCounts.forEach((r) => {
                const count = parseInt(r.count, 10);
                seminarsByStatus[r.status] = count;
                totalSem += count;
            });
            seminarsByStatus.total = totalSem;
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
            monthlyTrend = await this.seminarRepo
                .createQueryBuilder('seminar')
                .select("TO_CHAR(seminar.createdAt, 'YYYY-MM')", 'month')
                .addSelect('COUNT(seminar.id)', 'count')
                .where('seminar.departmentId = :deptId', { deptId })
                .groupBy("TO_CHAR(seminar.createdAt, 'YYYY-MM')")
                .orderBy('month', 'ASC')
                .take(6)
                .getRawMany();
            recentDepartmentSeminars = await this.seminarRepo.find({
                where: { departmentId: deptId },
                relations: { author: true, tags: true },
                order: { createdAt: 'DESC' },
                take: 6,
            });
        }
        const data = {
            role: role_enum_1.Role.HEAD_DEPARTMENT,
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
        return (0, response_1.successResponse)(data, response_1.MESSAGES.FETCHED);
    }
    async getAdminDashboard(currentUser) {
        const [totalUsers, activeUsers, totalDepartments, totalSeminars, liveSeminars, scheduledSeminars, departmentComparison, monthlyGrowthTrend, storageStats, popularTags,] = await Promise.all([
            this.userRepo.count(),
            this.userRepo.count({ where: { isActive: true } }),
            this.departmentRepo.count(),
            this.seminarRepo.count(),
            this.seminarRepo.count({
                where: [{ isLive: true }, { status: enums_1.SeminarStatus.LIVE }],
            }),
            this.seminarRepo.count({ where: { status: enums_1.SeminarStatus.SCHEDULED } }),
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
            this.seminarRepo
                .createQueryBuilder('seminar')
                .select("TO_CHAR(seminar.createdAt, 'YYYY-MM')", 'month')
                .addSelect('COUNT(seminar.id)', 'total')
                .addSelect(`COUNT(CASE WHEN seminar.status = '${enums_1.SeminarStatus.COMPLETED}' THEN 1 END)`, 'completed')
                .groupBy("TO_CHAR(seminar.createdAt, 'YYYY-MM')")
                .orderBy('month', 'ASC')
                .take(12)
                .getRawMany(),
            this.fileRepo
                .createQueryBuilder('file')
                .select('file.fileType', 'fileType')
                .addSelect('COUNT(file.id)', 'count')
                .addSelect('COALESCE(SUM(file.size), 0)', 'totalBytes')
                .groupBy('file.fileType')
                .getRawMany(),
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
        let totalStorageBytes = 0;
        const storageBreakdown = storageStats.map((s) => {
            const bytes = parseInt(s.totalBytes, 10);
            totalStorageBytes += bytes;
            return {
                fileType: s.fileType,
                count: parseInt(s.count, 10),
                totalBytes: bytes,
                totalMB: Number((bytes / (1024 * 1024)).toFixed(2)),
            };
        });
        const totalStorageMB = Number((totalStorageBytes / (1024 * 1024)).toFixed(2));
        const data = {
            role: currentUser?.role || role_enum_1.Role.ADMIN,
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
                departmentActivityBarChart: departmentComparison.map((d) => ({
                    id: d.id,
                    name: d.name,
                    code: d.code,
                    seminarsCount: parseInt(d.seminarsCount, 10),
                })),
                monthlySeminarGrowthLineChart: monthlyGrowthTrend.map((m) => ({
                    month: m.month,
                    total: parseInt(m.total, 10),
                    completed: parseInt(m.completed, 10),
                })),
                storageBreakdownPieChart: storageBreakdown,
                popularTagsCloud: popularTags.map((t) => ({
                    name: t.name,
                    count: parseInt(t.count, 10),
                })),
            },
        };
        return (0, response_1.successResponse)(data, response_1.MESSAGES.FETCHED);
    }
    async getSuperadminDashboard(currentUser) {
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
            role: role_enum_1.Role.SUPERADMIN,
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
        return (0, response_1.successResponse)(data, response_1.MESSAGES.FETCHED);
    }
};
exports.DashboardService = DashboardService;
exports.DashboardService = DashboardService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(seminar_entity_1.Seminar)),
    __param(1, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(2, (0, typeorm_1.InjectRepository)(department_entity_1.Department)),
    __param(3, (0, typeorm_1.InjectRepository)(seminar_file_entity_1.SeminarFile)),
    __param(4, (0, typeorm_1.InjectRepository)(like_entity_1.Like)),
    __param(5, (0, typeorm_1.InjectRepository)(comment_entity_1.Comment)),
    __param(6, (0, typeorm_1.InjectRepository)(saved_seminar_entity_1.SavedSeminar)),
    __param(7, (0, typeorm_1.InjectRepository)(audit_log_entity_1.AuditLog)),
    __param(8, (0, typeorm_1.InjectRepository)(tag_entity_1.Tag)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], DashboardService);
//# sourceMappingURL=dashboard.service.js.map