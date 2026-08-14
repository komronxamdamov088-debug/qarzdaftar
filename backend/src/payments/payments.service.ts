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
import { CreatePaymentDto } from './dto/create-payment.dto';
import { Payment } from './entities/payment.entity';

@Injectable()
export class PaymentsService {
  constructor(
    @Inject(SUPABASE_CLIENT) private readonly supabase: SupabaseClient,
    private readonly debtsService: DebtsService,
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
    return { payment: data, debt };
  }

  private mapRpcError(message: string): HttpException {
    switch (message) {
      case 'DEBT_NOT_FOUND':
        return new NotFoundException('Qarz topilmadi');
      case 'FORBIDDEN':
        return new ForbiddenException('Bu qarz sizga tegishli emas');
      case 'DEBT_NOT_PAYABLE':
        return new BadRequestException("Bu qarzga to'lov qo'shib bo'lmaydi");
      case 'INVALID_AMOUNT':
        return new BadRequestException("Summani to'g'ri kiriting");
      case 'AMOUNT_EXCEEDS_REMAINING':
        return new BadRequestException(
          "To'lov summasi qolgan summadan katta bo'lishi mumkin emas",
        );
      default:
        return new InternalServerErrorException(message);
    }
  }
}
