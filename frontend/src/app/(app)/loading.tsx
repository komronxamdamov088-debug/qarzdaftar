import { PageSpinner } from "@/components/page-spinner";

// Covers every route nested under this layout (dashboard, debts, debts/[id],
// debts/new, debts/[id]/edit, profile, activity, statistics) — Next.js's
// loading.tsx wraps the whole child subtree in a Suspense boundary, so one
// file here is enough rather than duplicating it per route.
export default function Loading() {
  return <PageSpinner />;
}
