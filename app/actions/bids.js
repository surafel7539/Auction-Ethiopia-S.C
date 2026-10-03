"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { formatETB, getAuctionStatus, getNextMinBid } from "@/lib/format";
import { formError, getLocale } from "@/lib/locale";
import { findListingById, insertBid, updateListingBid } from "@/lib/models";
import { isValidId } from "@/lib/serialize";

export async function placeBidAction(_, formData) {
  const user = await getCurrentUser();
  if (!user) {
    return formError("errSignInBid");
  }

  const listingId = String(formData.get("listingId") || "");
  const amount = Number(formData.get("amount"));

  if (!isValidId(listingId)) {
    return formError("errMissingLot");
  }
  if (!Number.isFinite(amount) || amount <= 0) {
    return formError("errBidAmount");
  }

  const listing = await findListingById(listingId);
  if (!listing) {
    return formError("errLotMissing");
  }
  if (String(listing.sellerId) === user.id) {
    return formError("errOwnBid");
  }

  const status = getAuctionStatus(listing);
  if (status !== "LIVE") {
    return formError("errNotAccepting");
  }

  const minimum = getNextMinBid(listing);
  if (amount < minimum) {
    return formError("errBidMinimum", { amount: formatETB(minimum, await getLocale()) });
  }

  const updated = await updateListingBid(listingId, user.id, amount);
  if (!updated) {
    return formError("errBidRace");
  }

  await insertBid({
    amount,
    listingId,
    bidderId: user.id,
  });

  revalidatePath(`/auctions/${listingId}`);
  revalidatePath("/auctions");
  revalidatePath("/dashboard");
  return { ok: true };
}
