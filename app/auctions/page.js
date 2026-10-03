import { FilterBar } from "@/components/FilterBar";
import { ListingCard } from "@/components/ListingCard";
import { getLocale } from "@/lib/locale";
import { getCategories, getListings } from "@/lib/listings";
import { translate } from "@/lib/messages";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const locale = await getLocale();
  return { title: translate(locale, "liveAuctions") };
}

export default async function AuctionsPage({ searchParams }) {
  const locale = await getLocale();
  const t = (key, vars) => translate(locale, key, vars);
  const params = await searchParams;
  const filters = {
    q: params.q || "",
    minPrice: params.minPrice || "",
    maxPrice: params.maxPrice || "",
    location: params.location || "",
    status: params.status || "live",
    sort: params.sort || "ending",
    categorySlug: params.category || "",
  };

  const [listings, categories] = await Promise.all([
    getListings(filters),
    getCategories(),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:py-12">
      <p className="text-xs uppercase tracking-[0.22em] text-yellow">{t("catalogue")}</p>
      <h1 className="display page-title mt-2 text-blue">{t("liveAuctions")}</h1>
      <p className="mt-3 max-w-2xl text-sm text-muted sm:text-base">
        {t("catalogueBody")}
      </p>
      <div className="mt-6 sm:mt-8">
        <FilterBar categories={categories} values={filters} />
      </div>
      <p className="mt-6 text-sm text-muted">{t("lotsCount", { count: listings.length })}</p>
      {listings.length ? (
        <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {listings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      ) : (
        <p className="mt-10 rounded-2xl border border-dashed border-forest/20 p-6 text-center text-muted sm:p-10">
          {t("noFilterMatch")}
        </p>
      )}
    </div>
  );
}
