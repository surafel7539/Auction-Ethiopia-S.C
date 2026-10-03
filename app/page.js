import Link from "next/link";
import { HeroSlideshow } from "@/components/HeroSlideshow";
import { ListingCard } from "@/components/ListingCard";
import { formatDate, formatETB, parseImages } from "@/lib/format";
import {
  getCategories,
  getEndingSoonListings,
  getFeaturedListings,
  getScheduledListings,
} from "@/lib/listings";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [featured, endingSoon, scheduled, categories] = await Promise.all([
    getFeaturedListings(),
    getEndingSoonListings(),
    getScheduledListings(),
    getCategories(),
  ]);
  const slides = featured.flatMap((listing) => {
    const image = parseImages(listing.images)[0];
    if (!image) return [];
    return [{ id: listing.id, title: listing.title, price: formatETB(listing.currentBid), image }];
  });
  const lotCount = categories.reduce((sum, category) => sum + (category._count?.listings || 0), 0);

  return (
    <div className="mx-auto max-w-7xl px-4 pb-8 pt-6 sm:pt-8">
      <section className="grid overflow-hidden rounded-[2rem] bg-forest-deep text-on shadow-[0_30px_80px_-40px_rgba(46,16,101,0.8)] lg:grid-cols-[1.05fr_0.95fr]">
        <div className="relative p-6 sm:p-10 lg:p-14">
          <p className="text-[11px] uppercase tracking-[0.28em] text-yellow">
            Licensed auction house · Addis Ababa
          </p>
          <h1 className="display mt-4 text-5xl leading-[0.92] text-on sm:text-7xl">
            Bid in the open.
          </h1>
          <p className="mt-5 max-w-md text-base leading-7 text-on/75 sm:text-lg">
            Vehicles, property, heritage, and commercial lots. Sellers consign.
            Buyers compete. The house records every bid.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/auctions" className="rounded-full bg-green px-6 py-3 text-sm font-semibold text-on">
              Browse live lots
            </Link>
            <Link href="/sell" className="rounded-full bg-blue px-6 py-3 text-sm font-semibold text-on">
              Consign a lot
            </Link>
          </div>
          <div className="mt-10 grid grid-cols-3 gap-3 border-t border-white/10 pt-6">
            <Stat value={String(lotCount)} label="Lots" />
            <Stat value={String(categories.length)} label="Departments" />
            <Stat value="2h" label="Quiet close" />
          </div>
        </div>
        <div className="relative min-h-80">
          <HeroSlideshow slides={slides} />
        </div>
      </section>

      <section className="mt-8">
        <h2 className="display section-title text-heading">To be auctioned</h2>
        <p className="mt-2 text-sm text-muted">Lots that open for bidding on a set date.</p>
        {scheduled.length ? (
          <div className="mt-5 flex gap-4 overflow-x-auto pb-3 snap-x snap-mandatory">
            {scheduled.map((listing) => {
              const image = parseImages(listing.images)[0];
              return (
                <Link
                  key={listing.id}
                  href={`/auctions/${listing.id}`}
                  className="panel w-72 shrink-0 snap-start overflow-hidden rounded-[1.4rem]"
                >
                  <div className="relative h-40 bg-forest/10">
                    {image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={image} alt="" className="h-full w-full object-cover" />
                    ) : null}
                    <span className="absolute left-3 top-3 rounded-full bg-blue px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-on">
                      Upcoming
                    </span>
                  </div>
                  <div className="space-y-2 p-4">
                    <p className="text-[11px] uppercase tracking-[0.16em] text-yellow">
                      {listing.category?.name} · {listing.location}
                    </p>
                    <h3 className="display text-xl leading-snug text-heading">{listing.title}</h3>
                    <p className="text-sm text-orange">Opens {formatDate(listing.startsAt)}</p>
                    <p className="text-sm font-semibold text-blue">{formatETB(listing.startingBid)}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <p className="panel mt-5 rounded-3xl p-6 text-sm text-muted">
            No lots are scheduled yet.
          </p>
        )}
      </section>

      <section className="mt-14">
        <SectionHeading title="Featured lots" href="/auctions?sort=price_desc" action="See all" />
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      </section>

      <section className="mt-14">
        <SectionHeading title="Ending soon" href="/auctions?status=ending" action="Closing lots" />
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {endingSoon.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      </section>
    </div>
  );
}

function Stat({ value, label }) {
  return (
    <div>
      <p className="display text-3xl text-lime">{value}</p>
      <p className="mt-1 text-xs uppercase tracking-wide text-on/60">{label}</p>
    </div>
  );
}

function SectionHeading({ title, href, action }) {
  return (
    <div className="flex items-end justify-between gap-4">
      <h2 className="display section-title text-heading">{title}</h2>
      <Link href={href} className="shrink-0 text-sm font-semibold text-orange">
        {action}
      </Link>
    </div>
  );
}
