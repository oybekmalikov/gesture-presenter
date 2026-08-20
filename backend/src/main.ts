import * as crypto from 'crypto';
if (!globalThis.crypto) {
  (globalThis as any).crypto = crypto;
}
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

  const uploadDirs = [
    'uploads/pdf',
    'uploads/glb',
    'uploads/avatars',
    'uploads/media',
    'uploads/temp',
  ];
  for (const dir of uploadDirs) {
    const fullPath = path.resolve(process.cwd(), dir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
    }
  }

  app.setGlobalPrefix('api/v1', { exclude: ['health'] });

  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidUnknownValues: false,
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());

  const port = config.get<number>('PORT', 5050);
  await app.listen(port);
  logger.log(`Backend started on port: ${port}`);
}
void bootstrap();
