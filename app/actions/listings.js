"use server";

import { mkdir, writeFile } from "fs/promises";
import path from "path";
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

function clean(value) {
  return String(value || "").trim();
}

async function saveImages(files) {
  const saved = [];
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadDir, { recursive: true });

  for (const file of files.slice(0, 8)) {
    if (!file || typeof file === "string" || !file.size) continue;
    if (!file.type?.startsWith("image/")) continue;
    if (file.size > 5 * 1024 * 1024) continue;

    const ext = path.extname(file.name || "") || ".jpg";
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(uploadDir, filename), buffer);
    saved.push(`/uploads/${filename}`);
  }

  return saved;
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
    endsAt: new Date(Date.now() + durationHours * 60 * 60 * 1000),
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
