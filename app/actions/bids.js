"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { getAuctionStatus, getNextMinBid } from "@/lib/format";
import { Bid, Listing } from "@/lib/models";
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

  await connectDB();
  const listing = await Listing.findById(listingId);
  if (!listing) {
    return { error: "This lot could not be found." };
  }
  if (String(listing.seller) === user.id) {
    return { error: "You cannot bid on your own listing." };
  }

  const status = getAuctionStatus(listing);
  if (status !== "LIVE") {
    return { error: "This auction is no longer accepting bids." };
  }

  const minimum = getNextMinBid({
    ...listing.toObject(),
    bidCount: listing.bidCount,
  });
  if (amount < minimum) {
    return {
      error: `Your bid must be at least ETB ${minimum.toLocaleString("en-ET")}.`,
    };
  }

  const updated = await Listing.findOneAndUpdate(
    {
      _id: listingId,
      seller: { $ne: user.id },
      status: { $ne: "CANCELLED" },
      endsAt: { $gt: new Date() },
      currentBid: { $lte: amount },
    },
    {
      $set: { currentBid: amount },
      $inc: { bidCount: 1 },
    },
    { new: true },
  );

  if (!updated) {
    return { error: "Another bid landed first. Refresh and try again." };
  }

  await Bid.create({
    amount,
    listing: listingId,
    bidder: user.id,
  });

  revalidatePath(`/auctions/${listingId}`);
  revalidatePath("/auctions");
  revalidatePath("/dashboard");
  return { ok: true };
}
