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
    listing.computedStatus !== "SOLD" &&
    listing.computedStatus !== "CANCELLED" &&
    user?.id !== listing.sellerId &&
    (listing.computedStatus === "LIVE" ||
      (listing.computedStatus === "ENDED" &&
        highest?.bidder?.id === user?.id));

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:py-10">
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
            <h2 className="display section-title text-forest-deep">Lot notes</h2>
            <p className="whitespace-pre-wrap text-sm leading-7 text-muted sm:text-base sm:leading-8">
              {listing.description}
            </p>
          </div>
        </div>

        <aside className="space-y-5">
          <div className="card-shadow rounded-3xl border border-forest/10 bg-paper p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="rounded-full bg-forest px-3 py-1 text-xs uppercase tracking-wide text-gold-soft">
                {statusLabel(listing.computedStatus)}
              </span>
              {user ? (
                <WatchButton listingId={listing.id} watching={watching} />
              ) : null}
            </div>
            <h1 className="display section-title mt-4 text-forest-deep">
              {listing.title}
            </h1>
            <p className="mt-2 text-sm text-muted">
              {listing.condition} · {listing.location} · Consigned by{" "}
              {listing.seller.name}
            </p>

            <div className="mt-6 grid grid-cols-2 gap-4">
              <Stat label="Current bid" value={formatETB(listing.currentBid)} />
              <Stat
                label="Time remaining"
                value={<Countdown endsAt={listing.endsAt} />}
              />
              <Stat label="Bids" value={String(listing._count.bids)} />
              <Stat
                label="Increment"
                value={formatETB(listing.bidIncrement)}
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
              <p className="mt-4 rounded-xl bg-gold-soft/50 px-3 py-2 text-sm text-forest-deep">
                Payment recorded. This lot is now sold.
              </p>
            ) : null}

            {listing.computedStatus === "SOLD" ? (
              <p className="mt-4 rounded-xl bg-gold-soft/50 px-3 py-2 text-sm text-forest-deep">
                Sold
                {listing.buyer?.name ? ` to ${listing.buyer.name}` : ""} at{" "}
                {`${formatETB(listing.paidAmount || listing.currentBid)}.`}
              </p>
            ) : null}

            {winner ? (
              <p className="mt-4 rounded-xl bg-gold-soft/50 px-3 py-2 text-sm text-forest-deep">
                Hammered to {winner.name} at {formatETB(highest.amount)}.
              </p>
            ) : null}

            <p className="mt-4 text-xs text-muted">
              Closes {formatDate(listing.endsAt)}
            </p>
          </div>

          <BidPanel
            listing={listing}
            user={user}
            minimum={getNextMinBid(listing)}
          />

          {showBuy ? (
            <Link
              href={user ? `/auctions/${listing.id}/pay` : `/login?next=/auctions/${listing.id}/pay`}
              className="block rounded-2xl bg-forest px-5 py-4 text-center text-sm font-semibold text-paper"
            >
              {listing.computedStatus === "ENDED"
                ? `Pay ${formatETB(listing.currentBid)} to settle`
                : `Buy now for ${formatETB(listing.currentBid)}`}
            </Link>
          ) : null}

          <div className="rounded-3xl border border-forest/10 bg-paper p-6">
            <h2 className="display text-2xl text-forest-deep">Bid history</h2>
            {listing.bids.length ? (
              <ul className="mt-4 space-y-3">
                {listing.bids.map((bid) => (
                  <li
                    key={bid.id}
                    className="flex items-center justify-between text-sm"
                  >
                    <span>{bid.bidder.name}</span>
                    <span className="font-medium">
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
          <h2 className="display section-title text-forest-deep">
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

function Stat({ label, value }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-gold">{label}</p>
      <p className="mt-1 text-lg font-semibold text-ink">{value}</p>
    </div>
  );
}
