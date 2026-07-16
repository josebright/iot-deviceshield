import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { SentryModule } from '@sentry/nestjs/setup';
import { LoggerModule } from 'nestjs-pino';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { validateEnv, type Env } from './config/env.schema';
import { buildLoggerParams } from './config/logger.config';
import { Category } from './category/entities/category.entity';
import { Device } from './devices/entities/device.entity';
import { Vulnerability } from './vulnerabilities/entities/vulnerability.entity';
import { User } from './auth/entities/user.entity';
import { CategoryModule } from './category/category.module';
import { DevicesModule } from './devices/devices.module';
import { VulnerabilitiesModule } from './vulnerabilities/vulnerabilities.module';
import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';

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
        const env: Env = {
          NODE_ENV: configService.get('NODE_ENV', { infer: true }),
          API_PORT: configService.get('API_PORT', { infer: true }),
          DB_HOST: configService.get('DB_HOST', { infer: true }),
          DB_PORT: configService.get('DB_PORT', { infer: true }),
          DB_USERNAME: configService.get('DB_USERNAME', { infer: true }),
          DB_PASSWORD: configService.get('DB_PASSWORD', { infer: true }),
          DB_NAME: configService.get('DB_NAME', { infer: true }),
          JWT_SECRET: configService.get('JWT_SECRET', { infer: true }),
          JWT_EXPIRES_IN: configService.get('JWT_EXPIRES_IN', { infer: true }),
          FRONTEND_URL: configService.get('FRONTEND_URL', { infer: true }),
          OPENAI_API_KEY: configService.get('OPENAI_API_KEY', { infer: true }),
          NVD_API_KEY: configService.get('NVD_API_KEY', { infer: true }),
          SENTRY_DSN: configService.get('SENTRY_DSN', { infer: true }),
        };
        return buildLoggerParams(env);
      },
    }),
    ThrottlerModule.forRoot([
      { name: 'default', ttl: 60_000, limit: 100 },
      { name: 'strict', ttl: 60_000, limit: 10 },
    ]),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService<Env, true>) => ({
        type: 'postgres',
        host: configService.get('DB_HOST', { infer: true }),
        port: configService.get('DB_PORT', { infer: true }),
        username: configService.get('DB_USERNAME', { infer: true }),
        password: configService.get('DB_PASSWORD', { infer: true }),
        database: configService.get('DB_NAME', { infer: true }),
        entities: [Category, Device, Vulnerability, User],
        synchronize: configService.get('NODE_ENV', { infer: true }) !== 'production',
        migrations: [__dirname + '/migrations/*.{js,ts}'],
        migrationsRun: false,
      }),
    }),
    AuthModule,
    CategoryModule,
    DevicesModule,
    VulnerabilitiesModule,
    HealthModule,
  ],
  controllers: [AppController],
  providers: [AppService, { provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
