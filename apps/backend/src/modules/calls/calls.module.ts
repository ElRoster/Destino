import { Module } from '@nestjs/common';
import { CallsService } from './calls.service';
import { CallsGateway } from './calls.gateway';
import { CallsController } from './calls.controller';
import { AuthModule } from '../auth/auth.module';
import { WalletModule } from '../wallet/wallet.module';

@Module({
  imports: [AuthModule, WalletModule],
  controllers: [CallsController],
  providers: [CallsService, CallsGateway],
  exports: [CallsService],
})
export class CallsModule {}
