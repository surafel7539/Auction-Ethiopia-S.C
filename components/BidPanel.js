"use client";

import { useActionState } from "react";
import { placeBidAction } from "@/app/actions/bids";
import { formatETB } from "@/lib/format";

export function BidPanel({ listing, user, minimum }) {
  const [state, action, pending] = useActionState(placeBidAction, {});

  if (!user) {
    return (
      <div className="rounded-2xl border border-forest/15 bg-paper p-5">
        <p className="display text-2xl text-forest-deep">Registered bidding</p>
        <p className="mt-2 text-sm text-muted">
          Sign in to place a bid on this lot. Buyers remain bound by the
          conditions of sale once a bid is accepted.
        </p>
        <a
          href={`/login?next=/auctions/${listing.id}`}
          className="mt-4 inline-block rounded-full bg-forest px-5 py-2 text-sm text-paper"
        >
          Sign in to bid
        </a>
      </div>
    );
  }

  if (user.id === listing.sellerId) {
    return (
      <div className="rounded-2xl border border-forest/15 bg-paper p-5 text-sm text-muted">
        You are the consignor of this lot and cannot bid on it.
      </div>
    );
  }

  if (listing.computedStatus === "SOLD") {
    return (
      <div className="rounded-2xl border border-orange/25 bg-paper p-5 text-sm text-forest-deep">
        This lot has been sold
        {listing.buyer?.name ? ` to ${listing.buyer.name}` : ""}.
      </div>
    );
  }

  if (listing.computedStatus !== "LIVE") {
    return (
      <div className="rounded-2xl border border-forest/15 bg-paper p-5 text-sm text-muted">
        Bidding is closed on this lot.
      </div>
    );
  }

  return (
    <form
      action={action}
      className="rounded-2xl border border-forest/15 bg-paper p-5"
    >
      <input type="hidden" name="listingId" value={listing.id} />
      <p className="text-xs uppercase tracking-[0.18em] text-gold">
        Place a bid
      </p>
      <p className="mt-2 text-sm text-muted">
        Minimum next bid: <strong>{formatETB(minimum)}</strong>
      </p>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <input
          type="number"
          name="amount"
          min={minimum}
          step="1"
          defaultValue={minimum}
          required
          className="w-full rounded-xl border border-forest/15 px-3 py-2"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-clay px-5 py-2 text-sm font-semibold text-white disabled:opacity-60 sm:shrink-0"
        >
          {pending ? "Bidding..." : "Bid"}
        </button>
      </div>
      {state?.error ? (
        <p className="mt-3 text-sm text-clay">{state.error}</p>
      ) : null}
      {state?.ok ? (
        <p className="mt-3 text-sm text-green">Your bid has been placed.</p>
      ) : null}
    </form>
  );
}
