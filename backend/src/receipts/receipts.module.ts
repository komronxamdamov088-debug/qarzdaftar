import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { DebtsModule } from '../debts/debts.module';
import { UsersModule } from '../users/users.module';
import { ReceiptsController } from './receipts.controller';
import { PublicReceiptsController } from './public-receipts.controller';
import { ReceiptsService } from './receipts.service';

@Module({
  imports: [DatabaseModule, DebtsModule, UsersModule],
  controllers: [ReceiptsController, PublicReceiptsController],
  providers: [ReceiptsService],
  exports: [ReceiptsService],
})
export class ReceiptsModule {}
