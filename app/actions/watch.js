"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { deleteWatch, findWatch, insertWatch } from "@/lib/models";
import { formError } from "@/lib/locale";
import { isValidId } from "@/lib/serialize";

export async function toggleWatchAction(listingId) {
  const user = await getCurrentUser();
  if (!user) {
    return formError("errWatch");
  }
  if (!isValidId(listingId)) {
    return formError("errInvalidListing");
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
