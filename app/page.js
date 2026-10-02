import Link from "next/link";
import { ListingCard } from "@/components/ListingCard";
import { CATEGORY_META } from "@/lib/constants";
import {
  getCategories,
  getEndingSoonListings,
  getFeaturedListings,
} from "@/lib/listings";

export default async function HomePage() {
  const [featured, endingSoon, categories] = await Promise.all([
    getFeaturedListings(),
    getEndingSoonListings(),
    getCategories(),
  ]);

  return (
    <div>
      <section className="mx-auto grid max-w-6xl items-center gap-8 px-4 py-10 sm:py-14 md:grid-cols-2 md:gap-10 md:py-16">
        <div>
          <p className="text-[11px] uppercase tracking-[0.22em] text-gold sm:text-xs sm:tracking-[0.28em]">
            Licensed auction house · Addis Ababa
          </p>
          <h1 className="display page-title mt-3 text-forest-deep sm:mt-4">
            Auction Ethiopia S.C
          </h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-muted sm:mt-5 sm:text-lg sm:leading-8">
            Bid on vehicles, property, heritage lots, and commercial assets
            through a transparent, timed auction. Sellers consign. Buyers
            compete. The house records every bid.
          </p>
          <div className="mt-6 flex flex-wrap gap-3 sm:mt-8">
            <Link
              href="/auctions"
              className="rounded-full bg-forest px-5 py-3 text-sm font-semibold text-paper sm:px-6"
            >
              Browse live lots
            </Link>
            <Link
              href="/sell"
              className="rounded-full border border-forest/20 px-5 py-3 text-sm font-semibold text-forest sm:px-6"
            >
              Consign a lot
            </Link>
          </div>
        </div>
        <div className="card-shadow rounded-3xl border border-forest/10 bg-paper p-5 sm:p-8">
          <p className="display text-3xl text-forest-deep">How a sale works</p>
          <ol className="mt-6 space-y-4 text-sm leading-7 text-muted">
            <li>
              <strong className="text-ink">1. Register</strong> as a buyer,
              seller, or both.
            </li>
            <li>
              <strong className="text-ink">2. Inspect</strong> the lot details,
              reserve, and countdown.
            </li>
            <li>
              <strong className="text-ink">3. Bid</strong> at or above the
              increment until the clock ends.
            </li>
            <li>
              <strong className="text-ink">4. Settle</strong> if you are the
              highest bidder when the hammer falls.
            </li>
          </ol>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4">
        <SectionHeading
          title="Shop by category"
          href="/categories"
          action="All categories"
        />
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((category) => {
            const meta = CATEGORY_META[category.slug] || {};
            return (
              <Link
                key={category.id}
                href={`/categories/${category.slug}`}
                className="card-shadow rounded-2xl border border-forest/10 bg-paper p-5 transition hover:-translate-y-0.5"
              >
                <span className="text-2xl">{meta.icon || "◆"}</span>
                <h2 className="display mt-3 text-2xl text-forest-deep">
                  {category.name}
                </h2>
                <p className="mt-2 line-clamp-2 text-sm text-muted">
                  {category.description}
                </p>
                <p className="mt-4 text-xs uppercase tracking-wide text-gold">
                  {category._count.listings} lots
                </p>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="mx-auto mt-10 max-w-6xl px-4 sm:mt-16">
        <SectionHeading
          title="Featured lots"
          href="/auctions?sort=price_desc"
          action="See all"
        />
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      </section>

      <section className="mx-auto mt-10 max-w-6xl px-4 pb-8 sm:mt-16">
        <SectionHeading
          title="Ending soon"
          href="/auctions?status=ending"
          action="Closing lots"
        />
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {endingSoon.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      </section>
    </div>
  );
}

function SectionHeading({ title, href, action }) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
      <h2 className="display section-title text-forest-deep">{title}</h2>
      <Link href={href} className="shrink-0 text-sm font-medium text-forest">
        {action}
      </Link>
    </div>
  );
}
