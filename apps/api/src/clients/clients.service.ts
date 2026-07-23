import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { Client, type ClientStatus } from './entities/client.entity';
import { computeFingerprint, type FingerprintInput } from './fingerprint.util';

const MAX_STRIKES_BEFORE_BLACKLIST = 3;
const THROTTLE_DURATION_MS = 60 * 60 * 1000;

@Injectable()
export class ClientsService {
  private readonly logger = new Logger(ClientsService.name);

  constructor(
    @InjectRepository(Client)
    private readonly clientRepository: Repository<Client>,
  ) {}

  async touch(input: FingerprintInput): Promise<Client> {
    const fingerprintHash = computeFingerprint(input);
    const now = new Date();

    const existing = await this.clientRepository.findOne({ where: { fingerprintHash } });
    if (existing) {
      existing.ipLast = input.ip;
      existing.userAgentLast = input.userAgent || existing.userAgentLast;
      existing.acceptLanguage = input.acceptLanguage || existing.acceptLanguage;
      existing.clientIdHeader = input.clientIdHeader ?? existing.clientIdHeader;
      existing.requestCount = String(BigInt(existing.requestCount) + 1n);
      existing.lastSeenAt = now;
      if (
        existing.status === 'throttled' &&
        existing.throttleUntil &&
        existing.throttleUntil <= now
      ) {
        existing.status = 'active';
        existing.throttleUntil = null;
      }
      await this.clientRepository.save(existing);
      return existing;
    }

    const created = this.clientRepository.create({
      fingerprintHash,
      ipLast: input.ip,
      userAgentLast: input.userAgent || null,
      acceptLanguage: input.acceptLanguage || null,
      clientIdHeader: input.clientIdHeader,
      requestCount: '1',
      status: 'active',
    });
    return this.clientRepository.save(created);
  }

  async recordThrottleStrike(client: Client, reason: string): Promise<void> {
    client.strikeCount += 1;
    if (client.strikeCount >= MAX_STRIKES_BEFORE_BLACKLIST) {
      client.status = 'blacklisted';
      client.statusReason = `auto-blacklist: ${reason}`;
      client.statusChangedAt = new Date();
      this.logger.warn(`Auto-blacklisted client ${client.id} (${reason})`);
    } else {
      client.status = 'throttled';
      client.statusReason = reason;
      client.throttleUntil = new Date(Date.now() + THROTTLE_DURATION_MS);
      client.statusChangedAt = new Date();
    }
    await this.clientRepository.save(client);
  }

  async setStatus(id: string, status: ClientStatus, reason: string): Promise<Client> {
    const client = await this.clientRepository.findOneOrFail({ where: { id } });
    client.status = status;
    client.statusReason = reason;
    client.statusChangedAt = new Date();
    if (status === 'active') {
      client.strikeCount = 0;
      client.throttleUntil = null;
    }
    return this.clientRepository.save(client);
  }

  list(limit: number, offset: number): Promise<Client[]> {
    return this.clientRepository.find({
      order: { lastSeenAt: 'DESC' },
      take: Math.min(Math.max(limit, 1), 200),
      skip: Math.max(offset, 0),
    });
  }

  async releaseExpiredThrottles(): Promise<number> {
    const result = await this.clientRepository.update(
      { status: 'throttled', throttleUntil: LessThan(new Date()) },
      { status: 'active', statusReason: 'throttle expired', statusChangedAt: new Date() },
    );
    return result.affected ?? 0;
  }
}
