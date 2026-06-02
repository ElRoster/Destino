import { Controller, Get, Post, Body, UseGuards, Req, HttpCode, HttpStatus } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { DepositDto } from './dto/deposit.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('wallet')
export class WalletController {
  constructor(private walletService: WalletService) {}

  @Get('balance')
  async getBalance(@Req() req: any) {
    return this.walletService.getWallet(req.user.sub);
  }

  @Post('deposit')
  @HttpCode(HttpStatus.OK)
  async deposit(@Req() req: any, @Body() dto: DepositDto) {
    return this.walletService.deposit(req.user.sub, dto.amount);
  }

  @Get('transactions')
  async getTransactions(@Req() req: any) {
    return this.walletService.getTransactions(req.user.sub);
  }
}
