"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { deleteWatch, findWatch, insertWatch } from "@/lib/models";
import { isValidId } from "@/lib/serialize";

export async function toggleWatchAction(listingId) {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "Sign in to watch a lot." };
  }
  if (!isValidId(listingId)) {
    return { error: "Invalid listing." };
  }

  const existing = await findWatch(user.id, listingId);

  if (existing) {
    await deleteWatch(user.id, listingId);
  } else {
    await insertWatch(user.id, listingId);
  }

  revalidatePath(`/auctions/${listingId}`);
  revalidatePath("/dashboard");
  return { ok: true };
}
