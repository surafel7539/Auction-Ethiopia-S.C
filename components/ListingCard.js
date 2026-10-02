import Link from "next/link";
import { formatETB, parseImages, statusLabel } from "@/lib/format";
import { Countdown } from "./Countdown";

export function ListingCard({ listing }) {
  const image = parseImages(listing.images)[0];
  const status = listing.computedStatus || listing.status;

  return (
    <article className="card-shadow group overflow-hidden rounded-2xl border border-forest/10 bg-paper">
      <Link href={`/auctions/${listing.id}`} className="block">
        <div className="relative aspect-[4/3] overflow-hidden bg-forest/10">
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={image}
              alt={listing.title}
              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="grid h-full place-items-center text-sm text-muted">
              No image yet
            </div>
          )}
          <span
            className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${
              status === "LIVE"
                ? "bg-forest text-gold-soft"
                : status === "ENDED"
                  ? "bg-ink/80 text-white"
                  : status === "SOLD"
                    ? "bg-gold text-ink"
                    : "bg-gold text-ink"
            }`}
          >
            {statusLabel(status)}
          </span>
        </div>
        <div className="space-y-3 p-4">
          <p className="text-[11px] uppercase tracking-[0.18em] text-gold">
            {listing.category?.name} · {listing.location}
          </p>
          <h3 className="display text-lg leading-snug text-forest-deep sm:text-xl">
            {listing.title}
          </h3>
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-xs text-muted">Current bid</p>
              <p className="text-lg font-semibold text-ink">
                {formatETB(listing.currentBid)}
              </p>
            </div>
            <div className="text-right text-sm text-muted">
              <p>{listing._count?.bids || 0} bids</p>
              <Countdown endsAt={listing.endsAt} className="font-medium text-clay" />
            </div>
          </div>
        </div>
      </Link>
    </article>
  );
}
