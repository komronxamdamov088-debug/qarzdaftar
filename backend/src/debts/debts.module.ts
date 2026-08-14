import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { UsersModule } from '../users/users.module';
import { DebtsController } from './debts.controller';
import { DebtConfirmationController } from './debt-confirmation.controller';
import { DebtsService } from './debts.service';

@Module({
  imports: [DatabaseModule, UsersModule],
  controllers: [DebtsController, DebtConfirmationController],
  providers: [DebtsService],
  exports: [DebtsService],
})
export class DebtsModule {}
