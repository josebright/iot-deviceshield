import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { IsString, MaxLength, MinLength } from 'class-validator';
import { ClientsService } from '../clients/clients.service';
import { AdminTokenGuard } from './admin-token.guard';

class BlacklistBody {
  @IsString()
  @MinLength(3)
  @MaxLength(240)
  reason: string;
}

@ApiTags('admin')
@ApiBearerAuth('admin')
@Controller('admin')
@UseGuards(AdminTokenGuard)
@SkipThrottle()
export class AdminController {
  constructor(private readonly clientsService: ClientsService) {}

  @Get('clients')
  listClients(@Query('limit') limit = '50', @Query('offset') offset = '0') {
    return this.clientsService.list(Number.parseInt(limit, 10), Number.parseInt(offset, 10));
  }

  @Post('clients/:id/blacklist')
  blacklist(@Param('id', ParseUUIDPipe) id: string, @Body() body: BlacklistBody) {
    return this.clientsService.setStatus(id, 'blacklisted', body.reason);
  }

  @Post('clients/:id/unblacklist')
  unblacklist(@Param('id', ParseUUIDPipe) id: string) {
    return this.clientsService.setStatus(id, 'active', 'manual unblock');
  }
}
