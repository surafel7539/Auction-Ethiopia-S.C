import Link from "next/link";
import { cancelListingAction } from "@/app/actions/listings";
import { ListingCard } from "@/components/ListingCard";
import { requireUser, isAdmin } from "@/lib/auth";
import { redirect } from "next/navigation";
import { formatETB, getAuctionStatus, statusLabel } from "@/lib/format";
import { getLocale } from "@/lib/locale";
import { getDashboardData } from "@/lib/listings";
import { translate } from "@/lib/messages";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const locale = await getLocale();
  return { title: translate(locale, "clientDesk") };
}

export default async function DashboardPage() {
  const locale = await getLocale();
  const t = (key, vars) => translate(locale, key, vars);
  const user = await requireUser("/login");
  if (isAdmin(user)) {
    redirect("/admin");
  }
  const { listings, bids, watches } = await getDashboardData(user.id);

  const uniqueBids = [];
  const seen = new Set();
  for (const bid of bids) {
    if (seen.has(bid.listingId)) continue;
    seen.add(bid.listingId);
    uniqueBids.push(bid);
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:py-12">
      <p className="text-xs uppercase tracking-[0.22em] text-gold">
        {t("clientDesk")}
      </p>
      <h1 className="display page-title mt-2 text-heading">
        {t("welcome", {
          name: (user.accountKind === "ORGANISATION" && user.contactName
            ? user.contactName
            : user.legalName
          ).split(" ")[0],
        })}
      </h1>
      <p className="mt-3 text-muted">
        {t("accountLine", {
          licence: user.licenceNumber,
          phone: user.phone,
          role: t(user.role === "SELLER" ? "roleSeller" : user.role === "BOTH" ? "roleBoth" : "roleBuyer"),
        })}
      </p>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/sell"
          className="rounded-full bg-forest px-5 py-2 text-sm text-on"
        >
          {t("createListing")}
        </Link>
        <Link
          href="/auctions"
          className="rounded-full border border-forest/20 px-5 py-2 text-sm text-forest"
        >
          {t("browseAuctions")}
        </Link>
      </div>

      <section className="mt-12">
        <h2 className="display section-title text-heading">{t("myListings")}</h2>
        {listings.length ? (
          <div className="panel mt-5 overflow-x-auto rounded-[1.6rem]">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead className="bg-forest text-on">
                <tr>
                  <th className="px-4 py-3">{t("lot")}</th>
                  <th className="px-4 py-3">{t("bidColumn")}</th>
                  <th className="px-4 py-3">{t("status")}</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {listings.map((listing) => {
                  const status = getAuctionStatus(listing);
                  return (
                    <tr key={listing.id} className="border-t border-forest/10">
                      <td className="px-4 py-3">
                        <Link
                          href={`/auctions/${listing.id}`}
                          className="font-medium text-heading"
                        >
                          {listing.title}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        {formatETB(listing.currentBid, locale)} · {t("bidsCount", { count: listing._count.bids })}
                      </td>
                      <td className="px-4 py-3">{statusLabel(status, locale)}</td>
                      <td className="px-4 py-3 text-right">
                        {status === "LIVE" && listing._count.bids === 0 ? (
                          <form action={cancelListingAction.bind(null, listing.id)}>
                            <button className="text-clay">{t("cancel")}</button>
                          </form>
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-4 text-sm text-muted">
            {t("noConsignments")}
          </p>
        )}
      </section>

      <section className="mt-12">
        <h2 className="display section-title text-heading">{t("myBids")}</h2>
        {uniqueBids.length ? (
          <div className="mt-5 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {uniqueBids.map((bid) => (
              <div key={bid.id}>
                <ListingCard listing={bid.listing} />
                <p className="mt-2 text-sm text-muted">
                  {t("yourLatest", { amount: formatETB(bid.amount, locale) })}
                  {bid.listing.computedStatus === "SOLD"
                    ? ` · ${t("soldTag")}`
                    : bid.amount >= bid.listing.currentBid
                      ? ` · ${t("leading")}`
                      : ` · ${t("outbid")}`}
                </p>
                {bid.listing.computedStatus === "ENDED" &&
                bid.amount >= bid.listing.currentBid ? (
                  <Link
                    href={`/auctions/${bid.listing.id}/pay`}
                    className="mt-2 inline-block text-sm font-medium text-forest"
                  >
                    {t("payNow")}
                  </Link>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm text-muted">
            {t("noBidsPlaced")}
          </p>
        )}
      </section>

      <section className="mt-12">
        <h2 className="display section-title text-heading">{t("watchlist")}</h2>
        {watches.length ? (
          <div className="mt-5 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {watches.map((watch) => (
              <ListingCard key={watch.id} listing={watch.listing} />
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm text-muted">
            {t("watchHint")}
          </p>
        )}
      </section>
    </div>
  );
}
