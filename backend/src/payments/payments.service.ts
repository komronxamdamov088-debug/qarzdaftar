import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { SUPABASE_CLIENT } from '../database/supabase.provider';
import type { SupabaseClient } from '../database/supabase.provider';
import { DebtsService } from '../debts/debts.service';
import { DebtWithParties } from '../debts/entities/debt.entity';
import { PaymentMethod, PaymentProviderName } from '../database/database.types';
import { ReceiptsService } from '../receipts/receipts.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { Payment } from './entities/payment.entity';

@Injectable()
export class PaymentsService {
  constructor(
    @Inject(SUPABASE_CLIENT) private readonly supabase: SupabaseClient,
    private readonly debtsService: DebtsService,
    private readonly receiptsService: ReceiptsService,
  ) {}

  async findAllForDebt(userId: string, debtId: string): Promise<Payment[]> {
    await this.debtsService.findOneForUser(userId, debtId);

    const { data, error } = await this.supabase
      .from('payments')
      .select('*')
      .eq('debt_id', debtId)
      .order('paid_at', { ascending: true });

    if (error) {
      throw new InternalServerErrorException(error.message);
    }
    return data;
  }

  async create(
    userId: string,
    debtId: string,
    dto: CreatePaymentDto,
  ): Promise<{ payment: Payment; debt: DebtWithParties }> {
    const { data, error } = await this.supabase.rpc('record_payment', {
      p_debt_id: debtId,
      p_user_id: userId,
      p_amount: dto.amount,
      p_note: dto.note ?? null,
    });

    if (error) {
      throw this.mapRpcError(error.message);
    }

    const debt = await this.debtsService.findOneForUser(userId, debtId);
    await this.receiptsService.createForPayment(data, debt);
    return { payment: data, debt };
  }

  // Called only from PaymentTransactionsService, only after a webhook's
  // signature has been verified and its amount cross-checked — never from
  // client input. `borrowerId` is always passed explicitly (rather than
  // trusting who initiated checkout) so record_payment's FORBIDDEN ownership
  // check stays meaningful even for the unauthenticated public checkout path.
  async recordProviderPayment(
    borrowerId: string,
    debtId: string,
    amount: number,
    method: PaymentProviderName,
    providerTransactionId: string,
    paymentTransactionId: string,
  ): Promise<{ payment: Payment; debt: DebtWithParties }> {
    const { data, error } = await this.supabase.rpc('record_payment', {
      p_debt_id: debtId,
      p_user_id: borrowerId,
      p_amount: amount,
      p_note: null,
      p_method: method as PaymentMethod,
      p_provider_transaction_id: providerTransactionId,
      p_payment_transaction_id: paymentTransactionId,
    });

    if (error) {
      throw this.mapRpcError(error.message);
    }

    const debt = await this.debtsService.findById(debtId);
    await this.receiptsService.createForPayment(data, debt);
    return { payment: data, debt };
  }

  private mapRpcError(message: string): HttpException {
    // `code` is a stable machine-readable identifier the frontend uses to
    // render a localized (UZ/RU) message instead of the Uzbek-only `message`
    // string below, which stays as a safe fallback for any client that
    // doesn't recognize the code.
    switch (message) {
      case 'DEBT_NOT_FOUND':
        return new NotFoundException({
          code: 'DEBT_NOT_FOUND',
          message: 'Qarz topilmadi',
        });
      case 'FORBIDDEN':
        return new ForbiddenException({
          code: 'FORBIDDEN',
          message: 'Bu qarz sizga tegishli emas',
        });
      case 'DEBT_NOT_PAYABLE':
        return new BadRequestException({
          code: 'DEBT_NOT_PAYABLE',
          message: "Bu qarzga to'lov qo'shib bo'lmaydi",
        });
      case 'INVALID_AMOUNT':
        return new BadRequestException({
          code: 'INVALID_AMOUNT',
          message: "Summani to'g'ri kiriting",
        });
      case 'AMOUNT_EXCEEDS_REMAINING':
        return new BadRequestException({
          code: 'AMOUNT_EXCEEDS_REMAINING',
          message: "To'lov summasi qolgan summadan katta bo'lishi mumkin emas",
        });
      default:
        return new InternalServerErrorException(message);
    }
  }
}
