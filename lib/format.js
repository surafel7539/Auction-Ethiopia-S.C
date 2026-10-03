import { translate } from "@/lib/messages";

export function formatETB(amount, locale = "en") {
  const value = Number(amount) || 0;
  const formatted = value.toLocaleString(locale === "am" ? "am-ET" : "en-ET", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  return locale === "am" ? `${formatted} ብር` : `ETB ${formatted}`;
}

export function formatDate(date, locale = "en") {
  return new Date(date).toLocaleString(locale === "am" ? "am-ET" : "en-ET", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function parseImages(images) {
  if (Array.isArray(images)) return images;
  try {
    const parsed = JSON.parse(images || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export const IDLE_BID_MS = 2 * 60 * 60 * 1000;

export function effectiveEndsAt(listing) {
  const scheduled = new Date(listing.endsAt).getTime();
  const bidCount = listing.bidCount ?? listing._count?.bids ?? 0;
  if (!bidCount || !listing.lastBidAt) return new Date(listing.endsAt);
  const idleEnd = new Date(listing.lastBidAt).getTime() + IDLE_BID_MS;
  return new Date(Math.min(scheduled, idleEnd));
}

export function getAuctionStatus(listing) {
  if (listing.status === "CANCELLED") return "CANCELLED";
  if (listing.status === "SOLD") return "SOLD";
  const now = Date.now();
  if (new Date(listing.startsAt).getTime() > now) return "SCHEDULED";
  if (effectiveEndsAt(listing).getTime() <= now) return "ENDED";
  return "LIVE";
}

export function getNextMinBid(listing) {
  const current = Number(listing.currentBid || listing.startingBid || 0);
  const increment = Number(listing.bidIncrement || 100);
  const bidCount = listing.bidCount ?? listing._count?.bids ?? 0;
  if (!bidCount) {
    return Number(listing.startingBid);
  }
  return current + increment;
}

export function endingSoon(listing, hours = 24) {
  const remaining = effectiveEndsAt(listing).getTime() - Date.now();
  return remaining > 0 && remaining <= hours * 60 * 60 * 1000;
}

const STATUS_KEYS = {
  LIVE: "statusLive",
  ENDED: "statusEnded",
  SCHEDULED: "statusUpcoming",
  CANCELLED: "statusCancelled",
  SOLD: "statusSold",
};

export function statusLabel(status, locale = "en") {
  return translate(locale, STATUS_KEYS[status] || "statusLive");
}
