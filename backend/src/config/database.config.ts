import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
  type: 'postgres' as const,
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USER || 'okmk_user',
  password: process.env.DB_PASSWORD || 'okmk_dev_2026',
  database: process.env.DB_NAME || 'okmk_seminar',
  autoLoadEntities: true,
  synchronize: process.env.DB_SYNCHRONIZE === 'false' ? false : true,
  logging: process.env.NODE_ENV === 'development',
}));
