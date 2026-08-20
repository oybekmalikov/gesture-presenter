"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var SeedService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SeedService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const bcrypt = __importStar(require("bcryptjs"));
const user_entity_1 = require("../entities/user.entity");
const department_entity_1 = require("../entities/department.entity");
const seminar_entity_1 = require("../entities/seminar.entity");
const tag_entity_1 = require("../entities/tag.entity");
const enums_1 = require("../../common/enums");
let SeedService = SeedService_1 = class SeedService {
    userRepository;
    departmentRepository;
    seminarRepository;
    tagRepository;
    logger = new common_1.Logger(SeedService_1.name);
    constructor(userRepository, departmentRepository, seminarRepository, tagRepository) {
        this.userRepository = userRepository;
        this.departmentRepository = departmentRepository;
        this.seminarRepository = seminarRepository;
        this.tagRepository = tagRepository;
    }
    async onModuleInit() {
        await this.seedAll();
    }
    async seedAll(force = false) {
        const userCount = await this.userRepository.count();
        if (userCount > 0 && !force) {
            this.logger.log('Database already initialized. Skipping seed.');
            return;
        }
        this.logger.log('🌱 Seeding OKMK Enterprise Platform database...');
        const hashedPassword = await bcrypt.hash('okmk2026', 10);
        const deptData = [
            { name: 'Mis boyitish fabrikasi (MBF)', code: 'MBF', description: 'Asosiy mis rudasini boyitish va konsentrat olish majmuasi' },
            { name: '2-Mis boyitish fabrikasi (DOK-2)', code: 'DOK-2', description: 'Zamonaviy texnologik boyitish fabrikasi' },
            { name: 'Sanoat xavfsizligi va mehnat muhofazasi', code: 'SANOAT', description: 'Xavfsizlik texnikasi va standartlar boshqarmasi' },
            { name: 'Axborot texnologiyalari va raqamlashtirish', code: 'RAQAMLI', description: 'Kombinat raqamli infratuzilmasi va IT loyihalari' },
        ];
        const depts = {};
        for (const d of deptData) {
            let dept = await this.departmentRepository.findOne({ where: { code: d.code } });
            if (!dept) {
                dept = this.departmentRepository.create(d);
                dept = await this.departmentRepository.save(dept);
            }
            depts[d.code] = dept;
        }
        const usersData = [
            {
                username: 'superadmin',
                passwordHash: hashedPassword,
                fio: 'Super Administrator',
                role: enums_1.Role.SUPERADMIN,
                lavozim: 'Tizim Bosh Boshqaruvchisi',
                departmentId: depts['RAQAMLI']?.id,
                isActive: true,
            },
            {
                username: 'admin',
                passwordHash: hashedPassword,
                fio: 'Tizim Administratori',
                role: enums_1.Role.ADMIN,
                lavozim: 'Bosh IT Administrator',
                departmentId: depts['RAQAMLI']?.id,
                isActive: true,
            },
            {
                username: 'head_dept',
                passwordHash: hashedPassword,
                fio: 'Rahimov Sherzod Alisherovich',
                role: enums_1.Role.HEAD_DEPARTMENT,
                lavozim: "MBF Bosh Texnologi va Bo'lim Boshlig'i",
                departmentId: depts['MBF']?.id,
                isActive: true,
            },
            {
                username: 'rakhimov',
                passwordHash: hashedPassword,
                fio: 'Rahimov Bekzod Sherzodovich',
                role: enums_1.Role.USER,
                lavozim: 'Yetakchi Texnolog-Muhandis',
                departmentId: depts['MBF']?.id,
                isActive: true,
            },
            {
                username: 'alimov',
                passwordHash: hashedPassword,
                fio: 'Alimov Jamshid Baxtiyorovich',
                role: enums_1.Role.USER,
                lavozim: 'Metallurgiya muhandisi',
                departmentId: depts['DOK-2']?.id,
                isActive: true,
            },
            {
                username: 'karimova',
                passwordHash: hashedPassword,
                fio: 'Karimova Nigora Shavkatovna',
                role: enums_1.Role.USER,
                lavozim: 'Sanoat xavfsizligi mutaxassisi',
                departmentId: depts['SANOAT']?.id,
                isActive: true,
            },
        ];
        const savedUsers = {};
        for (const u of usersData) {
            let user = await this.userRepository.findOne({ where: { username: u.username } });
            if (!user) {
                user = this.userRepository.create(u);
                user = await this.userRepository.save(user);
            }
            savedUsers[u.username] = user;
        }
        if (depts['MBF'] && savedUsers['head_dept']) {
            depts['MBF'].headUserId = savedUsers['head_dept'].id;
            await this.departmentRepository.save(depts['MBF']);
        }
        const tagNames = ['mbf', 'xavfsizlik', '3d-model', 'texnologiya', 'flotatsiya', 'avtomatlashtirish'];
        const tags = {};
        for (const name of tagNames) {
            let t = await this.tagRepository.findOne({ where: { name } });
            if (!t) {
                t = this.tagRepository.create({ name });
                t = await this.tagRepository.save(t);
            }
            tags[name] = t;
        }
        const author = savedUsers['rakhimov'] || savedUsers['head_dept'] || savedUsers['admin'];
        if (author) {
            const seminarsData = [
                {
                    title: 'MBF Tegirmon Bloklari va Flotatsiya 3D Modellari Taqdimoti',
                    description: "Mis boyitish fabrikasining yangi tegirmon agregatlari va flotatsiya kamerasining 3D tuzilishi hamda ishlash prinsiplari",
                    status: enums_1.SeminarStatus.LIVE,
                    isLive: true,
                    fileAccess: enums_1.FileAccess.PUBLIC,
                    viewCount: 142,
                    likesCount: 38,
                    authorId: author.id,
                    departmentId: depts['MBF']?.id,
                    tags: [tags['mbf'], tags['3d-model'], tags['flotatsiya']].filter(Boolean),
                },
                {
                    title: "Sanoat Xavfsizligi va PPE Nazorati 2026 Yangi Qoidalari",
                    description: "Ishlab chiqarish maydonlarida xodimlarning himoya vositalari va video-analitika orqali monitoringi",
                    status: enums_1.SeminarStatus.SCHEDULED,
                    isLive: false,
                    scheduledAt: new Date(Date.now() + 86400000 * 2),
                    fileAccess: enums_1.FileAccess.PUBLIC,
                    viewCount: 89,
                    likesCount: 24,
                    authorId: savedUsers['karimova']?.id || author.id,
                    departmentId: depts['SANOAT']?.id,
                    tags: [tags['xavfsizlik'], tags['avtomatlashtirish']].filter(Boolean),
                },
                {
                    title: "DOK-2 Fabrikasida Maydalash Jarayonini Avtomatlashtirish",
                    description: "Maydalash sexidagi yangi datchiklar va avtomatlashtirilgan SCADA boshqaruvi hisoboti",
                    status: enums_1.SeminarStatus.SCHEDULED,
                    isLive: false,
                    scheduledAt: new Date(Date.now() + 86400000 * 4),
                    fileAccess: enums_1.FileAccess.PUBLIC,
                    viewCount: 65,
                    likesCount: 19,
                    authorId: savedUsers['alimov']?.id || author.id,
                    departmentId: depts['DOK-2']?.id,
                    tags: [tags['texnologiya'], tags['avtomatlashtirish']].filter(Boolean),
                },
                {
                    title: "OKMK Raqamli Ekotizimi va AI Imkoniyatlari",
                    description: "Kombinat bo'yicha sun'iy intellekt va raqamli taqdimot texnologiyalarini tatbiq etish strategiyasi",
                    status: enums_1.SeminarStatus.COMPLETED,
                    isLive: false,
                    fileAccess: enums_1.FileAccess.PUBLIC,
                    viewCount: 280,
                    likesCount: 75,
                    authorId: savedUsers['admin']?.id || author.id,
                    departmentId: depts['RAQAMLI']?.id,
                    tags: [tags['avtomatlashtirish'], tags['texnologiya']].filter(Boolean),
                },
                {
                    title: "Mis Eritish Zavodi Texnologik Rejimi Tahlili",
                    description: "Konvertor sexi va anod pechlarining energiya samaradorligi",
                    status: enums_1.SeminarStatus.COMPLETED,
                    isLive: false,
                    fileAccess: enums_1.FileAccess.READABLE,
                    viewCount: 115,
                    likesCount: 31,
                    authorId: author.id,
                    departmentId: depts['MBF']?.id,
                    tags: [tags['mbf'], tags['texnologiya']].filter(Boolean),
                },
                {
                    title: "Kon Ishlarida Xavfsizlik Va Favqulodda Vaziyatlar",
                    description: "Qalmoqqir ochiq koni xodimlari uchun xavfsizlik amaliyoti",
                    status: enums_1.SeminarStatus.COMPLETED,
                    isLive: false,
                    fileAccess: enums_1.FileAccess.PUBLIC,
                    viewCount: 94,
                    likesCount: 22,
                    authorId: savedUsers['karimova']?.id || author.id,
                    departmentId: depts['SANOAT']?.id,
                    tags: [tags['xavfsizlik']].filter(Boolean),
                },
                {
                    title: "Gidrometallurgiya Jarayonlarida Reagentlar Sarfi",
                    description: "Yangi flotoreagentlar sinovi va samaradorlik ko'rsatkichlari",
                    status: enums_1.SeminarStatus.COMPLETED,
                    isLive: false,
                    fileAccess: enums_1.FileAccess.PRIVATE,
                    viewCount: 47,
                    likesCount: 11,
                    authorId: author.id,
                    departmentId: depts['MBF']?.id,
                    tags: [tags['mbf'], tags['flotatsiya']].filter(Boolean),
                },
                {
                    title: "Kombinat Ekologik Standartlari va Monitoring Tizimi",
                    description: "Atrof-muhitni muhofaza qilish bo'yicha 2026-yil chora-tadbirlari",
                    status: enums_1.SeminarStatus.COMPLETED,
                    isLive: false,
                    fileAccess: enums_1.FileAccess.PUBLIC,
                    viewCount: 130,
                    likesCount: 40,
                    authorId: savedUsers['head_dept']?.id || author.id,
                    departmentId: depts['SANOAT']?.id,
                    tags: [tags['xavfsizlik']].filter(Boolean),
                },
            ];
            for (const sem of seminarsData) {
                const s = this.seminarRepository.create(sem);
                await this.seminarRepository.save(s);
            }
        }
        this.logger.log('✅ OKMK Enterprise Platform database seeded successfully.');
    }
};
exports.SeedService = SeedService;
exports.SeedService = SeedService = SeedService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(1, (0, typeorm_1.InjectRepository)(department_entity_1.Department)),
    __param(2, (0, typeorm_1.InjectRepository)(seminar_entity_1.Seminar)),
    __param(3, (0, typeorm_1.InjectRepository)(tag_entity_1.Tag)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], SeedService);
//# sourceMappingURL=seed.service.js.map