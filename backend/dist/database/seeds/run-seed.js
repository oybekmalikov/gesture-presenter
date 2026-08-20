"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const app_module_1 = require("../../app.module");
const seed_service_1 = require("./seed.service");
async function run() {
    const logger = new common_1.Logger('ManualSeedRunner');
    logger.log('Starting standalone database seed execution...');
    const app = await core_1.NestFactory.createApplicationContext(app_module_1.AppModule, {
        logger: ['log', 'error', 'warn'],
    });
    try {
        const seedService = app.get(seed_service_1.SeedService);
        await seedService.seedAll(true);
        logger.log('Manual seed completed successfully.');
    }
    catch (error) {
        logger.error('Failed to run manual seed:', error);
        process.exit(1);
    }
    finally {
        await app.close();
        process.exit(0);
    }
}
void run();
//# sourceMappingURL=run-seed.js.map