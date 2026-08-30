import { PageSpinner } from "@/components/page-spinner";

// Covers admin, admin/users, admin/reports — same reasoning as
// app/(app)/loading.tsx.
export default function Loading() {
  return <PageSpinner />;
}
