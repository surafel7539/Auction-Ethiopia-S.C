"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser, canSell } from "@/lib/auth";
import { formError } from "@/lib/locale";
import { CONDITIONS, LOCATIONS } from "@/lib/constants";
import {
  cancelListing,
  countBids,
  createListing,
  findCategoryById,
  findListingById,
} from "@/lib/models";
import { isValidId } from "@/lib/serialize";
import { saveListingImages } from "@/lib/storage";

function clean(value) {
  return String(value || "").trim();
}

async function saveImages(files) {
  return saveListingImages(files);
}

export async function createListingAction(_, formData) {
  const user = await getCurrentUser();
  if (!user) {
    return formError("errSignInSell");
  }
  if (!canSell(user)) {
    return formError("errNotSeller");
  }

  const title = clean(formData.get("title"));
  const description = clean(formData.get("description"));
  const categoryId = clean(formData.get("categoryId"));
  const startingBid = Number(formData.get("startingBid"));
  const bidIncrement = Number(formData.get("bidIncrement") || 100);
  const reservePriceRaw = clean(formData.get("reservePrice"));
  const condition = clean(formData.get("condition"));
  const location = clean(formData.get("location"));
  const durationHours = Number(formData.get("durationHours") || 72);
  const scheduleEnabled = clean(formData.get("scheduleEnabled")) === "1";
  const startsAtRaw = clean(formData.get("startsAt"));
  const files = formData.getAll("images");
  if (!files.some((file) => file && typeof file !== "string" && file.size)) {
    return formError("errPhotoRequired");
  }
  if (files.some((file) => file && typeof file !== "string" && file.size > 5 * 1024 * 1024)) {
    return formError("errPhotoSize");
  }
  const images = await saveImages(files);

  if (title.length < 4) {
    return formError("errTitle");
  }
  if (description.length < 20) {
    return formError("errDescription");
  }
  if (!categoryId || !isValidId(categoryId)) {
    return formError("errChooseCategory");
  }
  if (!Number.isFinite(startingBid) || startingBid <= 0) {
    return formError("errStartingBid");
  }
  if (!Number.isFinite(bidIncrement) || bidIncrement <= 0) {
    return formError("errIncrement");
  }
  if (!CONDITIONS.includes(condition)) {
    return formError("errCondition");
  }
  if (!LOCATIONS.includes(location)) {
    return formError("errLocation");
  }
  if (![24, 48, 72, 120, 168].includes(durationHours)) {
    return formError("errDuration");
  }
  if (!images.length) {
    return formError("errPhotoRequired");
  }

  let startsAt = null;
  let endsAt = new Date(Date.now() + durationHours * 60 * 60 * 1000);
  if (scheduleEnabled) {
    startsAt = new Date(startsAtRaw);
    if (!startsAtRaw || Number.isNaN(startsAt.getTime()) || startsAt.getTime() <= Date.now()) {
      return formError("errSchedule");
    }
    endsAt = new Date(startsAt.getTime() + durationHours * 60 * 60 * 1000);
  }

  const category = await findCategoryById(categoryId);
  if (!category) {
    return formError("errCategoryMissing");
  }

  const listing = await createListing({
    title,
    description,
    images: JSON.stringify(images),
    startingBid,
    currentBid: startingBid,
    bidIncrement,
    reservePrice: reservePriceRaw ? Number(reservePriceRaw) : null,
    condition,
    location,
    status: "LIVE",
    startsAt,
    endsAt,
    categoryId,
    sellerId: user.id,
  });

  revalidatePath("/auctions");
  revalidatePath("/categories");
  revalidatePath("/");
  redirect(`/auctions/${listing.id}`);
}

export async function cancelListingAction(listingId) {
  const user = await getCurrentUser();
  if (!user) return formError("errSignIn");
  if (!isValidId(listingId)) return formError("errInvalidListing");

  const listing = await findListingById(listingId);
  if (!listing || String(listing.sellerId) !== user.id) {
    return formError("errCancelOwn");
  }

  if (listing.status === "SOLD") {
    return formError("errCancelSold");
  }

  const bidCount = await countBids(listingId);
  if (bidCount > 0) {
    return formError("errCancelBids");
  }

  await cancelListing(listingId);

  revalidatePath("/dashboard");
  revalidatePath(`/auctions/${listingId}`);
  return { ok: true };
}
