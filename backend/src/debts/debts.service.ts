import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { SUPABASE_CLIENT } from '../database/supabase.provider';
import type { SupabaseClient } from '../database/supabase.provider';
import { UsersService } from '../users/users.service';
import { CreateDebtDto } from './dto/create-debt.dto';
import { UpdateDebtDto } from './dto/update-debt.dto';
import { ListDebtsQueryDto } from './dto/list-debts-query.dto';
import { DebtWithParties } from './entities/debt.entity';

const DEBT_WITH_PARTIES_SELECT =
  '*, lender:users!debts_lender_id_fkey(id,name,avatar_url), borrower:users!debts_borrower_id_fkey(id,name,avatar_url)';

@Injectable()
export class DebtsService {
  constructor(
    @Inject(SUPABASE_CLIENT) private readonly supabase: SupabaseClient,
    private readonly usersService: UsersService,
  ) {}

  async create(
    currentUserId: string,
    dto: CreateDebtDto,
  ): Promise<DebtWithParties> {
    const counterparty = await this.usersService.findOrCreateCounterparty(
      dto.person.name,
      dto.person.phone,
    );

    if (counterparty.id === currentUserId) {
      throw new ForbiddenException({
        code: 'CANNOT_DEBT_SELF',
        message: "O'zingizga qarz yoza olmaysiz",
      });
    }

    const lenderId = dto.type === 'given' ? currentUserId : counterparty.id;
    const borrowerId = dto.type === 'given' ? counterparty.id : currentUserId;

    const { data, error } = await this.supabase
      .from('debts')
      .insert({
        lender_id: lenderId,
        borrower_id: borrowerId,
        amount: dto.amount,
        remaining_amount: dto.amount,
        due_date: dto.dueDate ?? null,
        note: dto.note ?? null,
      })
      .select(DEBT_WITH_PARTIES_SELECT)
      .single();

    if (error) {
      throw new InternalServerErrorException(error.message);
    }
    return data as unknown as DebtWithParties;
  }

  async findAllForUser(
    userId: string,
    query: ListDebtsQueryDto,
  ): Promise<DebtWithParties[]> {
    let request = this.supabase
      .from('debts')
      .select(DEBT_WITH_PARTIES_SELECT)
      .or(`lender_id.eq.${userId},borrower_id.eq.${userId}`);

    if (query.direction === 'given') {
      request = request.eq('lender_id', userId);
    } else if (query.direction === 'taken') {
      request = request.eq('borrower_id', userId);
    }

    if (query.state === 'paid') {
      request = request.eq('status', 'paid');
    } else if (query.state === 'unpaid') {
      request = request.in('status', [
        'pending',
        'confirmed',
        'partially_paid',
        'overdue',
      ]);
    } else if (query.state === 'overdue') {
      request = request
        .lt('due_date', new Date().toISOString().slice(0, 10))
        .not('status', 'in', '(paid,cancelled)');
    }

    switch (query.sort) {
      case 'oldest':
        request = request.order('created_at', { ascending: true });
        break;
      case 'amount':
        request = request.order('amount', { ascending: false });
        break;
      case 'due_date':
        request = request.order('due_date', {
          ascending: true,
          nullsFirst: false,
        });
        break;
      case 'newest':
      default:
        request = request.order('created_at', { ascending: false });
        break;
    }

    const { data, error } = await request;
    if (error) {
      throw new InternalServerErrorException(error.message);
    }

    const debts = data as unknown as DebtWithParties[];
    if (!query.search) {
      return debts;
    }

    const search = query.search.trim().toLowerCase();
    return debts.filter((debt) => {
      const counterparty =
        debt.lender_id === userId ? debt.borrower : debt.lender;
      return (
        counterparty.name.toLowerCase().includes(search) ||
        debt.amount.includes(search)
      );
    });
  }

