"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "@/i18n/locale-context";
import { formatDate, formatSom } from "@/lib/format";
import type { AdminUserSummary } from "@/lib/types";
import type { Locale } from "@/i18n/locale";
import {
  addSubscriptionBonusAction,
  convertToBusinessAction,
  updateSubscriptionPricingAction,
  updateSubscriptionStatusAction,
} from "./actions";

export function BusinessStatusControl({
  user,
  locale,
}: {
  user: AdminUserSummary;
  locale: Locale;
}) {
  const { dict } = useTranslations();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [editingPricing, setEditingPricing] = useState(false);
  const [price, setPrice] = useState(user.subscriptionPrice);
  const [discount, setDiscount] = useState(user.subscriptionDiscountPercent);
  const [bonusDays, setBonusDays] = useState("30");

  function convert() {
    const trimmed = name.trim();
    if (!trimmed) return;
    setError(null);
    startTransition(async () => {
      const result = await convertToBusinessAction(user.id, trimmed);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setShowForm(false);
    });
  }

  function toggleSubscription() {
    setError(null);
    startTransition(async () => {
      const result = await updateSubscriptionStatusAction(
        user.id,
        !user.subscriptionActive,
      );
      if (!result.ok) {
        setError(result.message);
      }
    });
  }

  function savePricing() {
    const parsedPrice = price.trim() === "" ? undefined : Number(price);
    const parsedDiscount =
      discount.trim() === "" ? undefined : Number(discount);
    const priceInvalid =
      parsedPrice !== undefined &&
      (!Number.isFinite(parsedPrice) || parsedPrice < 0);
    const discountInvalid =
      parsedDiscount !== undefined &&
      (!Number.isFinite(parsedDiscount) ||
        parsedDiscount < 0 ||
        parsedDiscount > 100);
    if (priceInvalid || discountInvalid) {
      setError(dict.admin.subscriptionPricingInvalid);
      return;
    }

    setError(null);
    startTransition(async () => {
      const result = await updateSubscriptionPricingAction(user.id, {
        price: parsedPrice,
        discountPercent: parsedDiscount,
      });
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setEditingPricing(false);
    });
  }

  function addBonus() {
    const days = Number(bonusDays);
    if (!Number.isInteger(days) || days <= 0) {
      setError(dict.admin.subscriptionBonusDaysInvalid);
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await addSubscriptionBonusAction(user.id, days);
      if (!result.ok) {
        setError(result.message);
      }
    });
  }

  if (user.accountType === "business") {
    return (
      <div className="flex flex-col items-end gap-2">
        <span className="text-xs font-medium">{user.businessName}</span>
        <button
          type="button"
          onClick={toggleSubscription}
          disabled={isPending}
          className="rounded-full border border-black/10 px-3 py-1.5 text-xs font-medium whitespace-nowrap disabled:opacity-50"
        >
          {user.subscriptionActive
            ? dict.admin.deactivateSubscription
            : dict.admin.activateSubscription}
        </button>

        <div className="flex flex-col items-end gap-0.5 text-xs text-muted-foreground">
          <span>
            {formatSom(user.subscriptionPrice, locale)}
            {Number(user.subscriptionDiscountPercent) > 0
              ? ` (-${user.subscriptionDiscountPercent}%)`
              : ""}
          </span>
          <span>
            {dict.admin.subscriptionValidUntil}:{" "}
            {user.subscriptionValidUntil
              ? formatDate(user.subscriptionValidUntil, locale)
              : dict.admin.subscriptionNoExpiry}
          </span>
        </div>

        {editingPricing ? (
          <div className="flex flex-col items-end gap-1">
            <input
              type="number"
              min={0}
              step="any"
              value={price}
              onChange={(event) => setPrice(event.target.value)}
              placeholder={dict.admin.subscriptionPricePlaceholder}
              className="w-36 rounded-lg border border-black/10 px-2 py-1.5 text-xs"
            />
            <input
              type="number"
              min={0}
              max={100}
              step="any"
              value={discount}
              onChange={(event) => setDiscount(event.target.value)}
              placeholder={dict.admin.subscriptionDiscountPlaceholder}
              className="w-36 rounded-lg border border-black/10 px-2 py-1.5 text-xs"
            />
            <div className="flex gap-1">
              <button
                type="button"
                onClick={savePricing}
                disabled={isPending}
                className="rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
              >
                {dict.common.save}
              </button>
              <button
                type="button"
                onClick={() => setEditingPricing(false)}
                disabled={isPending}
                className="rounded-full border border-black/10 px-3 py-1.5 text-xs font-medium"
              >
                {dict.common.cancel}
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setEditingPricing(true)}
            className="text-xs font-medium underline underline-offset-2"
          >
            {dict.admin.editSubscriptionPricing}
          </button>
        )}

        <div className="flex items-center gap-1">
          <input
            type="number"
            min={1}
            step={1}
            value={bonusDays}
            onChange={(event) => setBonusDays(event.target.value)}
            className="w-14 rounded-lg border border-black/10 px-2 py-1.5 text-xs"
          />
          <button
            type="button"
            onClick={addBonus}
            disabled={isPending}
            className="rounded-full border border-black/10 px-3 py-1.5 text-xs font-medium whitespace-nowrap disabled:opacity-50"
          >
            {dict.admin.addSubscriptionBonusDays}
          </button>
        </div>

        {error && <p className="text-xs text-danger">{error}</p>}
      </div>
    );
  }

  if (showForm) {
    return (
      <div className="flex flex-col items-end gap-1">
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder={dict.admin.businessNamePlaceholder}
          className="w-36 rounded-lg border border-black/10 px-2 py-1.5 text-xs"
        />
        <div className="flex gap-1">
          <button
            type="button"
            onClick={convert}
            disabled={isPending || !name.trim()}
            className="rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
          >
            {dict.common.save}
          </button>
          <button
            type="button"
            onClick={() => setShowForm(false)}
            disabled={isPending}
            className="rounded-full border border-black/10 px-3 py-1.5 text-xs font-medium"
          >
            {dict.common.cancel}
          </button>
        </div>
        {error && <p className="text-xs text-danger">{error}</p>}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setShowForm(true)}
      className="rounded-full border border-black/10 px-3 py-1.5 text-xs font-medium whitespace-nowrap"
    >
      {dict.admin.convertToBusiness}
    </button>
  );
}
