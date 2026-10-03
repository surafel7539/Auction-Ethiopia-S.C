import Link from "next/link";
import { ListingCard } from "@/components/ListingCard";
import { CATEGORY_META } from "@/lib/constants";
import { formatETB, parseImages } from "@/lib/format";
import {
  getCategories,
  getEndingSoonListings,
  getFeaturedListings,
} from "@/lib/listings";

export const dynamic = "force-dynamic";

const steps = [
  { n: "01", tone: "text-blue", title: "Register", body: "Open a buyer, seller, or combined account." },
  { n: "02", tone: "text-green", title: "Inspect", body: "Read the lot, reserve, and countdown." },
  { n: "03", tone: "text-orange", title: "Bid", body: "Two quiet hours after the last bid close the lot." },
  { n: "04", tone: "text-yellow", title: "Settle", body: "The highest bidder pays the house." },
];

export default async function HomePage() {
  const [featured, endingSoon, categories] = await Promise.all([
    getFeaturedListings(),
    getEndingSoonListings(),
    getCategories(),
  ]);
  const hero = featured[0];
  const heroImage = hero ? parseImages(hero.images)[0] : "";
  const lotCount = categories.reduce((sum, category) => sum + (category._count?.listings || 0), 0);

  return (
    <div className="mx-auto max-w-7xl px-4 pb-8 pt-6 sm:pt-8">
      <section className="grid overflow-hidden rounded-[2rem] bg-forest-deep text-paper shadow-[0_30px_80px_-40px_rgba(46,16,101,0.8)] lg:grid-cols-[1.05fr_0.95fr]">
        <div className="relative p-6 sm:p-10 lg:p-14">
          <p className="text-[11px] uppercase tracking-[0.28em] text-yellow">
            Licensed auction house · Addis Ababa
          </p>
          <h1 className="display mt-4 text-5xl leading-[0.92] text-paper sm:text-7xl">
            Bid in the open.
          </h1>
          <p className="mt-5 max-w-md text-base leading-7 text-paper/75 sm:text-lg">
            Vehicles, property, heritage, and commercial lots. Sellers consign.
            Buyers compete. The house records every bid.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/auctions" className="rounded-full bg-green px-6 py-3 text-sm font-semibold text-paper">
              Browse live lots
            </Link>
            <Link href="/sell" className="rounded-full bg-blue px-6 py-3 text-sm font-semibold text-paper">
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
          {heroImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={heroImage} alt="" className="absolute inset-0 h-full w-full object-cover" />
          ) : (
            <div className="absolute inset-0 bg-blue/30" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-forest-deep via-forest-deep/20 to-transparent lg:bg-gradient-to-l" />
          {hero ? (
            <Link
              href={`/auctions/${hero.id}`}
              className="absolute bottom-5 left-5 right-5 rounded-3xl border border-white/20 bg-paper/95 p-4 text-forest-deep shadow-xl sm:left-auto sm:w-80"
            >
              <p className="text-[11px] uppercase tracking-[0.18em] text-orange">Featured lot</p>
              <p className="display mt-1 text-2xl leading-tight">{hero.title}</p>
              <p className="mt-2 text-sm text-blue">{formatETB(hero.currentBid)}</p>
            </Link>
          ) : null}
        </div>
      </section>

      <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((step) => (
          <div key={step.n} className="panel rounded-3xl p-5">
            <p className={`text-xs font-semibold tracking-[0.2em] ${step.tone}`}>{step.n}</p>
            <h2 className="display mt-2 text-2xl text-forest-deep">{step.title}</h2>
            <p className="mt-2 text-sm leading-6 text-muted">{step.body}</p>
          </div>
        ))}
      </section>

      <section className="mt-14">
        <SectionHeading title="Shop by category" href="/categories" action="All categories" />
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((category) => {
            const meta = CATEGORY_META[category.slug] || {};
            return (
              <Link
                key={category.id}
                href={`/categories/${category.slug}`}
                className="panel group rounded-[1.6rem] p-5 transition hover:-translate-y-1"
              >
                <span
                  className="grid h-12 w-12 place-items-center rounded-2xl text-2xl"
                  style={{ background: `${meta.accent || "#6d28d9"}22` }}
                >
                  {meta.icon || "◆"}
                </span>
                <h2 className="display mt-4 text-2xl text-forest-deep">{category.name}</h2>
                <p className="mt-2 line-clamp-2 text-sm text-muted">{category.description}</p>
                <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-yellow">
                  {category._count.listings} lots
                </p>
              </Link>
            );
          })}
        </div>
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
      <p className="mt-1 text-xs uppercase tracking-wide text-paper/60">{label}</p>
    </div>
  );
}

function SectionHeading({ title, href, action }) {
  return (
    <div className="flex items-end justify-between gap-4">
      <h2 className="display section-title text-forest-deep">{title}</h2>
      <Link href={href} className="shrink-0 text-sm font-semibold text-orange">
        {action}
      </Link>
    </div>
  );
}