  async findOneForUser(userId: string, id: string): Promise<DebtWithParties> {
    const { data, error } = await this.supabase
      .from('debts')
      .select(DEBT_WITH_PARTIES_SELECT)
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw new InternalServerErrorException(error.message);
    }
    const debt = data as unknown as DebtWithParties | null;
    if (!debt) {
      throw new NotFoundException({
        code: 'DEBT_NOT_FOUND',
        message: 'Qarz topilmadi',
      });
    }
    this.assertOwnership(userId, debt);
    return debt;
  }

  // No ownership check — for internal server-side use only (e.g. the reminder scheduler), never exposed via a controller.
  async findById(id: string): Promise<DebtWithParties> {
    const { data, error } = await this.supabase
      .from('debts')
      .select(DEBT_WITH_PARTIES_SELECT)
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw new InternalServerErrorException(error.message);
    }
    const debt = data as unknown as DebtWithParties | null;
    if (!debt) {
      throw new NotFoundException('Qarz topilmadi');
    }
    return debt;
  }

  async update(
    userId: string,
    id: string,
    dto: UpdateDebtDto,
  ): Promise<DebtWithParties> {
    const existing = await this.findOneForUser(userId, id);

    const { data, error } = await this.supabase
      .from('debts')
      .update({
        ...(dto.amount !== undefined && { amount: dto.amount }),
        ...(dto.dueDate !== undefined && { due_date: dto.dueDate }),
        ...(dto.note !== undefined && { note: dto.note }),
      })
      .eq('id', existing.id)
      .select(DEBT_WITH_PARTIES_SELECT)
      .single();

    if (error) {
      throw new InternalServerErrorException(error.message);
    }
    return data as unknown as DebtWithParties;
  }

  async remove(userId: string, id: string): Promise<void> {
    const existing = await this.findOneForUser(userId, id);

    const { error } = await this.supabase
      .from('debts')
      .delete()
      .eq('id', existing.id);
    if (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async findByToken(token: string): Promise<DebtWithParties> {
    const { data, error } = await this.supabase
      .from('debts')
      .select(DEBT_WITH_PARTIES_SELECT)
      .eq('confirmation_token', token)
      .maybeSingle();

    if (error) {
      throw new InternalServerErrorException(error.message);
    }
    const debt = data as unknown as DebtWithParties | null;
    if (!debt) {
      throw new NotFoundException({
        code: 'INVALID_TOKEN',
        message: "Havola yaroqsiz yoki muddati o'tgan",
      });
    }
    return debt;
  }

  async confirmByToken(
    token: string,
    action: 'confirm' | 'reject',
  ): Promise<DebtWithParties> {
    const debt = await this.findByToken(token);

    if (debt.confirmation_status !== 'pending') {
      throw new BadRequestException({
        code: 'DEBT_ALREADY_REVIEWED',
        message: "Bu qarz allaqachon ko'rib chiqilgan",
      });
    }

    const confirmationStatus = action === 'confirm' ? 'confirmed' : 'rejected';
    const status =
      action === 'reject'
        ? 'cancelled'
        : debt.status === 'pending'
          ? 'confirmed'
          : debt.status;

    const { data, error } = await this.supabase
      .from('debts')
      .update({ confirmation_status: confirmationStatus, status })
      .eq('confirmation_token', token)
      .eq('confirmation_status', 'pending')
      .select(DEBT_WITH_PARTIES_SELECT)
      .maybeSingle();

    if (error) {
      throw new InternalServerErrorException(error.message);
    }
    if (!data) {
      throw new BadRequestException({
        code: 'DEBT_ALREADY_REVIEWED',
        message: "Bu qarz allaqachon ko'rib chiqilgan",
      });
    }
    return data as unknown as DebtWithParties;
  }

  private assertOwnership(userId: string, debt: DebtWithParties): void {
    if (debt.lender_id !== userId && debt.borrower_id !== userId) {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: 'Bu qarz sizga tegishli emas',
      });
    }
  }
}
