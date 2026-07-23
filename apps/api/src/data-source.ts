import 'reflect-metadata';
import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';
import { Category } from './category/entities/category.entity';
import { Device } from './devices/entities/device.entity';
import { VulnerabilityCache } from './vulnerabilities/entities/vulnerability-cache.entity';
import { CatalogMetadata } from './catalog/entities/catalog-metadata.entity';
import { Client } from './clients/entities/client.entity';

dotenv.config({ path: `${__dirname}/../../../.env` });

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT ?? 5432),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: [Category, Device, VulnerabilityCache, CatalogMetadata, Client],
  migrations: [__dirname + '/migrations/*.{js,ts}'],
  synchronize: false,
});
