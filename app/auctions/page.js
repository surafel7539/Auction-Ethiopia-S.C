import { FilterBar } from "@/components/FilterBar";
import { ListingCard } from "@/components/ListingCard";
import { getCategories, getListings } from "@/lib/listings";

export const metadata = {
  title: "Live auctions",
};

export default async function AuctionsPage({ searchParams }) {
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
    <div className="mx-auto max-w-6xl px-4 py-8 sm:py-10">
      <p className="text-xs uppercase tracking-[0.22em] text-gold">Catalogue</p>
      <h1 className="display page-title mt-2 text-forest-deep">Live auctions</h1>
      <p className="mt-3 max-w-2xl text-sm text-muted sm:text-base">
        Filter by price, city, status, or category. Every bid is recorded
        against the lot and visible to registered clients.
      </p>
      <div className="mt-6 sm:mt-8">
        <FilterBar categories={categories} values={filters} />
      </div>
      <p className="mt-6 text-sm text-muted">{listings.length} lots</p>
      {listings.length ? (
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {listings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      ) : (
        <p className="mt-10 rounded-2xl border border-dashed border-forest/20 p-6 text-center text-muted sm:p-10">
          No lots match those filters. Try widening the price range or
          clearing the keyword.
        </p>
      )}
    </div>
  );
}
