"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { formError } from "@/lib/locale";
import { execute } from "@/lib/db";
import { cancelListing } from "@/lib/models";
import { isValidId } from "@/lib/serialize";

export async function adminCancelListingAction(listingId) {
  await requireAdmin();
  if (!isValidId(listingId)) return formError("errInvalidListing");
  await cancelListing(listingId);
  revalidatePath("/admin");
  revalidatePath("/auctions");
  revalidatePath("/");
  return { ok: true };
}

export async function adminCloseListingAction(listingId) {
  await requireAdmin();
  if (!isValidId(listingId)) return formError("errInvalidListing");
  await execute(
    `UPDATE listings
     SET ends_at = NOW(), status = 'ENDED'
     WHERE id = ? AND status = 'LIVE'`,
    [listingId],
  );
  revalidatePath("/admin");
  revalidatePath("/auctions");
  revalidatePath("/");
  return { ok: true };
}
