"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Listing, Watch } from "@/lib/models";
import { isValidId } from "@/lib/serialize";

export async function toggleWatchAction(listingId) {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "Sign in to watch a lot." };
  }
  if (!isValidId(listingId)) {
    return { error: "Invalid listing." };
  }

  await connectDB();
  const existing = await Watch.findOne({ user: user.id, listing: listingId });

  if (existing) {
    await existing.deleteOne();
    await Listing.findByIdAndUpdate(listingId, { $inc: { watchCount: -1 } });
  } else {
    await Watch.create({ user: user.id, listing: listingId });
    await Listing.findByIdAndUpdate(listingId, { $inc: { watchCount: 1 } });
  }

  revalidatePath(`/auctions/${listingId}`);
  revalidatePath("/dashboard");
  return { ok: true };
}
