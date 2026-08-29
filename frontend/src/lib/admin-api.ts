import { apiFetch } from "./api";
import type { AdminReports, AdminStats, AdminUserSummary } from "./types";

export function getAdminStats(token: string) {
  return apiFetch<AdminStats>("/admin/stats", { token });
}

export function listAdminUsers(token: string) {
  return apiFetch<AdminUserSummary[]>("/admin/users", { token });
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
