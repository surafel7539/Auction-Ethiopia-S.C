import { notFound } from "next/navigation";
import { FilterBar } from "@/components/FilterBar";
import { ListingCard } from "@/components/ListingCard";
import { CATEGORY_META } from "@/lib/constants";
import { getCategories, getCategoryBySlug, getListings } from "@/lib/listings";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  return { title: category?.name || "Category" };
}

export default async function CategoryPage({ params, searchParams }) {
  const { slug } = await params;
  const query = await searchParams;
  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  const filters = {
    q: query.q || "",
    minPrice: query.minPrice || "",
    maxPrice: query.maxPrice || "",
    location: query.location || "",
    status: query.status || "live",
    sort: query.sort || "ending",
    categorySlug: slug,
  };

  const [listings, categories] = await Promise.all([
    getListings(filters),
    getCategories(),
  ]);
  const meta = CATEGORY_META[slug] || {};

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:py-10">
      <p className="text-xs uppercase tracking-[0.22em] text-gold">
        Department
      </p>
      <h1 className="display page-title mt-2 text-forest-deep">
        {meta.icon || ""} {category.name}
      </h1>
      <p className="mt-3 max-w-2xl text-sm text-muted sm:text-base">{category.description}</p>
      <div className="mt-6 sm:mt-8">
        <FilterBar
          categories={categories}
          values={filters}
          showCategory={false}
          action={`/categories/${slug}`}
        />
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
          No live lots in this category for those filters.
        </p>
      )}
    </div>
  );
}
