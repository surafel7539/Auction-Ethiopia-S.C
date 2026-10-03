import mongoose from "mongoose";

export function isValidId(id) {
  return mongoose.Types.ObjectId.isValid(id) && String(id).length === 24;
}

function asId(value) {
  if (!value) return "";
  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }
  if (value.id != null) return String(value.id);
  if (value._id != null) return String(value._id);
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
    startingBid: Number(listing.startingBid),
    currentBid: Number(listing.currentBid),
    bidIncrement: Number(listing.bidIncrement),
    reservePrice:
      listing.reservePrice == null ? null : Number(listing.reservePrice),
    condition: listing.condition,
    location: listing.location,
    status: listing.status,
    startsAt: listing.startsAt,
    endsAt: listing.endsAt,
    lastBidAt: listing.lastBidAt || null,
    createdAt: listing.createdAt,
    categoryId: asId(listing.category || listing.categoryId),
    sellerId: asId(listing.seller || listing.sellerId),
    buyerId: listing.buyer || listing.buyerId ? asId(listing.buyer || listing.buyerId) : "",
    category: asCategory(listing.category),
    seller: asUser(listing.seller),
    buyer: listing.buyer ? asUser(listing.buyer) : null,
    paidAt: listing.paidAt || null,
    paidAmount: listing.paidAmount == null ? null : Number(listing.paidAmount),
    paymentMethod: listing.paymentMethod || "",
    bidCount,
    _count: { bids: bidCount, watches: watchCount },
    bids: extras.bids || listing.bids || [],
  };
}

export function toBidDTO(bid) {
  return {
    id: asId(bid),
    amount: Number(bid.amount),
    createdAt: bid.createdAt,
    listingId: asId(bid.listingId || bid.listing),
    bidder: asUser(bid.bidder),
  };
}
