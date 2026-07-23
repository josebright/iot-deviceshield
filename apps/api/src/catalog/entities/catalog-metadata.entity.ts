import { Column, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity({ name: 'catalog_metadata' })
export class CatalogMetadata {
  @PrimaryColumn({ type: 'int', default: 1 })
  id: number;

  @Column({ type: 'timestamptz', nullable: true, name: 'last_refresh_at' })
  lastRefreshAt: Date | null;

  @Column({ type: 'text', nullable: true, name: 'source_version' })
  sourceVersion: string | null;

  @Column({ type: 'int', default: 0, name: 'error_count' })
  errorCount: number;

  @Column({ type: 'text', nullable: true, name: 'last_error' })
  lastError: string | null;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;
}
