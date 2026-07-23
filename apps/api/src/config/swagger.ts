import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import type { Env } from './env.schema';

interface MinimalLogger {
  log(message: string): void;
}

export function setupSwagger(app: INestApplication, env: Env, logger: MinimalLogger): void {
  if (env.NODE_ENV === 'production') {
    return;
  }

  const config = new DocumentBuilder()
    .setTitle('IoT-DeviceShield API')
    .setDescription(
      'REST API for smart home device inventory, CVE ingestion (NIST NVD), and AI-assisted risk assessment.',
    )
    .setVersion('0.1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', description: 'Admin API token (ADMIN_API_TOKEN env)' },
      'admin',
    )
    .addServer(`http://localhost:${env.API_PORT}`, 'local')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  const path = 'v1/docs';

  SwaggerModule.setup(path, app, document, {
    jsonDocumentUrl: `${path}-json`,
    swaggerOptions: { persistAuthorization: true },
  });

  logger.log(`Swagger UI mounted at /${path} (development only)`);
}
