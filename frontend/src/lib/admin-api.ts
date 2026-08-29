import { apiFetch } from "./api";
import type { AdminReports, AdminStats, AdminUserSummary } from "./types";

export function getAdminStats(token: string) {
  return apiFetch<AdminStats>("/admin/stats", { token });
}

export function listAdminUsers(
  token: string,
  filter?: { accountType?: "personal" | "business"; search?: string },
) {
  const params = new URLSearchParams();
  if (filter?.accountType) params.set("accountType", filter.accountType);
  if (filter?.search) params.set("search", filter.search);
  const query = params.toString();
  return apiFetch<AdminUserSummary[]>(
    `/admin/users${query ? `?${query}` : ""}`,
    { token },
  );
}

export function updateAdminUserRole(
  token: string,
  userId: string,
  role: "user" | "admin",
) {
  return apiFetch<AdminUserSummary>(`/admin/users/${userId}/role`, {
    method: "PATCH",
    body: { role },
    token,
  });
}

export function getAdminReports(token: string) {
  return apiFetch<AdminReports>("/admin/reports", { token });
}

export function convertAdminUserToBusiness(
  token: string,
  userId: string,
  businessName: string,
) {
  return apiFetch<AdminUserSummary>(`/admin/users/${userId}/business`, {
    method: "PATCH",
    body: { businessName },
    token,
  });
}

export function updateAdminUserSubscriptionStatus(
  token: string,
  userId: string,
  active: boolean,
) {
  return apiFetch<AdminUserSummary>(`/admin/users/${userId}/subscription`, {
    method: "PATCH",
    body: { active },
    token,
  });
}

export function updateAdminUserSubscriptionPricing(
  token: string,
  userId: string,
  input: { price?: number; discountPercent?: number },
) {
  return apiFetch<AdminUserSummary>(
    `/admin/users/${userId}/subscription-pricing`,
    { method: "PATCH", body: input, token },
  );
}

export function revertAdminUserToPersonal(token: string, userId: string) {
  return apiFetch<AdminUserSummary>(`/admin/users/${userId}/personal`, {
    method: "PATCH",
    token,
  });
}

export function addAdminUserSubscriptionBonus(
  token: string,
  userId: string,
  days: number,
) {
  return apiFetch<AdminUserSummary>(
    `/admin/users/${userId}/subscription-bonus`,
    { method: "POST", body: { days }, token },
  );
}
