import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Client } from './entities/client.entity';
import { ClientsService } from './clients.service';
import { ClientRegistryMiddleware } from './client-registry.middleware';
import { ClientThrottlerGuard } from './client-throttler.guard';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([Client])],
  providers: [ClientsService, ClientRegistryMiddleware, ClientThrottlerGuard],
  exports: [ClientsService, ClientRegistryMiddleware, ClientThrottlerGuard],
})
export class ClientsModule {}
