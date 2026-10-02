import { LOCATIONS, SORT_OPTIONS, STATUS_OPTIONS } from "@/lib/constants";

export function FilterBar({
  categories = [],
  values = {},
  showCategory = true,
  action = "/auctions",
}) {
  return (
    <form
      action={action}
      className="card-shadow grid gap-3 rounded-2xl border border-forest/10 bg-paper p-3 sm:grid-cols-2 sm:p-4 lg:grid-cols-4"
    >
      <input
        type="search"
        name="q"
        defaultValue={values.q || ""}
        placeholder="Keyword"
        className="rounded-xl border border-forest/15 px-3 py-2 text-sm sm:col-span-2"
      />
      <input
        type="number"
        name="minPrice"
        defaultValue={values.minPrice || ""}
        placeholder="Min ETB"
        className="rounded-xl border border-forest/15 px-3 py-2 text-sm"
      />
      <input
        type="number"
        name="maxPrice"
        defaultValue={values.maxPrice || ""}
        placeholder="Max ETB"
        className="rounded-xl border border-forest/15 px-3 py-2 text-sm"
      />
      {showCategory ? (
        <select
          name="category"
          defaultValue={values.category || ""}
          className="rounded-xl border border-forest/15 bg-white px-3 py-2 text-sm"
        >
          <option value="">All categories</option>
          {categories.map((category) => (
            <option key={category.id} value={category.slug}>
              {category.name}
            </option>
          ))}
        </select>
      ) : null}
      <select
        name="location"
        defaultValue={values.location || ""}
        className="rounded-xl border border-forest/15 bg-white px-3 py-2 text-sm"
      >
        <option value="">All cities</option>
        {LOCATIONS.map((location) => (
          <option key={location} value={location}>
            {location}
          </option>
        ))}
      </select>
      <select
        name="status"
        defaultValue={values.status || "live"}
        className="rounded-xl border border-forest/15 bg-white px-3 py-2 text-sm"
      >
        {STATUS_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <select
        name="sort"
        defaultValue={values.sort || "ending"}
        className="rounded-xl border border-forest/15 bg-white px-3 py-2 text-sm"
      >
        {SORT_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <button
        type="submit"
        className="rounded-xl bg-forest px-4 py-2 text-sm font-medium text-paper hover:bg-forest-deep sm:col-span-2"
      >
        Apply filters
      </button>
    </form>
  );
}
