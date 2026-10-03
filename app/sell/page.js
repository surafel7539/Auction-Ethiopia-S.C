import { redirect } from "next/navigation";
import { ListingForm } from "@/components/ListingForm";
import { getCurrentUser, canSell } from "@/lib/auth";
import { getLocale } from "@/lib/locale";
import { getCategories } from "@/lib/listings";
import { translate } from "@/lib/messages";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const locale = await getLocale();
  return { title: translate(locale, "sellTitle") };
}

export default async function SellPage() {
  const locale = await getLocale();
  const t = (key) => translate(locale, key);
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?next=/sell");
  }

  const categories = await getCategories();

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
      <p className="text-xs uppercase tracking-[0.22em] text-gold">
        {t("consignment")}
      </p>
      <h1 className="display page-title mt-2 text-heading">{t("sellTitle")}</h1>
      <p className="mt-3 text-sm text-muted sm:text-base">
        {t("sellBody")}
      </p>
      {!canSell(user) ? (
        <p className="mt-8 rounded-2xl border border-clay/30 bg-paper p-5 text-sm text-clay sm:p-6">
          {t("buyerOnly")}
        </p>
      ) : (
        <div className="panel mt-8 rounded-[1.8rem] p-4 sm:p-6 md:p-8">
          <ListingForm categories={categories} />
        </div>
      )}
    </div>
  );
}
