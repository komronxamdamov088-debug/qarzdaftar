export type AiReminderTone =
  'dostona' | 'hurmatli' | 'qisqa' | 'rasmiy' | 'hazilomuz';

export const AI_REMINDER_TONES: AiReminderTone[] = [
  'dostona',
  'hurmatli',
  'qisqa',
  'rasmiy',
  'hazilomuz',
];

export const AI_REMINDER_TONE_INSTRUCTIONS: Record<AiReminderTone, string> = {
  dostona: "Do'stona va iliq ohangda, xuddi yaqin do'stga yozgandek yoz.",
  hurmatli: 'Hurmat va iltifot bilan, odobli va mulohazali ohangda yoz.',
  qisqa: "Juda qisqa va lo'nda, ortiqcha so'zlarsiz, 1-2 gapda yoz.",
  rasmiy: 'Rasmiy va professional uslubda yoz.',
  hazilomuz: 'Yengil hazil bilan, lekin hurmatni saqlagan holda yoz.',
};
