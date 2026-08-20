import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from '../entities/user.entity';
import { Department } from '../entities/department.entity';
import { Seminar } from '../entities/seminar.entity';
import { Tag } from '../entities/tag.entity';
import { Role, SeminarStatus, FileAccess } from '../../common/enums';

@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Department)
    private readonly departmentRepository: Repository<Department>,
    @InjectRepository(Seminar)
    private readonly seminarRepository: Repository<Seminar>,
    @InjectRepository(Tag)
    private readonly tagRepository: Repository<Tag>,
  ) {}

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

    // 1. Departments
    const deptData = [
      { name: 'Mis boyitish fabrikasi (MBF)', code: 'MBF', description: 'Asosiy mis rudasini boyitish va konsentrat olish majmuasi' },
      { name: '2-Mis boyitish fabrikasi (DOK-2)', code: 'DOK-2', description: 'Zamonaviy texnologik boyitish fabrikasi' },
      { name: 'Sanoat xavfsizligi va mehnat muhofazasi', code: 'SANOAT', description: 'Xavfsizlik texnikasi va standartlar boshqarmasi' },
      { name: 'Axborot texnologiyalari va raqamlashtirish', code: 'RAQAMLI', description: 'Kombinat raqamli infratuzilmasi va IT loyihalari' },
    ];

    const depts: Record<string, Department> = {};
    for (const d of deptData) {
      let dept = await this.departmentRepository.findOne({ where: { code: d.code } });
      if (!dept) {
        dept = this.departmentRepository.create(d);
        dept = await this.departmentRepository.save(dept);
      }
      depts[d.code] = dept;
    }

    // 2. Users
    const usersData = [
      {
        username: 'superadmin',
        passwordHash: hashedPassword,
        fio: 'Super Administrator',
        role: Role.SUPERADMIN,
        lavozim: 'Tizim Bosh Boshqaruvchisi',
        departmentId: depts['RAQAMLI']?.id,
        isActive: true,
      },
      {
        username: 'admin',
        passwordHash: hashedPassword,
        fio: 'Tizim Administratori',
        role: Role.ADMIN,
        lavozim: 'Bosh IT Administrator',
        departmentId: depts['RAQAMLI']?.id,
        isActive: true,
      },
      {
        username: 'head_dept',
        passwordHash: hashedPassword,
        fio: 'Rahimov Sherzod Alisherovich',
        role: Role.HEAD_DEPARTMENT,
        lavozim: "MBF Bosh Texnologi va Bo'lim Boshlig'i",
        departmentId: depts['MBF']?.id,
        isActive: true,
      },
      {
        username: 'rakhimov',
        passwordHash: hashedPassword,
        fio: 'Rahimov Bekzod Sherzodovich',
        role: Role.USER,
        lavozim: 'Yetakchi Texnolog-Muhandis',
        departmentId: depts['MBF']?.id,
        isActive: true,
      },
      {
        username: 'alimov',
        passwordHash: hashedPassword,
        fio: 'Alimov Jamshid Baxtiyorovich',
        role: Role.USER,
        lavozim: 'Metallurgiya muhandisi',
        departmentId: depts['DOK-2']?.id,
        isActive: true,
      },
      {
        username: 'karimova',
        passwordHash: hashedPassword,
        fio: 'Karimova Nigora Shavkatovna',
        role: Role.USER,
        lavozim: 'Sanoat xavfsizligi mutaxassisi',
        departmentId: depts['SANOAT']?.id,
        isActive: true,
      },
    ];

    const savedUsers: Record<string, User> = {};
    for (const u of usersData) {
      let user = await this.userRepository.findOne({ where: { username: u.username } });
      if (!user) {
        user = this.userRepository.create(u);
        user = await this.userRepository.save(user);
      }
      savedUsers[u.username] = user;
    }

    // Set department heads
    if (depts['MBF'] && savedUsers['head_dept']) {
      depts['MBF'].headUserId = savedUsers['head_dept'].id;
      await this.departmentRepository.save(depts['MBF']);
    }

    // 3. Tags
    const tagNames = ['mbf', 'xavfsizlik', '3d-model', 'texnologiya', 'flotatsiya', 'avtomatlashtirish'];
    const tags: Record<string, Tag> = {};
    for (const name of tagNames) {
      let t = await this.tagRepository.findOne({ where: { name } });
      if (!t) {
        t = this.tagRepository.create({ name });
        t = await this.tagRepository.save(t);
      }
      tags[name] = t;
    }

    // 4. Initial Seminars (Live, Scheduled, Completed)
    const author = savedUsers['rakhimov'] || savedUsers['head_dept'] || savedUsers['admin'];
    if (author) {
      const seminarsData = [
        {
          title: 'MBF Tegirmon Bloklari va Flotatsiya 3D Modellari Taqdimoti',
          description: "Mis boyitish fabrikasining yangi tegirmon agregatlari va flotatsiya kamerasining 3D tuzilishi hamda ishlash prinsiplari",
          status: SeminarStatus.LIVE,
          isLive: true,
          fileAccess: FileAccess.PUBLIC,
          viewCount: 142,
          likesCount: 38,
          authorId: author.id,
          departmentId: depts['MBF']?.id,
          tags: [tags['mbf'], tags['3d-model'], tags['flotatsiya']].filter(Boolean),
        },
        {
          title: "Sanoat Xavfsizligi va PPE Nazorati 2026 Yangi Qoidalari",
          description: "Ishlab chiqarish maydonlarida xodimlarning himoya vositalari va video-analitika orqali monitoringi",
          status: SeminarStatus.SCHEDULED,
          isLive: false,
          scheduledAt: new Date(Date.now() + 86400000 * 2), // +2 days
          fileAccess: FileAccess.PUBLIC,
          viewCount: 89,
          likesCount: 24,
          authorId: savedUsers['karimova']?.id || author.id,
          departmentId: depts['SANOAT']?.id,
          tags: [tags['xavfsizlik'], tags['avtomatlashtirish']].filter(Boolean),
        },
        {
          title: "DOK-2 Fabrikasida Maydalash Jarayonini Avtomatlashtirish",
          description: "Maydalash sexidagi yangi datchiklar va avtomatlashtirilgan SCADA boshqaruvi hisoboti",
          status: SeminarStatus.SCHEDULED,
          isLive: false,
          scheduledAt: new Date(Date.now() + 86400000 * 4), // +4 days
          fileAccess: FileAccess.PUBLIC,
          viewCount: 65,
          likesCount: 19,
          authorId: savedUsers['alimov']?.id || author.id,
          departmentId: depts['DOK-2']?.id,
          tags: [tags['texnologiya'], tags['avtomatlashtirish']].filter(Boolean),
        },
        {
          title: "OKMK Raqamli Ekotizimi va AI Imkoniyatlari",
          description: "Kombinat bo'yicha sun'iy intellekt va raqamli taqdimot texnologiyalarini tatbiq etish strategiyasi",
          status: SeminarStatus.COMPLETED,
          isLive: false,
          fileAccess: FileAccess.PUBLIC,
          viewCount: 280,
          likesCount: 75,
          authorId: savedUsers['admin']?.id || author.id,
          departmentId: depts['RAQAMLI']?.id,
          tags: [tags['avtomatlashtirish'], tags['texnologiya']].filter(Boolean),
        },
        {
          title: "Mis Eritish Zavodi Texnologik Rejimi Tahlili",
          description: "Konvertor sexi va anod pechlarining energiya samaradorligi",
          status: SeminarStatus.COMPLETED,
          isLive: false,
          fileAccess: FileAccess.READABLE,
          viewCount: 115,
          likesCount: 31,
          authorId: author.id,
          departmentId: depts['MBF']?.id,
          tags: [tags['mbf'], tags['texnologiya']].filter(Boolean),
        },
        {
          title: "Kon Ishlarida Xavfsizlik Va Favqulodda Vaziyatlar",
          description: "Qalmoqqir ochiq koni xodimlari uchun xavfsizlik amaliyoti",
          status: SeminarStatus.COMPLETED,
          isLive: false,
          fileAccess: FileAccess.PUBLIC,
          viewCount: 94,
          likesCount: 22,
          authorId: savedUsers['karimova']?.id || author.id,
          departmentId: depts['SANOAT']?.id,
          tags: [tags['xavfsizlik']].filter(Boolean),
        },
        {
          title: "Gidrometallurgiya Jarayonlarida Reagentlar Sarfi",
          description: "Yangi flotoreagentlar sinovi va samaradorlik ko'rsatkichlari",
          status: SeminarStatus.COMPLETED,
          isLive: false,
          fileAccess: FileAccess.PRIVATE,
          viewCount: 47,
          likesCount: 11,
          authorId: author.id,
          departmentId: depts['MBF']?.id,
          tags: [tags['mbf'], tags['flotatsiya']].filter(Boolean),
        },
        {
          title: "Kombinat Ekologik Standartlari va Monitoring Tizimi",
          description: "Atrof-muhitni muhofaza qilish bo'yicha 2026-yil chora-tadbirlari",
          status: SeminarStatus.COMPLETED,
          isLive: false,
          fileAccess: FileAccess.PUBLIC,
          viewCount: 130,
          likesCount: 40,
          authorId: savedUsers['head_dept']?.id || author.id,
          departmentId: depts['SANOAT']?.id,
          tags: [tags['xavfsizlik']].filter(Boolean),
        },
      ];

      for (const sem of seminarsData) {
        const s = this.seminarRepository.create(sem as any);
        await this.seminarRepository.save(s);
      }
    }

    this.logger.log('✅ OKMK Enterprise Platform database seeded successfully.');
  }
}
