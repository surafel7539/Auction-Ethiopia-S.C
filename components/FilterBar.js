import { LOCATIONS, SORT_OPTIONS, STATUS_OPTIONS } from "@/lib/constants";

const field =
  "rounded-2xl border border-forest/10 bg-white px-3 py-2.5 text-sm outline-none";

export function FilterBar({
  categories = [],
  values = {},
  showCategory = true,
  action = "/auctions",
}) {
  return (
    <form action={action} className="panel grid gap-3 rounded-[1.6rem] p-3 sm:grid-cols-2 sm:p-4 lg:grid-cols-4">
      <input
        type="search"
        name="q"
        defaultValue={values.q || ""}
        placeholder="Keyword"
        aria-label="Keyword"
        className={`${field} sm:col-span-2`}
      />
      <input
        type="number"
        name="minPrice"
        defaultValue={values.minPrice || ""}
        placeholder="Min ETB"
        aria-label="Min ETB"
        className={field}
      />
      <input
        type="number"
        name="maxPrice"
        defaultValue={values.maxPrice || ""}
        placeholder="Max ETB"
        aria-label="Max ETB"
        className={field}
      />
      {showCategory ? (
        <select name="category" defaultValue={values.category || values.categorySlug || ""} aria-label="All categories" className={field}>
          <option value="">All categories</option>
          {categories.map((category) => (
            <option key={category.id} value={category.slug}>
              {category.name}
            </option>
          ))}
        </select>
      ) : null}
      <select name="location" defaultValue={values.location || ""} aria-label="All cities" className={field}>
        <option value="">All cities</option>
        {LOCATIONS.map((location) => (
          <option key={location} value={location}>
            {location}
          </option>
        ))}
      </select>
      <select name="status" defaultValue={values.status || "live"} aria-label="Live auctions" className={field}>
        {STATUS_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <select name="sort" defaultValue={values.sort || "ending"} aria-label="Ending soon" className={field}>
        {SORT_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <button
        type="submit"
        className="rounded-2xl bg-blue px-4 py-2.5 text-sm font-semibold text-paper hover:bg-blue/90 sm:col-span-2"
      >
        Apply filters
      </button>
    </form>
  );
}
