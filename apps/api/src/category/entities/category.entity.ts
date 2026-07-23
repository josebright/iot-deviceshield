import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Device } from '../../devices/entities/device.entity';

@Entity({ name: 'smart_home_categories' })
export class Category {
  @PrimaryGeneratedColumn()
  id: number;

  @Index({ unique: true })
  @Column({ type: 'text' })
  slug: string;

  @Column({ type: 'text' })
  name: string;

  @OneToMany(() => Device, (device) => device.category)
  devices: Device[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
