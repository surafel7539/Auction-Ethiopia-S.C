import Link from "next/link";
import { getLocale } from "@/lib/locale";
import { getSuppliers } from "@/lib/listings";
import { cityName, translate } from "@/lib/messages";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const locale = await getLocale();
  return { title: translate(locale, "suppliers") };
}

export default async function SuppliersPage() {
  const locale = await getLocale();
  const t = (key, vars) => translate(locale, key, vars);
  const suppliers = await getSuppliers();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:py-12">
      <p className="text-xs uppercase tracking-[0.22em] text-yellow">{t("suppliersKicker")}</p>
      <h1 className="display page-title mt-2 text-blue">{t("suppliers")}</h1>
      <p className="mt-3 max-w-2xl text-sm text-muted sm:text-base">{t("suppliersBody")}</p>
      {suppliers.length ? (
        <div className="mt-8 grid gap-5 sm:mt-10 sm:grid-cols-2 xl:grid-cols-3">
          {suppliers.map((supplier) => (
            <Link
              key={supplier.id}
              href={`/suppliers/${supplier.id}`}
              className="group overflow-hidden rounded-[1.6rem] border border-forest/10 bg-paper shadow-[0_20px_40px_-28px_rgba(46,16,101,0.55)] transition duration-300 hover:-translate-y-1"
            >
              <div className="relative aspect-[5/3] overflow-hidden bg-forest/10">
                {supplier.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={supplier.image}
                    alt=""
                    className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                  />
                ) : (
                  <div className="grid h-full place-items-center display text-5xl text-heading">
                    {supplier.name.slice(0, 1)}
                  </div>
                )}
                <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-forest-deep/80 to-transparent" />
                <span className="absolute left-3 top-3 rounded-full bg-yellow px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-forest-deep">
                  {supplier.accountKind === "ORGANISATION" ? t("organisation") : t("individual")}
                </span>
              </div>
              <div className="p-5">
                <h2 className="display text-2xl text-heading">{supplier.name}</h2>
                <p className="mt-2 text-sm text-muted">
                  {supplier.city ? `${cityName(locale, supplier.city)} · ` : ""}
                  {t("supplierLots", { count: supplier.lotCount })}
                </p>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <p className="mt-10 rounded-2xl border border-dashed border-forest/20 p-6 text-center text-muted sm:p-10">
          {t("noSuppliers")}
        </p>
      )}
    </div>
  );
}
