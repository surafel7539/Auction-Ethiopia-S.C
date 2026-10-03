"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { getAuctionStatus, getNextMinBid } from "@/lib/format";
import { findListingById, insertBid, updateListingBid } from "@/lib/models";
import { isValidId } from "@/lib/serialize";

export async function placeBidAction(_, formData) {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "Sign in to place a bid." };
  }

  const listingId = String(formData.get("listingId") || "");
  const amount = Number(formData.get("amount"));

  if (!isValidId(listingId)) {
    return { error: "Missing auction lot." };
  }
  if (!Number.isFinite(amount) || amount <= 0) {
    return { error: "Enter a valid bid amount." };
  }

  const listing = await findListingById(listingId);
  if (!listing) {
    return { error: "This lot could not be found." };
  }
  if (String(listing.sellerId) === user.id) {
    return { error: "You cannot bid on your own listing." };
  }

  const status = getAuctionStatus(listing);
  if (status !== "LIVE") {
    return { error: "This auction is no longer accepting bids." };
  }

  const minimum = getNextMinBid(listing);
  if (amount < minimum) {
    return {
      error: `Your bid must be at least ETB ${minimum.toLocaleString("en-ET")}.`,
    };
  }

  const updated = await updateListingBid(listingId, user.id, amount);
  if (!updated) {
    return { error: "Another bid landed first. Refresh and try again." };
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
