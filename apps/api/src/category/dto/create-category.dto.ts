import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';
import type { CreateCategoryDto as CreateCategoryShape } from '@iot-deviceshield/types';

export class CreateCategoryDto implements CreateCategoryShape {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  readonly name: string;
}
