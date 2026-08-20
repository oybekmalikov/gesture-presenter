import * as crypto from 'crypto';
if (!globalThis.crypto) {
  (globalThis as any).crypto = crypto;
}
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from '../../app.module';
import { SeedService } from './seed.service';

async function run() {
  const logger = new Logger('ManualSeedRunner');
  logger.log('Starting standalone database seed execution...');
  
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['log', 'error', 'warn'],
  });

  try {
    const seedService = app.get(SeedService);
    await seedService.seedAll(true);
    logger.log('Manual seed completed successfully.');
  } catch (error) {
    logger.error('Failed to run manual seed:', error);
    process.exit(1);
  } finally {
    await app.close();
    process.exit(0);
  }
}

void run();
