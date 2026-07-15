import { IsInt, IsNotEmpty, IsString, MaxLength, Min, MinLength } from 'class-validator';
import type { CreateDeviceDto as CreateDeviceShape } from '@iot-deviceshield/types';

export class CreateDeviceDto implements CreateDeviceShape {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  readonly name: string;

  @IsInt()
  @Min(1)
  readonly categoryId: number;
}
