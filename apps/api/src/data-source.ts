import 'reflect-metadata';
import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';
import { Category } from './category/entities/category.entity';
import { Device } from './devices/entities/device.entity';
import { Vulnerability } from './vulnerabilities/entities/vulnerability.entity';
import { User } from './auth/entities/user.entity';

dotenv.config({ path: `${__dirname}/../../../.env` });

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT ?? 5432),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: [Category, Device, Vulnerability, User],
  migrations: [__dirname + '/migrations/*.{js,ts}'],
  synchronize: false,
});
