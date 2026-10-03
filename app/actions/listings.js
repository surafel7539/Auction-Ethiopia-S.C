"use server";

import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser, canSell } from "@/lib/auth";
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
    return { error: "Please sign in to create a listing." };
  }
  if (!canSell(user)) {
    return { error: "Your account is not enabled for selling. Register as a seller." };
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
    return { error: "Add at least one photograph of the lot." };
  }
  if (files.some((file) => file && typeof file !== "string" && file.size > 5 * 1024 * 1024)) {
    return { error: "Each photograph must be 5 MB or smaller." };
  }
  const images = await saveImages(files);

  if (title.length < 4) {
    return { error: "Give the lot a clear title (at least 4 characters)." };
  }
  if (description.length < 20) {
    return { error: "Please add a fuller description of the lot." };
  }
  if (!categoryId || !isValidId(categoryId)) {
    return { error: "Choose a category." };
  }
  if (!Number.isFinite(startingBid) || startingBid <= 0) {
    return { error: "Starting bid must be a positive amount." };
  }
  if (!Number.isFinite(bidIncrement) || bidIncrement <= 0) {
    return { error: "Bid increment must be a positive amount." };
  }
  if (!CONDITIONS.includes(condition)) {
    return { error: "Choose a valid condition." };
  }
  if (!LOCATIONS.includes(location)) {
    return { error: "Choose a valid location." };
  }
  if (![24, 48, 72, 120, 168].includes(durationHours)) {
    return { error: "Choose a valid auction duration." };
  }
  if (!images.length) {
    return { error: "Add at least one photograph of the lot." };
  }

  const category = await findCategoryById(categoryId);
  if (!category) {
    return { error: "That category does not exist." };
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
  if (!user) return { error: "Please sign in." };
  if (!isValidId(listingId)) return { error: "Invalid listing." };

  const listing = await findListingById(listingId);
  if (!listing || String(listing.sellerId) !== user.id) {
    return { error: "You can only cancel your own listings." };
  }

  if (listing.status === "SOLD") {
    return { error: "A sold lot cannot be cancelled." };
  }

  const bidCount = await countBids(listingId);
  if (bidCount > 0) {
    return { error: "A listing with bids cannot be cancelled." };
  }

  await cancelListing(listingId);

  revalidatePath("/dashboard");
  revalidatePath(`/auctions/${listingId}`);
  return { ok: true };
}
