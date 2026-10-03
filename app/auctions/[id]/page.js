import Link from "next/link";
import { notFound } from "next/navigation";
import { BidPanel } from "@/components/BidPanel";
import { Countdown } from "@/components/Countdown";
import { ListingCard } from "@/components/ListingCard";
import { ListingGallery } from "@/components/ListingGallery";
import { WatchButton } from "@/components/WatchButton";
import { getCurrentUser } from "@/lib/auth";
import {
  formatDate,
  formatETB,
  effectiveEndsAt,
  getNextMinBid,
  parseImages,
  statusLabel,
} from "@/lib/format";
import {
  getHighestBid,
  getListingById,
  getListings,
  isWatching,
} from "@/lib/listings";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const { id } = await params;
  const listing = await getListingById(id);
  return {
    title: listing?.title || "Lot",
  };
}

export default async function ListingPage({ params, searchParams }) {
  const { id } = await params;
  const query = await searchParams;
  const listing = await getListingById(id);
  if (!listing) notFound();

  const user = await getCurrentUser();
  const images = parseImages(listing.images);
  const highest = await getHighestBid(listing.id);
  const related = (
    await getListings({
      categorySlug: listing.category.slug,
      status: "live",
    })
  )
    .filter((item) => item.id !== listing.id)
    .slice(0, 3);

  const watching = user ? await isWatching(user.id, listing.id) : false;

  const winner =
    listing.computedStatus === "ENDED" && highest ? highest.bidder : null;
  const showBuy =
    listing.computedStatus === "ENDED" &&
    user?.id !== listing.sellerId &&
    highest?.bidder?.id === user?.id;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:py-12">
      <p className="text-sm text-muted">
        <Link href="/auctions" className="hover:text-forest">
          Auctions
        </Link>
        {" / "}
        <Link
          href={`/categories/${listing.category.slug}`}
          className="hover:text-forest"
        >
          {listing.category.name}
        </Link>
      </p>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:gap-10">
        <div>
          <ListingGallery images={images} title={listing.title} />

          <div className="mt-8 space-y-4">
            <h2 className="display section-title text-heading">Lot notes</h2>
            <p className="whitespace-pre-wrap text-sm leading-7 text-muted sm:text-base sm:leading-8">
              {listing.description}
            </p>
          </div>
        </div>

        <aside className="space-y-5 lg:sticky lg:top-28 lg:self-start">
          <div className="panel rounded-[1.8rem] p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span
                className={`rounded-full px-3 py-1 text-xs uppercase tracking-wide ${
                  listing.computedStatus === "LIVE"
                    ? "bg-green text-on"
                    : listing.computedStatus === "SOLD"
                      ? "bg-yellow text-forest-deep"
                      : listing.computedStatus === "ENDED"
                        ? "bg-forest-deep text-on"
                        : "bg-forest text-on"
                }`}
              >
                {statusLabel(listing.computedStatus)}
              </span>
              {user ? (
                <WatchButton listingId={listing.id} watching={watching} />
              ) : null}
            </div>
            <h1 className="display section-title mt-4 text-heading">
              {listing.title}
            </h1>
            <p className="mt-2 text-sm text-muted">
              {listing.condition} · {listing.location} · Consigned by{" "}
              {listing.seller.name}
            </p>

            <div className="mt-6 grid grid-cols-2 gap-4">
              <Stat
                label="Current bid"
                value={formatETB(listing.currentBid)}
                tone="text-blue"
              />
              <Stat
                label={listing.computedStatus === "SCHEDULED" ? "Opens" : "Time remaining"}
                value={
                  listing.computedStatus === "SCHEDULED" ? (
                    formatDate(listing.startsAt)
                  ) : (
                    <Countdown
                      endsAt={effectiveEndsAt(listing)}
                      className="text-orange"
                    />
                  )
                }
                tone="text-orange"
              />
              <Stat label="Bids" value={String(listing._count.bids)} />
              <Stat
                label="Increment"
                value={formatETB(listing.bidIncrement)}
                tone="text-green"
              />
            </div>

            {listing.reservePrice ? (
              <p className="mt-4 text-sm text-muted">
                Reserve:{" "}
                {listing.currentBid >= listing.reservePrice
                  ? "met"
                  : "not yet met"}
              </p>
            ) : (
              <p className="mt-4 text-sm text-muted">No reserve</p>
            )}

            {query?.paid === "1" ? (
              <p className="mt-4 rounded-xl bg-gold-soft/50 px-3 py-2 text-sm text-heading">
                Payment recorded. This lot is now sold.
              </p>
            ) : null}

            {listing.computedStatus === "SOLD" ? (
              <p className="mt-4 rounded-xl bg-gold-soft/50 px-3 py-2 text-sm text-heading">
                Sold
                {listing.buyer?.name ? ` to ${listing.buyer.name}` : ""} at{" "}
                {`${formatETB(listing.paidAmount || listing.currentBid)}.`}
              </p>
            ) : null}

            {winner ? (
              <p className="mt-4 rounded-xl bg-gold-soft/50 px-3 py-2 text-sm text-heading">
                Hammered to {winner.name} at {formatETB(highest.amount)}.
              </p>
            ) : null}

            <p className="mt-4 text-xs text-muted">
              {listing.computedStatus === "SCHEDULED"
                ? `Bidding opens ${formatDate(listing.startsAt)}. `
                : ""}
              Closes {formatDate(effectiveEndsAt(listing))}
              {listing.bidCount
                ? ". A new bid resets a 2-hour window; if nobody bids, the last bid wins."
                : "."}
            </p>
          </div>

          <BidPanel
            listing={listing}
            user={user}
            minimum={getNextMinBid(listing)}
          />

          {showBuy ? (
            <div className="rounded-2xl border border-orange/30 bg-paper p-4">
              <p className="text-sm text-heading">
                You won this lot. Pay the house to settle the hammer price.
              </p>
              <Link
                href={`/auctions/${listing.id}/pay`}
                className="mt-3 block rounded-2xl bg-orange px-5 py-4 text-center text-sm font-semibold text-on"
              >
                Pay {formatETB(listing.currentBid)} to settle
              </Link>
            </div>
          ) : null}

          <div className="panel rounded-[1.8rem] p-6">
            <h2 className="display text-2xl text-heading">Bid history</h2>
            {listing.bids.length ? (
              <ul className="mt-4 space-y-3">
                {listing.bids.map((bid) => (
                  <li
                    key={bid.id}
                    className="flex items-center justify-between text-sm"
                  >
                    <span>{bid.bidder.name}</span>
                    <span className="font-medium text-blue">
                      {formatETB(bid.amount)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-muted">
                No bids yet. Be the first.
              </p>
            )}
          </div>
        </aside>
      </div>

      {related.length ? (
        <section className="mt-16">
          <h2 className="display section-title text-heading">
            More in {listing.category.name}
          </h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 md:grid-cols-3">
            {related.map((item) => (
              <ListingCard key={item.id} listing={item} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function Stat({ label, value, tone = "text-ink" }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-yellow">{label}</p>
      <p className={`mt-1 text-lg font-semibold ${tone}`}>{value}</p>
    </div>
  );
}
