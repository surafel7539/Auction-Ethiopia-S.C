"use client";

import { useActionState, useState } from "react";
import { payListingAction } from "@/app/actions/payments";
import { formatETB } from "@/lib/format";
import { useI18n } from "@/components/LocaleProvider";

const METHODS = [
  { id: "TELEBIRR", label: "Telebirr" },
  { id: "CBE_BIRR", label: "CBE Birr" },
  { id: "CARD", key: "visa" },
];

export function PaymentForm({ listing, defaultName = "" }) {
  const { locale, t } = useI18n();
  const [method, setMethod] = useState("TELEBIRR");
  const [state, action, pending] = useActionState(payListingAction, {});

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="listingId" value={listing.id} />
      <input type="hidden" name="method" value={method} />

      <div>
        <p className="text-xs uppercase tracking-[0.18em] text-gold">
          {t("amountDue")}
        </p>
        <p className="display mt-1 text-3xl text-heading">
          {formatETB(listing.currentBid, locale)}
        </p>
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-heading">
          {t("paymentMethod")}
        </legend>
        <div className="grid gap-2 sm:grid-cols-3">
          {METHODS.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setMethod(option.id)}
              className={`rounded-xl border px-3 py-2 text-sm ${
                method === option.id
                  ? "border-gold bg-gold-soft/50 text-heading"
                  : "border-forest/15 bg-field text-forest"
              }`}
            >
              {option.key ? t(option.key) : option.label}
            </button>
          ))}
        </div>
      </fieldset>

      <label className="block space-y-2">
        <span className="text-sm font-medium text-heading">
          {t("accountName")}
        </span>
        <input
          name="payerName"
          required
          defaultValue={defaultName}
          className="w-full rounded-xl border border-forest/15 px-3 py-2"
        />
      </label>

      {method === "CARD" ? (
        <>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-heading">
              {t("cardNumber")}
            </span>
            <input
              name="cardNumber"
              required
              inputMode="numeric"
              autoComplete="cc-number"
              placeholder="4000 0000 0000 0000"
              className="w-full rounded-xl border border-forest/15 px-3 py-2"
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block space-y-2">
              <span className="text-sm font-medium text-heading">
                {t("expiry")}
              </span>
              <input
                name="expiry"
                required
                placeholder="08/28"
                className="w-full rounded-xl border border-forest/15 px-3 py-2"
              />
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-medium text-heading">CVV</span>
              <input
                name="cvv"
                required
                inputMode="numeric"
                autoComplete="cc-csc"
                className="w-full rounded-xl border border-forest/15 px-3 py-2"
              />
            </label>
          </div>
        </>
      ) : (
        <label className="block space-y-2">
          <span className="text-sm font-medium text-heading">
            {t("mobileNumber")}
          </span>
          <input
            name="payerPhone"
            type="tel"
            required
            placeholder="0911 234 567"
            className="w-full rounded-xl border border-forest/15 px-3 py-2"
          />
        </label>
      )}

      {state?.error ? <p className="text-sm text-clay">{state.error}</p> : null}

      <p className="text-xs text-muted">
        {t("settlementNote")}
      </p>

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full bg-forest py-3 text-sm font-semibold text-on disabled:opacity-60"
      >
        {pending ? t("recordingPayment") : t("payAmount", { amount: formatETB(listing.currentBid, locale) })}
      </button>
    </form>
  );
}
