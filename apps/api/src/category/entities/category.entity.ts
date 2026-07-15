import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import type { Category as CategoryShape } from '@iot-deviceshield/types';
import { Device } from '../../devices/entities/device.entity';

@Entity({ name: 'smart_home_categories' })
export class Category implements CategoryShape {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('text')
  name: string;

  @OneToMany(() => Device, (device) => device.category, { cascade: true })
  devices: Device[];
}
