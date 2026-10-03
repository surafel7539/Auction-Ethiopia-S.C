"use client";

import { LOCATIONS, SORT_OPTIONS, STATUS_OPTIONS } from "@/lib/constants";
import { useI18n } from "@/components/LocaleProvider";
import { categoryName, cityName } from "@/lib/messages";

const STATUS_KEYS = { live: "liveAuctions", ending: "endingSoon", ended: "completed" };
const SORT_KEYS = {
  ending: "endingSoon",
  newest: "newest",
  price_asc: "priceLow",
  price_desc: "priceHigh",
  popular: "mostBids",
};

const field =
  "rounded-2xl border border-forest/10 bg-field px-3 py-2.5 text-sm outline-none";

export function FilterBar({
  categories = [],
  values = {},
  showCategory = true,
  action = "/auctions",
}) {
  const { locale, t } = useI18n();
  return (
    <form action={action} className="panel grid gap-3 rounded-[1.6rem] p-3 sm:grid-cols-2 sm:p-4 lg:grid-cols-4">
      <input
        type="search"
        name="q"
        defaultValue={values.q || ""}
        placeholder={t("keyword")}
        aria-label={t("keyword")}
        className={`${field} sm:col-span-2`}
      />
      <input
        type="number"
        name="minPrice"
        defaultValue={values.minPrice || ""}
        placeholder={t("minEtb")}
        aria-label={t("minEtb")}
        className={field}
      />
      <input
        type="number"
        name="maxPrice"
        defaultValue={values.maxPrice || ""}
        placeholder={t("maxEtb")}
        aria-label={t("maxEtb")}
        className={field}
      />
      {showCategory ? (
        <select name="category" defaultValue={values.category || values.categorySlug || ""} aria-label={t("allCategories")} className={field}>
          <option value="">{t("allCategories")}</option>
          {categories.map((category) => (
            <option key={category.id} value={category.slug}>
              {categoryName(locale, category)}
            </option>
          ))}
        </select>
      ) : null}
      <select name="location" defaultValue={values.location || ""} aria-label={t("allCities")} className={field}>
        <option value="">{t("allCities")}</option>
        {LOCATIONS.map((location) => (
          <option key={location} value={location}>
            {cityName(locale, location)}
          </option>
        ))}
      </select>
      <select name="status" defaultValue={values.status || "live"} aria-label={t("liveAuctions")} className={field}>
        {STATUS_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {t(STATUS_KEYS[option.value] || "liveAuctions")}
          </option>
        ))}
      </select>
      <select name="sort" defaultValue={values.sort || "ending"} aria-label={t("endingSoon")} className={field}>
        {SORT_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {t(SORT_KEYS[option.value] || "endingSoon")}
          </option>
        ))}
      </select>
      <button
        type="submit"
        className="rounded-2xl bg-blue px-4 py-2.5 text-sm font-semibold text-on hover:bg-blue/90 sm:col-span-2"
      >
        {t("applyFilters")}
      </button>
    </form>
  );
}
