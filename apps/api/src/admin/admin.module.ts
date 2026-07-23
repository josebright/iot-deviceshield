import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminTokenGuard } from './admin-token.guard';

@Module({
  controllers: [AdminController],
  providers: [AdminTokenGuard],
  exports: [AdminTokenGuard],
})
export class AdminModule {}
