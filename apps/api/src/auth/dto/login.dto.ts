import { IsEmail, IsString, MaxLength } from 'class-validator';

export class LoginDto {
  @IsEmail()
  @MaxLength(254)
  readonly email: string;

  @IsString()
  @MaxLength(128)
  readonly password: string;
}
