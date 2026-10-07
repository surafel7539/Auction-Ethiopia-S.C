export function isValidId(id) {
  if (id == null || id === "") return false;
  const value = String(id).trim();
  if (!/^[1-9]\d*$/.test(value)) return false;
  const n = Number(value);
  return Number.isSafeInteger(n);
}

function asId(value) {
  if (!value) return "";
  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }
  if (value.id != null) return String(value.id);
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

export function listingFromRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    images: row.images,
    startingBid: Number(row.startingBid),
    currentBid: Number(row.currentBid),
    bidIncrement: Number(row.bidIncrement),
    reservePrice: row.reservePrice == null ? null : Number(row.reservePrice),
    condition: row.condition,
    location: row.location,
    status: row.status,
    startsAt: row.startsAt,
    endsAt: row.endsAt,
    lastBidAt: row.lastBidAt || null,
    createdAt: row.createdAt,
    categoryId: row.categoryId,
    sellerId: row.sellerId,
    buyerId: row.buyerId || null,
    bidCount: row.bidCount || 0,
    watchCount: row.watchCount || 0,
    paidAt: row.paidAt || null,
    paidAmount: row.paidAmount == null ? null : Number(row.paidAmount),
    paymentMethod: row.paymentMethod || "",
    category: {
      id: row.categoryId,
      slug: row.categorySlug,
      name: row.categoryName,
      description: row.categoryDescription || "",
    },
    seller: {
      id: row.sellerId,
      legalName: row.sellerName,
      licenceNumber: row.sellerLicence || "",
    },
    buyer: row.buyerId
      ? { id: row.buyerId, legalName: row.buyerName || "" }
      : null,
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
    accountKind: user.accountKind || "",
    contactName: user.contactName || "",
    city: user.city || "",
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
    bidder: asUser(
      bid.bidder || {
        id: bid.bidderId,
        legalName: bid.bidderName,
      },
    ),
  };
}
