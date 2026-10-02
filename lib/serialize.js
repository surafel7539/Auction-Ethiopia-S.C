import mongoose from "mongoose";

export function isValidId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

function asId(value) {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (value._id) return String(value._id);
  return String(value);
}

function asUser(value) {
  if (!value || typeof value !== "object") {
    return { id: asId(value), name: "" };
  }
  return {
    id: asId(value),
    name: value.legalName || value.name || "",
  };
}

function asCategory(value) {
  if (!value || typeof value !== "object" || !value.slug) {
    return { id: asId(value), slug: "", name: "" };
  }
  return {
    id: asId(value),
    slug: value.slug,
    name: value.name,
    description: value.description || "",
  };
}

export function toUserDTO(user) {
  if (!user) return null;
  return {
    id: asId(user),
    name: user.legalName || user.name,
    legalName: user.legalName || user.name || "",
    licenceNumber: user.licenceNumber || "",
    phone: user.phone || "",
    role: user.role,
    createdAt: user.createdAt,
  };
}

export function toListingDTO(listing, extras = {}) {
  if (!listing) return null;
  const bidCount = extras.bidCount ?? listing.bidCount ?? listing._count?.bids ?? 0;
  const watchCount =
    extras.watchCount ?? listing.watchCount ?? listing._count?.watches ?? 0;

  return {
    id: asId(listing),
    title: listing.title,
    description: listing.description,
    images: listing.images,
    startingBid: listing.startingBid,
    currentBid: listing.currentBid,
    bidIncrement: listing.bidIncrement,
    reservePrice: listing.reservePrice ?? null,
    condition: listing.condition,
    location: listing.location,
    status: listing.status,
    startsAt: listing.startsAt,
    endsAt: listing.endsAt,
    createdAt: listing.createdAt,
    categoryId: asId(listing.category),
    sellerId: asId(listing.seller),
    buyerId: listing.buyer ? asId(listing.buyer) : "",
    category: asCategory(listing.category),
    seller: asUser(listing.seller),
    buyer: listing.buyer ? asUser(listing.buyer) : null,
    paidAt: listing.paidAt || null,
    paidAmount: listing.paidAmount ?? null,
    paymentMethod: listing.paymentMethod || "",
    bidCount,
    _count: { bids: bidCount, watches: watchCount },
    bids: extras.bids || listing.bids || [],
  };
}

export function toBidDTO(bid) {
  return {
    id: asId(bid),
    amount: bid.amount,
    createdAt: bid.createdAt,
    listingId: asId(bid.listing),
    bidder: asUser(bid.bidder),
  };
}
