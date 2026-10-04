import Link from "next/link";
import { notFound } from "next/navigation";
import { ListingCard } from "@/components/ListingCard";
import { getLocale } from "@/lib/locale";
import { getListings, getSupplier } from "@/lib/listings";
import { cityName, translate } from "@/lib/messages";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const { id } = await params;
  const [supplier, locale] = await Promise.all([getSupplier(id), getLocale()]);
  return { title: supplier?.name || translate(locale, "suppliers") };
}

export default async function SupplierPage({ params }) {
  const { id } = await params;
  const [supplier, locale] = await Promise.all([getSupplier(id), getLocale()]);
  if (!supplier) notFound();
  const t = (key, vars) => translate(locale, key, vars);
  const listings = await getListings({ sellerId: supplier.id, sort: "newest" });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:py-12">
      <p className="text-xs uppercase tracking-[0.22em] text-yellow">
        <Link href="/suppliers" className="hover:text-forest">
          {t("suppliers")}
        </Link>
      </p>
      <div className="mt-4 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="rounded-full bg-yellow px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-forest-deep">
            {supplier.accountKind === "ORGANISATION" ? t("organisation") : t("individual")}
          </span>
          <h1 className="display page-title mt-3 text-blue">{supplier.name}</h1>
          <p className="mt-3 text-sm text-muted sm:text-base">
            {supplier.accountKind === "ORGANISATION" && supplier.contactName
              ? `${t("contactPerson")}: ${supplier.contactName}`
              : null}
            {supplier.accountKind === "ORGANISATION" && supplier.contactName && supplier.city ? " · " : ""}
            {supplier.city ? cityName(locale, supplier.city) : ""}
          </p>
        </div>
        <p className="text-sm font-medium text-yellow">{t("supplierLots", { count: supplier.lotCount })}</p>
      </div>
      <h2 className="display mt-10 text-2xl text-heading">{t("theirLots")}</h2>
      {listings.length ? (
        <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {listings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      ) : (
        <p className="mt-6 rounded-2xl border border-dashed border-forest/20 p-6 text-center text-muted sm:p-10">
          {t("noSupplierLots")}
        </p>
      )}
    </div>
  );
}
