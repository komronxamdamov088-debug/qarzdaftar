import { apiFetch } from "./api";
import type {
  GenerateAiReminderInput,
  GenerateAiReminderResult,
} from "./types";

export function generateAiReminder(
  token: string,
  input: GenerateAiReminderInput,
) {
  return apiFetch<GenerateAiReminderResult>("/ai/reminder", {
    method: "POST",
    body: input,
    token,
  });
}
