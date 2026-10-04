import Link from "next/link";
import { HeroSlideshow } from "@/components/HeroSlideshow";
import { ListingCard } from "@/components/ListingCard";
import { formatDate, formatETB, parseImages } from "@/lib/format";
import { getLocale } from "@/lib/locale";
import {
  getCategories,
  getEndingSoonListings,
  getFeaturedListings,
  getScheduledListings,
} from "@/lib/listings";
import { categoryName, cityName, translate } from "@/lib/messages";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const locale = await getLocale();
  const t = (key, vars) => translate(locale, key, vars);
  const [featured, endingSoon, scheduled, categories] = await Promise.all([
    getFeaturedListings(),
    getEndingSoonListings(),
    getScheduledListings(),
    getCategories(),
  ]);
  const slides = featured.flatMap((listing) => {
    const image = parseImages(listing.images)[0];
    if (!image) return [];
    return [{ id: listing.id, title: listing.title, price: formatETB(listing.currentBid, locale), image }];
  });
  const lotCount = categories.reduce((sum, category) => sum + (category._count?.listings || 0), 0);

  return (
    <div className="mx-auto max-w-7xl px-4 pb-8 pt-6 sm:pt-8">
      <section className="grid overflow-hidden rounded-[2rem] bg-forest-deep text-on shadow-[0_30px_80px_-40px_rgba(46,16,101,0.8)] lg:grid-cols-[1.05fr_0.95fr]">
        <div className="relative p-6 sm:p-10 lg:p-14">
          <p className="text-[11px] uppercase tracking-[0.28em] text-yellow">
            {t("heroKicker")}
          </p>
          <h1 className="display mt-4 text-5xl leading-[0.92] text-on sm:text-7xl">
            {t("heroTitle")}
          </h1>
          <p className="mt-5 max-w-md text-base leading-7 text-on/75 sm:text-lg">
            {t("heroBody")}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/auctions" className="rounded-full bg-green px-6 py-3 text-sm font-semibold text-on">
              {t("browseLive")}
            </Link>
            <Link href="/sell" className="rounded-full bg-blue px-6 py-3 text-sm font-semibold text-on">
              {t("consignLot")}
            </Link>
          </div>
          <div className="mt-10 grid grid-cols-2 gap-3 border-t border-white/10 pt-6">
            <Stat value={String(lotCount)} label={t("lots")} />
            <Stat value={String(categories.length)} label={t("departments")} />
          </div>
        </div>
        <div className="relative min-h-80">
          <HeroSlideshow slides={slides} />
        </div>
      </section>

      <section className="mt-8">
        <h2 className="display section-title text-heading">{t("toBeAuctioned")}</h2>
        <p className="mt-2 text-sm text-muted">{t("toBeAuctionedBody")}</p>
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
                      {t("upcoming")}
                    </span>
                  </div>
                  <div className="space-y-2 p-4">
                    <p className="text-[11px] uppercase tracking-[0.16em] text-yellow">
                      {categoryName(locale, listing.category)} · {cityName(locale, listing.location)}
                    </p>
                    <h3 className="display text-xl leading-snug text-heading">{listing.title}</h3>
                    <p className="text-sm text-orange">{t("opensOn", { date: formatDate(listing.startsAt, locale) })}</p>
                    <p className="text-sm font-semibold text-blue">{formatETB(listing.startingBid, locale)}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <p className="panel mt-5 rounded-3xl p-6 text-sm text-muted">
            {t("noneScheduled")}
          </p>
        )}
      </section>

      <section className="mt-14">
        <SectionHeading title={t("featuredLots")} href="/auctions?sort=price_desc" action={t("seeAll")} />
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      </section>

      <section className="mt-14">
        <SectionHeading title={t("endingSoon")} href="/auctions?status=ending" action={t("closingLots")} />
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
