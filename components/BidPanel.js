"use client";

import { useActionState } from "react";
import { placeBidAction } from "@/app/actions/bids";
import { formatDate, formatETB } from "@/lib/format";
import { useI18n } from "@/components/LocaleProvider";

export function BidPanel({ listing, user, minimum }) {
  const { locale, t } = useI18n();
  const [state, action, pending] = useActionState(placeBidAction, {});

  if (listing.computedStatus === "SCHEDULED") {
    return (
      <div className="panel rounded-[1.6rem] p-5 text-sm text-muted">
        {t("biddingOpensPanel", { date: formatDate(listing.startsAt, locale) })}
      </div>
    );
  }

  if (!user) {
    return (
      <div className="panel rounded-[1.6rem] p-5">
        <p className="display text-2xl text-heading">{t("registeredBidding")}</p>
        <p className="mt-2 text-sm leading-6 text-muted">
          {t("signInToBidBody")}
        </p>
        <a
          href={`/login?next=/auctions/${listing.id}`}
          className="mt-4 inline-block rounded-full bg-forest px-5 py-2.5 text-sm font-semibold text-on"
        >
          {t("signInToBid")}
        </a>
      </div>
    );
  }

  if (user.id === listing.sellerId) {
    return (
      <div className="panel rounded-[1.6rem] p-5 text-sm text-muted">
        {t("cannotBidOwn")}
      </div>
    );
  }

  if (listing.computedStatus === "SOLD") {
    return (
      <div className="rounded-[1.6rem] border border-orange/25 bg-paper p-5 text-sm text-heading">
        {listing.buyer?.name ? t("soldToName", { name: listing.buyer.name }) : t("soldNoName")}
      </div>
    );
  }

  if (listing.computedStatus !== "LIVE") {
    return (
      <div className="panel rounded-[1.6rem] p-5 text-sm text-muted">
        {t("biddingClosed")}
      </div>
    );
  }

  return (
    <form action={action} className="panel rounded-[1.6rem] p-5">
      <input type="hidden" name="listingId" value={listing.id} />
      <p className="text-xs uppercase tracking-[0.18em] text-yellow">{t("placeBid")}</p>
      <p className="mt-2 text-sm text-muted">
        {t("minimumNext")} <strong className="text-blue">{formatETB(minimum, locale)}</strong>
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
          {pending ? t("bidding") : t("bid")}
        </button>
      </div>
      {state?.error ? <p className="mt-3 text-sm text-orange">{state.error}</p> : null}
      {state?.ok ? <p className="mt-3 text-sm text-green">{t("bidPlaced")}</p> : null}
    </form>
  );
}
