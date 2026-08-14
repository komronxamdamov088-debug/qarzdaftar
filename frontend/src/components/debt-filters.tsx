"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";

const DIRECTION_OPTIONS = [
  { value: "", label: "Barchasi" },
  { value: "given", label: "Men berdim" },
  { value: "taken", label: "Men oldim" },
];

const STATE_OPTIONS = [
  { value: "", label: "Barchasi" },
  { value: "unpaid", label: "To'lanmagan" },
  { value: "paid", label: "To'langan" },
  { value: "overdue", label: "Muddati o'tgan" },
];

const SORT_OPTIONS = [
  { value: "newest", label: "Yangi" },
  { value: "oldest", label: "Eski" },
  { value: "amount", label: "Katta summa" },
  { value: "due_date", label: "Yaqin muddat" },
];

export function DebtFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const [, startTransition] = useTransition();

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
          placeholder="Ism yoki summa bo'yicha qidirish"
          className="w-full rounded-lg border border-black/10 bg-card px-3 py-2 text-sm"
        />
      </form>
      <div className="flex flex-wrap gap-2">
        <select
          defaultValue={searchParams.get("direction") ?? ""}
          onChange={(event) => updateParam("direction", event.target.value)}
          className="rounded-lg border border-black/10 bg-card px-2 py-1.5 text-sm"
        >
          {DIRECTION_OPTIONS.map((option) => (
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
          {STATE_OPTIONS.map((option) => (
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
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
