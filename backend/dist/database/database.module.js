"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const config_1 = require("@nestjs/config");
const entities_1 = require("./entities");
const seed_service_1 = require("./seeds/seed.service");
const ENTITIES = [
    entities_1.Department,
    entities_1.SubDepartment,
    entities_1.Position,
    entities_1.User,
    entities_1.Seminar,
    entities_1.SeminarFile,
    entities_1.Tag,
    entities_1.Like,
    entities_1.Comment,
    entities_1.SavedSeminar,
    entities_1.Notification,
    entities_1.LiveSession,
    entities_1.Recording,
    entities_1.AuditLog,
    entities_1.SeminarViewLog,
];
let DatabaseModule = class DatabaseModule {
};
exports.DatabaseModule = DatabaseModule;
exports.DatabaseModule = DatabaseModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forRootAsync({
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                useFactory: (config) => ({
                    type: 'postgres',
                    host: config.get('database.host', 'localhost'),
                    port: config.get('database.port', 5433),
                    username: config.get('database.username', 'okmk_user'),
                    password: config.get('database.password', 'okmk_dev_2026'),
                    database: config.get('database.database', 'okmk_seminar'),
                    entities: ENTITIES,
                    synchronize: config.get('database.synchronize', true),
                    logging: config.get('database.logging', false),
                }),
            }),
            typeorm_1.TypeOrmModule.forFeature([entities_1.User, entities_1.Department, entities_1.Seminar, entities_1.Tag, entities_1.SeminarViewLog]),
        ],
        providers: [seed_service_1.SeedService],
        exports: [typeorm_1.TypeOrmModule, seed_service_1.SeedService],
    })
], DatabaseModule);
//# sourceMappingURL=database.module.js.map