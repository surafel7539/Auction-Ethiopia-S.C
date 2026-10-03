import Link from "next/link";
import { CATEGORY_META } from "@/lib/constants";
import { getLocale } from "@/lib/locale";
import { getCategories } from "@/lib/listings";
import { categoryBlurb, categoryName, translate } from "@/lib/messages";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const locale = await getLocale();
  return { title: translate(locale, "categories") };
}

export default async function CategoriesPage() {
  const locale = await getLocale();
  const t = (key, vars) => translate(locale, key, vars);
  const categories = await getCategories();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:py-12">
      <p className="text-xs uppercase tracking-[0.22em] text-yellow">{t("departmentsKicker")}</p>
      <h1 className="display page-title mt-2 text-blue">{t("categories")}</h1>
      <p className="mt-3 max-w-2xl text-sm text-muted sm:text-base">
        {t("categoriesBody")}
      </p>
      <div className="mt-8 grid gap-4 sm:mt-10 sm:gap-5 md:grid-cols-2">
        {categories.map((category) => {
          const meta = CATEGORY_META[category.slug] || {};
          return (
            <Link
              key={category.id}
              href={`/categories/${category.slug}`}
              className="panel rounded-[1.8rem] p-6 transition hover:-translate-y-1 sm:p-8"
              style={{ borderLeftWidth: 6, borderLeftColor: meta.accent || "#6d28d9" }}
            >
              <span className="text-3xl">{meta.icon || "◆"}</span>
              <h2 className="display mt-4 text-2xl text-heading sm:text-3xl">
                {categoryName(locale, category)}
              </h2>
              <p className="mt-3 text-sm text-muted sm:text-base">{categoryBlurb(locale, category)}</p>
              <p className="mt-6 text-sm font-medium text-yellow">
                {t("lotsInDepartment", { count: category._count.listings })}
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
