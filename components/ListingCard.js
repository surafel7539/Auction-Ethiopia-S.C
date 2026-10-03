import Link from "next/link";
import { effectiveEndsAt, formatETB, parseImages, statusLabel } from "@/lib/format";
import { getLocale } from "@/lib/locale";
import { categoryName, cityName, translate } from "@/lib/messages";
import { Countdown } from "./Countdown";

export async function ListingCard({ listing }) {
  const locale = await getLocale();
  const t = (key, vars) => translate(locale, key, vars);
  const image = parseImages(listing.images)[0];
  const status = listing.computedStatus || listing.status;

  return (
    <article className="group overflow-hidden rounded-[1.6rem] border border-forest/10 bg-paper shadow-[0_20px_40px_-28px_rgba(46,16,101,0.55)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_28px_50px_-24px_rgba(46,16,101,0.6)]">
      <Link href={`/auctions/${listing.id}`} className="block">
        <div className="relative aspect-[5/4] overflow-hidden bg-forest/10">
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={image}
              alt={listing.title}
              className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
            />
          ) : (
            <div className="grid h-full place-items-center text-sm text-muted">
              {t("noImage")}
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-forest-deep via-forest-deep/75 to-transparent" />
          <span
            className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${
              status === "LIVE"
                ? "bg-green text-on"
                : status === "ENDED"
                  ? "bg-forest-deep/90 text-on"
                  : status === "SOLD"
                    ? "bg-yellow text-forest-deep"
                    : "bg-orange text-on"
            }`}
          >
            {statusLabel(status, locale)}
          </span>
          <p className="absolute bottom-3 left-3 right-3 text-[11px] uppercase tracking-[0.16em] text-yellow">
            {categoryName(locale, listing.category)} · {cityName(locale, listing.location)}
          </p>
        </div>
        <div className="space-y-4 p-4 sm:p-5">
          <h3 className="display text-xl leading-snug text-heading">
            {listing.title}
          </h3>
          <div className="flex items-end justify-between gap-3 border-t border-forest/10 pt-3">
            <div>
              <p className="text-[11px] uppercase tracking-wide text-muted">{t("currentBid")}</p>
              <p className="text-lg font-semibold text-blue">
                {formatETB(listing.currentBid, locale)}
              </p>
            </div>
            <div className="text-right text-sm">
              <p className="text-muted">{t("bidsCount", { count: listing._count?.bids || 0 })}</p>
              <Countdown endsAt={effectiveEndsAt(listing)} className="font-semibold text-orange" />
            </div>
          </div>
        </div>
      </Link>
    </article>
  );
}
