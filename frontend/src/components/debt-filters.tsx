"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { useTranslations } from "@/i18n/locale-context";

export function DebtFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const [, startTransition] = useTransition();
  const { dict } = useTranslations();

  const directionOptions = [
    { value: "", label: dict.debtsPage.filterAll },
    { value: "given", label: dict.debtsPage.filterGiven },
    { value: "taken", label: dict.debtsPage.filterTaken },
  ];

  const stateOptions = [
    { value: "", label: dict.debtsPage.filterAll },
    { value: "unpaid", label: dict.debtsPage.filterUnpaid },
    { value: "paid", label: dict.debtsPage.filterPaid },
    { value: "overdue", label: dict.debtsPage.filterOverdue },
  ];

  const sortOptions = [
    { value: "newest", label: dict.debtsPage.sortNewest },
    { value: "oldest", label: dict.debtsPage.sortOldest },
    { value: "amount", label: dict.debtsPage.sortAmount },
    { value: "due_date", label: dict.debtsPage.sortDueDate },
  ];

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  }

  return (
    <div className="flex flex-col gap-3 px-4">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          updateParam("search", search);
        }}
      >
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={dict.debtsPage.searchPlaceholder}
          className="w-full rounded-lg border border-black/10 bg-card px-3 py-2 text-sm"
        />
      </form>
      <div className="flex flex-wrap gap-2">
        <select
          defaultValue={searchParams.get("direction") ?? ""}
          onChange={(event) => updateParam("direction", event.target.value)}
          className="rounded-lg border border-black/10 bg-card px-2 py-1.5 text-sm"
        >
          {directionOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <select
          defaultValue={searchParams.get("state") ?? ""}
          onChange={(event) => updateParam("state", event.target.value)}
          className="rounded-lg border border-black/10 bg-card px-2 py-1.5 text-sm"
        >
          {stateOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <select
          defaultValue={searchParams.get("sort") ?? "newest"}
          onChange={(event) => updateParam("sort", event.target.value)}
          className="rounded-lg border border-black/10 bg-card px-2 py-1.5 text-sm"
        >
          {sortOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
