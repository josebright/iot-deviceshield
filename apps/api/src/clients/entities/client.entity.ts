import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export type ClientStatus = 'active' | 'throttled' | 'blacklisted';

@Entity({ name: 'smart_home_clients' })
export class Client {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column({ type: 'text', name: 'fingerprint_hash' })
  fingerprintHash: string;

  @Column({ type: 'text', nullable: true, name: 'client_id_header' })
  clientIdHeader: string | null;

  @Column({ type: 'inet', nullable: true, name: 'ip_last' })
  ipLast: string | null;

  @Column({ type: 'text', nullable: true, name: 'user_agent_last' })
  userAgentLast: string | null;

  @Column({ type: 'text', nullable: true, name: 'accept_language' })
  acceptLanguage: string | null;

  @Column({ type: 'bigint', default: 0, name: 'request_count' })
  requestCount: string;

  @Index()
  @Column({ type: 'text', default: 'active' })
  status: ClientStatus;

  @Column({ type: 'text', nullable: true, name: 'status_reason' })
  statusReason: string | null;

  @Column({ type: 'timestamptz', nullable: true, name: 'status_changed_at' })
  statusChangedAt: Date | null;

  @Column({ type: 'int', default: 0, name: 'strike_count' })
  strikeCount: number;

  @Column({ type: 'timestamptz', nullable: true, name: 'throttle_until' })
  throttleUntil: Date | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'first_seen_at' })
  firstSeenAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'last_seen_at' })
  lastSeenAt: Date;
}
