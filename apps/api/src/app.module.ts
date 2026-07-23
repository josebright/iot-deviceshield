import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { SentryModule } from '@sentry/nestjs/setup';
import { LoggerModule } from 'nestjs-pino';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { validateEnv, type Env } from './config/env.schema';
import { buildLoggerParams } from './config/logger.config';
import { Category } from './category/entities/category.entity';
import { Device } from './devices/entities/device.entity';
import { VulnerabilityCache } from './vulnerabilities/entities/vulnerability-cache.entity';
import { CatalogMetadata } from './catalog/entities/catalog-metadata.entity';
import { Client } from './clients/entities/client.entity';
import { CategoryModule } from './category/category.module';
import { DevicesModule } from './devices/devices.module';
import { VulnerabilitiesModule } from './vulnerabilities/vulnerabilities.module';
import { HealthModule } from './health/health.module';
import { ClientsModule } from './clients/clients.module';
import { ClientRegistryMiddleware } from './clients/client-registry.middleware';
import { ClientThrottlerGuard } from './clients/client-throttler.guard';
import { AdminModule } from './admin/admin.module';
import { CatalogModule } from './catalog/catalog.module';

@Module({
  imports: [
    SentryModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
    }),
    LoggerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService<Env, true>) => {
        const env = {
          NODE_ENV: configService.get('NODE_ENV', { infer: true }),
        } as Env;
        return buildLoggerParams(env);
      },
    }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService<Env, true>) => ({
        throttlers: [
          {
            name: 'default',
            ttl: 60_000,
            limit: configService.get('CLIENT_RATE_LIMIT_PER_MIN', { infer: true }),
          },
          {
            name: 'strict',
            ttl: 60_000,
            limit: configService.get('CLIENT_VULN_RATE_LIMIT_PER_MIN', { infer: true }),
          },
        ],
      }),
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService<Env, true>) => ({
        type: 'postgres',
        host: configService.get('DB_HOST', { infer: true }),
        port: configService.get('DB_PORT', { infer: true }),
        username: configService.get('DB_USERNAME', { infer: true }),
        password: configService.get('DB_PASSWORD', { infer: true }),
        database: configService.get('DB_NAME', { infer: true }),
        entities: [Category, Device, VulnerabilityCache, CatalogMetadata, Client],
        synchronize: false,
        migrations: [__dirname + '/migrations/*.{js,ts}'],
        migrationsRun: true,
      }),
    }),
    ClientsModule,
    AdminModule,
    CategoryModule,
    DevicesModule,
    VulnerabilitiesModule,
    CatalogModule,
    HealthModule,
  ],
  controllers: [AppController],
  providers: [AppService, { provide: APP_GUARD, useClass: ClientThrottlerGuard }],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(ClientRegistryMiddleware).forRoutes('*');
  }
}
