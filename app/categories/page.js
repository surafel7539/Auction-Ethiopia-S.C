import Link from "next/link";
import { CATEGORY_META } from "@/lib/constants";
import { getCategories } from "@/lib/listings";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Categories",
};

export default async function CategoriesPage() {
  const categories = await getCategories();

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:py-10">
      <p className="text-xs uppercase tracking-[0.22em] text-yellow">Departments</p>
      <h1 className="display page-title mt-2 text-blue">Categories</h1>
      <p className="mt-3 max-w-2xl text-sm text-muted sm:text-base">
        Each department has its own catalogue. Open a category to filter lots
        by price, city, and closing time.
      </p>
      <div className="mt-8 grid gap-4 sm:mt-10 sm:gap-5 md:grid-cols-2">
        {categories.map((category) => {
          const meta = CATEGORY_META[category.slug] || {};
          return (
            <Link
              key={category.id}
              href={`/categories/${category.slug}`}
              className="card-shadow rounded-3xl border border-forest/10 bg-paper p-5 sm:p-8"
              style={{ borderLeftWidth: 6, borderLeftColor: meta.accent || "#6d28d9" }}
            >
              <span className="text-3xl">{meta.icon || "◆"}</span>
              <h2 className="display mt-4 text-2xl text-forest-deep sm:text-3xl">
                {category.name}
              </h2>
              <p className="mt-3 text-sm text-muted sm:text-base">{category.description}</p>
              <p className="mt-6 text-sm font-medium text-yellow">
                {category._count.listings} lots in this department
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
