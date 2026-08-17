import {
  ForbiddenException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { SUPABASE_CLIENT } from '../database/supabase.provider';
import type { SupabaseClient } from '../database/supabase.provider';
import { DebtsService } from '../debts/debts.service';
import { DebtWithParties } from '../debts/entities/debt.entity';
import { UsersService } from '../users/users.service';
import { Payment } from '../payments/entities/payment.entity';
import { formatSom } from '../common/i18n/notifications-i18n';
import { getReceiptsI18n } from './receipts-i18n';
import { Receipt } from './entities/receipt.entity';

@Injectable()
export class ReceiptsService {
  private readonly logger = new Logger(ReceiptsService.name);

  constructor(
    @Inject(SUPABASE_CLIENT) private readonly supabase: SupabaseClient,
    private readonly debtsService: DebtsService,
    private readonly usersService: UsersService,
  ) {}

  // Generated for EVERY successful payment (cash and provider), per the
  // user's own spec ("har bir muvaffaqiyatli to'lovdan keyin"). Best-effort:
  // a receipt-generation failure must never break the user-facing payment
  // itself — mirrors AiService's ai_reminder_logs insert precedent.
  async createForPayment(
    payment: Payment,
    debt: DebtWithParties,
  ): Promise<Receipt | null> {
    try {
      const payer = await this.usersService.findById(debt.borrower_id);

      const { data, error } = await this.supabase
        .from('receipts')
        .insert({
          payment_id: payment.id,
          debt_id: debt.id,
          payer_name: debt.borrower.name,
          recipient_name: debt.lender.name,
          payment_amount: Number(payment.amount),
          debt_original_amount: Number(debt.amount),
          debt_paid_amount: Number(debt.amount) - Number(debt.remaining_amount),
          debt_remaining_amount: Number(debt.remaining_amount),
          method: payment.method,
          debt_status: debt.status,
          locale: payer.locale,
        })
        .select('*')
        .single();

      if (error) {
        this.logger.error(
          `Failed to create receipt for payment ${payment.id}: ${error.message}`,
        );
        return null;
      }
      return data;
    } catch (error) {
      this.logger.error(
        `Failed to create receipt for payment ${payment.id}: ${(error as Error).message}`,
      );
      return null;
    }
  }

  async findAllForDebt(userId: string, debtId: string): Promise<Receipt[]> {
    await this.debtsService.findOneForUser(userId, debtId);

    const { data, error } = await this.supabase
      .from('receipts')
      .select('*')
      .eq('debt_id', debtId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new InternalServerErrorException(error.message);
    }
    return data;
  }

  async findOneForUser(userId: string, id: string): Promise<Receipt> {
    const receipt = await this.findById(id);
    await this.debtsService.findOneForUser(userId, receipt.debt_id);
    return receipt;
  }

  // Public path: authorization is "you have the valid confirmation token for
  // this debt", same trust boundary as the rest of debt-confirmation.controller.ts.
  async findOneByToken(token: string, id: string): Promise<Receipt> {
    const debt = await this.debtsService.findByToken(token);
    const receipt = await this.findById(id);
    if (receipt.debt_id !== debt.id) {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: 'Bu chek sizga tegishli emas',
      });
    }
    return receipt;
  }

  async findAllByToken(token: string): Promise<Receipt[]> {
    const debt = await this.debtsService.findByToken(token);

    const { data, error } = await this.supabase
      .from('receipts')
      .select('*')
      .eq('debt_id', debt.id)
      .order('created_at', { ascending: false });

    if (error) {
      throw new InternalServerErrorException(error.message);
    }
    return data;
  }

  async generatePdf(receipt: Receipt): Promise<Uint8Array> {
    const dict = getReceiptsI18n(receipt.locale);
    const doc = await PDFDocument.create();
    const page = doc.addPage([360, 480]);
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const boldFont = await doc.embedFont(StandardFonts.HelveticaBold);

    let y = 430;
    const left = 32;
    const lineHeight = 22;
    const black = rgb(0.06, 0.09, 0.16);
    const gray = rgb(0.39, 0.45, 0.55);

    const drawTitle = (text: string) => {
      page.drawText(text, {
        x: left,
        y,
        size: 16,
        font: boldFont,
        color: black,
      });
      y -= lineHeight + 6;
    };
    const drawRow = (label: string, value: string) => {
      page.drawText(label, { x: left, y, size: 10, font, color: gray });
      page.drawText(value, {
        x: left,
        y: y - 14,
        size: 12,
        font: boldFont,
        color: black,
      });
      y -= lineHeight + 14;
    };

    drawTitle(dict.title);
    drawRow(dict.receiptNumber, receipt.receipt_number);
    drawRow(dict.date, new Date(receipt.created_at).toLocaleDateString());
    drawRow(dict.payer, receipt.payer_name);
    drawRow(dict.recipient, receipt.recipient_name);
    drawRow(
      dict.paymentAmount,
      formatSom(receipt.payment_amount, receipt.locale),
    );
    drawRow(dict.method, dict.methodLabels[receipt.method] ?? receipt.method);
    drawRow(
      dict.debtOriginalAmount,
      formatSom(receipt.debt_original_amount, receipt.locale),
    );
    drawRow(
      dict.debtPaidAmount,
      formatSom(receipt.debt_paid_amount, receipt.locale),
    );
    drawRow(
      dict.debtRemainingAmount,
      formatSom(receipt.debt_remaining_amount, receipt.locale),
    );
    drawRow(
      dict.debtStatus,
      dict.debtStatusLabels[receipt.debt_status] ?? receipt.debt_status,
    );

    page.drawText(dict.disclaimer, {
      x: left,
      y: 40,
      size: 8,
      font,
      color: gray,
      maxWidth: 296,
      lineHeight: 10,
    });

    return doc.save();
  }

  private async findById(id: string): Promise<Receipt> {
    const { data, error } = await this.supabase
      .from('receipts')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw new InternalServerErrorException(error.message);
    }
    if (!data) {
      throw new NotFoundException({
        code: 'RECEIPT_NOT_FOUND',
        message: 'Chek topilmadi',
      });
    }
    return data;
  }
}
