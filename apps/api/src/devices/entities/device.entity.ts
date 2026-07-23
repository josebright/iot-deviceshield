import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Category } from '../../category/entities/category.entity';

@Entity({ name: 'smart_home_devices' })
export class Device {
  @PrimaryGeneratedColumn()
  id: number;

  @Index({ unique: true })
  @Column({ type: 'text' })
  slug: string;

  @Column({ type: 'text' })
  name: string;

  @Column({ type: 'text', nullable: true })
  vendor: string | null;

  @Column({ type: 'text', nullable: true })
  product: string | null;

  @Column({ type: 'text', nullable: true, name: 'cpe_name' })
  cpeName: string | null;

  @Column({ type: 'real', nullable: true, name: 'cpe_confidence' })
  cpeConfidence: number | null;

  @Column({ type: 'timestamptz', nullable: true, name: 'cpe_resolved_at' })
  cpeResolvedAt: Date | null;

  @ManyToOne(() => Category, (category) => category.devices, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @Column({ name: 'category_id' })
  categoryId: number;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
