import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PaymentForm } from "@/components/PaymentForm";
import { getCurrentUser } from "@/lib/auth";
import { formatETB, parseImages } from "@/lib/format";
import { canPurchaseListing, getHighestBid, getListingById } from "@/lib/listings";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const { id } = await params;
  const listing = await getListingById(id);
  return {
    title: listing ? `Pay · ${listing.title}` : "Payment",
  };
}

export default async function PayListingPage({ params }) {
  const { id } = await params;
  const listing = await getListingById(id);
  if (!listing) notFound();

  const user = await getCurrentUser();
  if (!user) {
    redirect(`/login?next=/auctions/${id}/pay`);
  }

  const highest = await getHighestBid(listing.id);
  const image = parseImages(listing.images)[0];
  const allowed = canPurchaseListing(user, listing, highest);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:py-10">
      <p className="text-xs uppercase tracking-[0.22em] text-gold">
        Settlement
      </p>
      <h1 className="display page-title mt-2 text-forest-deep">
        Pay for this lot
      </h1>
      <p className="mt-3 max-w-2xl text-sm text-muted sm:text-base">
        The winning bidder pays the house after the lot closes. A live lot
        cannot be bought early.{" "}
        <Link href="/help" className="font-medium text-blue">
          Read the help desk
        </Link>
        .
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="card-shadow overflow-hidden rounded-3xl border border-forest/10 bg-paper">
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={image}
              alt={listing.title}
              className="aspect-[4/3] w-full object-cover"
            />
          ) : (
            <div className="grid aspect-[4/3] place-items-center bg-forest/10 text-sm text-muted">
              No photograph
            </div>
          )}
          <div className="space-y-2 p-5">
            <p className="text-[11px] uppercase tracking-[0.18em] text-gold">
              {listing.category?.name} · {listing.location}
            </p>
            <h2 className="display text-2xl text-forest-deep">{listing.title}</h2>
            <p className="text-sm text-muted">
              {listing.condition} · Consigned by {listing.seller.name}
            </p>
            <p className="text-lg font-semibold text-ink">
              {formatETB(listing.currentBid)}
            </p>
          </div>
        </div>

        <div className="card-shadow rounded-3xl border border-forest/10 bg-paper p-5 sm:p-8">
          {listing.computedStatus === "SOLD" ? (
            <p className="text-sm text-forest-deep">
              This lot is already sold
              {listing.buyer?.name ? ` to ${listing.buyer.name}` : ""}.
            </p>
          ) : allowed ? (
            <PaymentForm listing={listing} defaultName={user.legalName} />
          ) : (
            <p className="text-sm text-muted">
              {user.id === listing.sellerId
                ? "You cannot buy your own consignment."
                : "This lot is not available for your account to purchase."}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
