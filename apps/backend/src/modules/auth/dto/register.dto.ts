import { IsDateString, IsEmail, IsString, MinLength, IsEnum, IsOptional } from 'class-validator';
import { UserRole } from '@prisma/client';

export class RegisterDto {

  @IsEmail({}, { message: 'Debe ingresar un correo electrónico válido' })
  email: string;

  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  password: string;

  @IsEnum(UserRole, { message: 'El rol debe ser CLIENT o TAROT_READER' })
  role: UserRole;

  // 🔥 OBLIGATORIOS (por Prisma)
  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsDateString({}, { message: 'Debe ingresar una fecha de nacimiento válida' })
  birthDate: string;

  // Optional Tarot Reader profile configuration
  @IsOptional()
  @IsString()
  displayName?: string;

  @IsOptional()
  @IsString()
  bio?: string;
}
