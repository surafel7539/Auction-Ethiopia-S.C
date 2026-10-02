import Link from "next/link";
import { cancelListingAction } from "@/app/actions/listings";
import { ListingCard } from "@/components/ListingCard";
import { requireUser } from "@/lib/auth";
import { formatETB, getAuctionStatus } from "@/lib/format";
import { getDashboardData } from "@/lib/listings";

export const metadata = {
  title: "Client desk",
};

export default async function DashboardPage() {
  const user = await requireUser("/login");
  const { listings, bids, watches } = await getDashboardData(user.id);

  const uniqueBids = [];
  const seen = new Set();
  for (const bid of bids) {
    if (seen.has(bid.listingId)) continue;
    seen.add(bid.listingId);
    uniqueBids.push(bid);
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:py-10">
      <p className="text-xs uppercase tracking-[0.22em] text-gold">
        Client desk
      </p>
      <h1 className="display page-title mt-2 text-forest-deep">
        Welcome, {user.legalName.split(" ")[0]}
      </h1>
      <p className="mt-3 text-muted">
        Licence {user.licenceNumber} · {user.phone} ·{" "}
        {user.role.replace("_", " ").toLowerCase()} account
      </p>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/sell"
          className="rounded-full bg-forest px-5 py-2 text-sm text-paper"
        >
          Create a listing
        </Link>
        <Link
          href="/auctions"
          className="rounded-full border border-forest/20 px-5 py-2 text-sm text-forest"
        >
          Browse auctions
        </Link>
      </div>

      <section className="mt-12">
        <h2 className="display section-title text-forest-deep">My listings</h2>
        {listings.length ? (
          <div className="mt-5 overflow-x-auto rounded-2xl border border-forest/10 bg-paper">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead className="bg-forest text-gold-soft">
                <tr>
                  <th className="px-4 py-3">Lot</th>
                  <th className="px-4 py-3">Bid</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {listings.map((listing) => {
                  const status = getAuctionStatus(listing);
                  return (
                    <tr key={listing.id} className="border-t border-forest/10">
                      <td className="px-4 py-3">
                        <Link
                          href={`/auctions/${listing.id}`}
                          className="font-medium text-forest-deep"
                        >
                          {listing.title}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        {formatETB(listing.currentBid)} · {listing._count.bids}{" "}
                        bids
                      </td>
                      <td className="px-4 py-3">{status}</td>
                      <td className="px-4 py-3 text-right">
                        {status === "LIVE" && listing._count.bids === 0 ? (
                          <form action={cancelListingAction.bind(null, listing.id)}>
                            <button className="text-clay">Cancel</button>
                          </form>
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-4 text-sm text-muted">
            You have not consigned a lot yet.
          </p>
        )}
      </section>

      <section className="mt-12">
        <h2 className="display section-title text-forest-deep">My bids</h2>
        {uniqueBids.length ? (
          <div className="mt-5 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {uniqueBids.map((bid) => (
              <div key={bid.id}>
                <ListingCard listing={bid.listing} />
                <p className="mt-2 text-sm text-muted">
                  Your latest bid: {formatETB(bid.amount)}
                  {bid.listing.computedStatus === "SOLD"
                    ? " · sold"
                    : bid.amount >= bid.listing.currentBid
                      ? " · leading"
                      : " · outbid"}
                </p>
                {bid.listing.computedStatus === "LIVE" &&
                bid.listing.sellerId !== user.id ? (
                  <Link
                    href={`/auctions/${bid.listing.id}/pay`}
                    className="mt-2 inline-block text-sm font-medium text-forest"
                  >
                    Buy this lot
                  </Link>
                ) : null}
                {bid.listing.computedStatus === "ENDED" &&
                bid.amount >= bid.listing.currentBid ? (
                  <Link
                    href={`/auctions/${bid.listing.id}/pay`}
                    className="mt-2 inline-block text-sm font-medium text-forest"
                  >
                    Pay now
                  </Link>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm text-muted">
            You have not placed a bid yet.
          </p>
        )}
      </section>

      <section className="mt-12">
        <h2 className="display section-title text-forest-deep">Watchlist</h2>
        {watches.length ? (
          <div className="mt-5 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {watches.map((watch) => (
              <ListingCard key={watch.id} listing={watch.listing} />
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm text-muted">
            Watch a lot from its catalogue page to keep it here.
          </p>
        )}
      </section>
    </div>
  );
}
