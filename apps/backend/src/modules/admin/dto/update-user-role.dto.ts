import { IsEnum } from 'class-validator';
import { UserRole } from '@prisma/client';

export class UpdateUserRoleDto {
  @IsEnum(UserRole, { message: 'El rol debe ser CLIENT, TAROT_READER o ADMIN' })
  role: UserRole;
}
