import { IsString } from 'class-validator';

export class RefreshTokenDto {
  @IsString({ message: 'El token de actualización es obligatorio' })
  refreshToken: string;
}
