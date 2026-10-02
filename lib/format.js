export function formatETB(amount) {
  const value = Number(amount) || 0;
  return `ETB ${value.toLocaleString("en-ET", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

export function formatDate(date) {
  return new Date(date).toLocaleString("en-ET", {
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

export function getAuctionStatus(listing) {
  if (listing.status === "CANCELLED") return "CANCELLED";
  if (listing.status === "SOLD") return "SOLD";
  const now = Date.now();
  if (new Date(listing.startsAt).getTime() > now) return "SCHEDULED";
  if (new Date(listing.endsAt).getTime() <= now) return "ENDED";
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
  const remaining = new Date(listing.endsAt).getTime() - Date.now();
  return remaining > 0 && remaining <= hours * 60 * 60 * 1000;
}

export function statusLabel(status) {
  const labels = {
    LIVE: "Live",
    ENDED: "Ended",
    SCHEDULED: "Upcoming",
    CANCELLED: "Cancelled",
    SOLD: "Sold",
  };
  return labels[status] || status;
}
