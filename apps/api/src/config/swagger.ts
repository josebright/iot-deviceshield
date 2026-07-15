import { randomBytes } from 'node:crypto';
import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import basicAuth from 'express-basic-auth';
import type { Env } from './env.schema';

interface MinimalLogger {
  log(message: string): void;
  warn(message: string): void;
}

export function setupSwagger(app: INestApplication, env: Env, logger: MinimalLogger): void {
  const config = new DocumentBuilder()
    .setTitle('IoT-DeviceShield API')
    .setDescription(
      'REST API for smart home device inventory, CVE ingestion (NIST NVD), and AI-assisted risk assessment.',
    )
    .setVersion('0.1.0')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'jwt')
    .addServer(`http://localhost:${env.API_PORT}`, 'local')
    .build();

  const document = SwaggerModule.createDocument(app, config);

  const path = 'v1/docs';

  if (env.NODE_ENV === 'production') {
    // Generate a random password each boot if the operator did not set one via
    // env; the password is logged so infra can grab it, and it rotates on every
    // restart. This keeps the docs endpoint reachable but not casually indexed.
    const user = process.env.SWAGGER_USER ?? 'admin';
    const password = process.env.SWAGGER_PASSWORD ?? randomBytes(16).toString('base64url');
    app.use(
      [`/${path}`, `/${path}-json`],
      basicAuth({ challenge: true, users: { [user]: password } }),
    );
    if (!process.env.SWAGGER_PASSWORD) {
      logger.warn(`Swagger basic-auth password auto-generated (user=${user}). See logs.`);
      logger.warn(`Swagger password: ${password}`);
    }
  }

  SwaggerModule.setup(path, app, document, {
    jsonDocumentUrl: `${path}-json`,
    swaggerOptions: { persistAuthorization: true },
  });

  logger.log(`Swagger UI mounted at /${path}`);
}
