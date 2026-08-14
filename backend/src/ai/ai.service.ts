import {
  Inject,
  Injectable,
  InternalServerErrorException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SUPABASE_CLIENT } from '../database/supabase.provider';
import type { SupabaseClient } from '../database/supabase.provider';
import { DebtWithParties } from '../debts/entities/debt.entity';
import {
  AI_REMINDER_TONE_INSTRUCTIONS,
  AiReminderTone,
} from './entities/ai-reminder-tone';

// `gemini-2.5-flash` (the original choice) stopped being available to new
// API keys — confirmed by testing a freshly-created key live against the
// Gemini API, which returned "This model ... is no longer available to new
// users." `gemini-flash-latest` is Google's maintained alias for their
// current default flash-tier model, chosen specifically so this doesn't
// silently break again the next time Google retires a dated model name.
const GEMINI_MODEL = 'gemini-flash-latest';

interface GeminiResponse {
  candidates?: { content?: { parts?: { text?: string }[] } }[];
}

// The model resolved by GEMINI_MODEL uses internal "thinking" tokens before
// producing visible output — confirmed live that this consumes 150-700+
// tokens on its own, so the previous 200-token budget left little to nothing
// for the actual reminder text (empty or garbled responses). 1024 leaves
// comfortable headroom for both. It also doesn't reliably follow "no
// markdown / no quotes" as an instruction alone, so sanitizeAiText() strips
// the common leftovers (markdown bold, wrapping quote marks) defensively.
const MAX_OUTPUT_TOKENS = 1024;

function sanitizeAiText(text: string): string {
  return text
    .trim()
    .replace(/^["'“”‘’]+|["'“”‘’]+$/g, '')
    .replace(/\*\*/g, '')
    .trim();
}

function formatSom(amount: string): string {
  return `${Math.round(Number(amount))
    .toLocaleString('uz-UZ')
    .replace(/,/g, ' ')} so'm`;
}

function formatDueDate(dueDate: string | null): string {
  if (!dueDate) {
    return 'kelishilgan muddatda';
  }
  return new Date(dueDate).toLocaleDateString('uz-UZ', {
    day: 'numeric',
    month: 'long',
  });
}

@Injectable()
export class AiService {
  constructor(
    private readonly config: ConfigService,
    @Inject(SUPABASE_CLIENT) private readonly supabase: SupabaseClient,
  ) {}

  async generateReminder(
    debt: DebtWithParties,
    currentUserId: string,
    tone: AiReminderTone,
  ): Promise<string> {
    const apiKey = this.config.get<string>('AI_API_KEY');
    if (!apiKey) {
      throw new ServiceUnavailableException('AI xizmati hozircha sozlanmagan');
    }

    const counterparty =
      debt.lender_id === currentUserId ? debt.borrower : debt.lender;

    const prompt = [
      "Siz QarzDaftar ilovasi uchun shaxsiy qarz bo'yicha eslatma xabarini o'zbek tilida (lotin alifbosida) yozasiz.",
      `Qarz beruvchi: ${debt.lender.name}.`,
      `Qarz oluvchi: ${debt.borrower.name}.`,
      `Qolgan summa: ${formatSom(debt.remaining_amount)}.`,
      `Qaytarish sanasi: ${formatDueDate(debt.due_date)}.`,
      `Xabar ${counterparty.name}ga yo'llanadi, shuning uchun to'g'ridan-to'g'ri unga murojaat qilib yoz.`,
      AI_REMINDER_TONE_INSTRUCTIONS[tone],
      "Xabar hech qachon tahdid, sharmandalik, haqorat, bezovtalik yoki bosim mazmunida bo'lmasin — doim muloyim va hurmatli bo'lsin.",
      "Faqat tayyor xabar matnini qaytar. Hech qanday izoh, sarlavha, tirnoq belgisi yoki markdown formatlash (masalan **qalin matn**) ishlatma — oddiy matn ko'rinishida yoz.",
    ].join('\n');

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: MAX_OUTPUT_TOKENS,
          },
        }),
      },
    );

    if (!response.ok) {
      throw new InternalServerErrorException(
        'AI xabar yaratishda xatolik yuz berdi',
      );
    }

    const data = (await response.json()) as GeminiResponse;
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    const text = rawText ? sanitizeAiText(rawText) : undefined;
    if (!text) {
      throw new InternalServerErrorException(
        'AI xabar yaratishda xatolik yuz berdi',
      );
    }

    // Best-effort usage log for the admin "AI reminder usage" metric — never
    // fails the user-facing request if the insert itself has a problem.
    try {
      await this.supabase
        .from('ai_reminder_logs')
        .insert({ user_id: currentUserId, tone });
    } catch {
      // intentionally swallowed — logging failure must not break the reminder feature
    }

    return text;
  }
}
