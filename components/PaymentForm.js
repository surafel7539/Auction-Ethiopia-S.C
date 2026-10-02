"use client";

import { useActionState, useState } from "react";
import { payListingAction } from "@/app/actions/payments";
import { formatETB } from "@/lib/format";

const METHODS = [
  { id: "TELEBIRR", label: "Telebirr" },
  { id: "CBE_BIRR", label: "CBE Birr" },
  { id: "CARD", label: "Visa / Mastercard" },
];

export function PaymentForm({ listing, defaultName = "" }) {
  const [method, setMethod] = useState("TELEBIRR");
  const [state, action, pending] = useActionState(payListingAction, {});

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="listingId" value={listing.id} />
      <input type="hidden" name="method" value={method} />

      <div>
        <p className="text-xs uppercase tracking-[0.18em] text-gold">
          Amount due
        </p>
        <p className="display mt-1 text-3xl text-forest-deep">
          {formatETB(listing.currentBid)}
        </p>
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-forest-deep">
          Payment method
        </legend>
        <div className="grid gap-2 sm:grid-cols-3">
          {METHODS.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setMethod(option.id)}
              className={`rounded-xl border px-3 py-2 text-sm ${
                method === option.id
                  ? "border-gold bg-gold-soft/50 text-forest-deep"
                  : "border-forest/15 bg-white text-forest"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </fieldset>

      <label className="block space-y-2">
        <span className="text-sm font-medium text-forest-deep">
          Account / card name
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
            <span className="text-sm font-medium text-forest-deep">
              Card number
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
              <span className="text-sm font-medium text-forest-deep">
                Expiry (MM/YY)
              </span>
              <input
                name="expiry"
                required
                placeholder="08/28"
                className="w-full rounded-xl border border-forest/15 px-3 py-2"
              />
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-medium text-forest-deep">CVV</span>
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
          <span className="text-sm font-medium text-forest-deep">
            Mobile number
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
        Settlement is recorded by Auction Ethiopia S.C. Use demo details here;
        no live bank charge is sent.
      </p>

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full bg-forest py-3 text-sm font-semibold text-paper disabled:opacity-60"
      >
        {pending ? "Recording payment..." : `Pay ${formatETB(listing.currentBid)}`}
      </button>
    </form>
  );
}
