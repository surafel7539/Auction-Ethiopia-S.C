"use client";

import { useActionState } from "react";
import { placeBidAction } from "@/app/actions/bids";
import { formatDate, formatETB } from "@/lib/format";

export function BidPanel({ listing, user, minimum }) {
  const [state, action, pending] = useActionState(placeBidAction, {});

  if (listing.computedStatus === "SCHEDULED") {
    return (
      <div className="panel rounded-[1.6rem] p-5 text-sm text-muted">
        Bidding opens {formatDate(listing.startsAt)}.
      </div>
    );
  }

  if (!user) {
    return (
      <div className="panel rounded-[1.6rem] p-5">
        <p className="display text-2xl text-heading">Registered bidding</p>
        <p className="mt-2 text-sm leading-6 text-muted">
          Sign in to place a bid on this lot. Buyers remain bound by the
          conditions of sale once a bid is accepted.
        </p>
        <a
          href={`/login?next=/auctions/${listing.id}`}
          className="mt-4 inline-block rounded-full bg-forest px-5 py-2.5 text-sm font-semibold text-on"
        >
          Sign in to bid
        </a>
      </div>
    );
  }

  if (user.id === listing.sellerId) {
    return (
      <div className="panel rounded-[1.6rem] p-5 text-sm text-muted">
        You are the consignor of this lot and cannot bid on it.
      </div>
    );
  }

  if (listing.computedStatus === "SOLD") {
    return (
      <div className="rounded-[1.6rem] border border-orange/25 bg-paper p-5 text-sm text-heading">
        This lot has been sold
        {listing.buyer?.name ? ` to ${listing.buyer.name}` : ""}.
      </div>
    );
  }

  if (listing.computedStatus !== "LIVE") {
    return (
      <div className="panel rounded-[1.6rem] p-5 text-sm text-muted">
        Bidding is closed on this lot.
      </div>
    );
  }

  return (
    <form action={action} className="panel rounded-[1.6rem] p-5">
      <input type="hidden" name="listingId" value={listing.id} />
      <p className="text-xs uppercase tracking-[0.18em] text-yellow">Place a bid</p>
      <p className="mt-2 text-sm text-muted">
        Minimum next bid: <strong className="text-blue">{formatETB(minimum)}</strong>
      </p>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <input
          type="number"
          name="amount"
          min={minimum}
          step="1"
          defaultValue={minimum}
          required
          className="w-full rounded-2xl border border-forest/15 px-3 py-2.5"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-2xl bg-orange px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60 sm:shrink-0"
        >
          {pending ? "Bidding..." : "Bid"}
        </button>
      </div>
      {state?.error ? <p className="mt-3 text-sm text-orange">{state.error}</p> : null}
      {state?.ok ? <p className="mt-3 text-sm text-green">Your bid has been placed.</p> : null}
    </form>
  );
}
