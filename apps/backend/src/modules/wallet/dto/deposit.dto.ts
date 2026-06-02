import { IsNumber, Min } from 'class-validator';

export class DepositDto {
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'El monto debe ser un número con máximo 2 decimales' })
  @Min(1.00, { message: 'El depósito mínimo es de 1.00 tokens' })
  amount: number;
}
