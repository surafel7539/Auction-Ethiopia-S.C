import { redirect } from "next/navigation";
import { ListingForm } from "@/components/ListingForm";
import { getCurrentUser, canSell } from "@/lib/auth";
import { getCategories } from "@/lib/listings";

export const metadata = {
  title: "Sell a lot",
};

export default async function SellPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?next=/sell");
  }

  const categories = await getCategories();

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:py-10">
      <p className="text-xs uppercase tracking-[0.22em] text-gold">
        Consignment
      </p>
      <h1 className="display page-title mt-2 text-forest-deep">Sell a lot</h1>
      <p className="mt-3 text-sm text-muted sm:text-base">
        Publish a timed auction. Buyers will see the lot immediately and can
        bid until the clock ends.
      </p>
      {!canSell(user) ? (
        <p className="mt-8 rounded-2xl border border-clay/30 bg-paper p-5 text-sm text-clay sm:p-6">
          This account is registered as a buyer only. Create a seller or
          combined account to consign lots.
        </p>
      ) : (
        <div className="card-shadow mt-8 rounded-3xl border border-forest/10 bg-paper p-4 sm:p-6 md:p-8">
          <ListingForm categories={categories} />
        </div>
      )}
    </div>
  );
}
