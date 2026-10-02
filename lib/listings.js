import { connectDB } from "./db";
import { Bid, Category, Listing, Watch } from "./models";
import { endingSoon, getAuctionStatus } from "./format";
import { isValidId, toBidDTO, toListingDTO } from "./serialize";

function applyComputedStatus(listing) {
  return { ...listing, computedStatus: getAuctionStatus(listing) };
}

export async function syncEndedListings() {
  await connectDB();
  await Listing.updateMany(
    { status: "LIVE", endsAt: { $lte: new Date() } },
    { $set: { status: "ENDED" } },
  );
}

export async function buildListingQuery({
  q,
  minPrice,
  maxPrice,
  status,
  location,
  categoryId,
  categorySlug,
}) {
  const query = {};
  const and = [];

  if (q) {
    and.push({
      $or: [
        { title: { $regex: q, $options: "i" } },
        { description: { $regex: q, $options: "i" } },
        { location: { $regex: q, $options: "i" } },
      ],
    });
  }

  if (minPrice) {
    query.currentBid = { ...(query.currentBid || {}), $gte: Number(minPrice) };
  }

  if (maxPrice) {
    query.currentBid = { ...(query.currentBid || {}), $lte: Number(maxPrice) };
  }

  if (location && location !== "all") {
    query.location = location;
  }

  if (categoryId && isValidId(categoryId)) {
    query.category = categoryId;
  } else if (categorySlug) {
    const category = await Category.findOne({ slug: categorySlug }).lean();
    if (category) {
      query.category = category._id;
    } else {
      query.category = null;
    }
  }

  const now = new Date();
  if (status === "live") {
    query.status = { $nin: ["CANCELLED", "SOLD"] };
    query.endsAt = { $gt: now };
  } else if (status === "ending") {
    query.status = { $nin: ["CANCELLED", "SOLD"] };
    query.endsAt = {
      $gt: now,
      $lte: new Date(Date.now() + 24 * 60 * 60 * 1000),
    };
  } else if (status === "ended") {
    and.push({
      $or: [{ status: "ENDED" }, { status: "SOLD" }, { endsAt: { $lte: now } }],
    });
  }

  if (and.length) {
    query.$and = and;
  }

  return query;
}

export function buildListingSort(sort) {
  switch (sort) {
    case "newest":
      return { createdAt: -1 };
    case "price_asc":
      return { currentBid: 1 };
    case "price_desc":
      return { currentBid: -1 };
    case "popular":
      return { bidCount: -1 };
    case "ending":
    default:
      return { endsAt: 1 };
  }
}

function hydrateListings(docs) {
  return docs.map((listing) => applyComputedStatus(toListingDTO(listing)));
}

export async function getListings(filters = {}) {
  await connectDB();
  await syncEndedListings();
  const listings = await Listing.find(await buildListingQuery(filters))
    .populate("category")
    .populate("seller", "legalName licenceNumber")
    .populate("buyer", "legalName")
    .sort(buildListingSort(filters.sort))
    .lean();
  return hydrateListings(listings);
}

export async function getListingById(id) {
  await connectDB();
  if (!isValidId(id)) return null;
  await syncEndedListings();

  const listing = await Listing.findById(id)
    .populate("category")
    .populate("seller", "legalName licenceNumber")
    .populate("buyer", "legalName")
    .lean();
  if (!listing) return null;

  const bids = await Bid.find({ listing: listing._id })
    .populate("bidder", "legalName")
    .sort({ createdAt: -1 })
    .lean();

  return applyComputedStatus(
    toListingDTO(listing, {
      bids: bids.map(toBidDTO),
      bidCount: listing.bidCount ?? bids.length,
    }),
  );
}

export async function getCategories() {
  await connectDB();
  const categories = await Category.find().sort({ name: 1 }).lean();
  const counts = await Listing.aggregate([
    { $group: { _id: "$category", listings: { $sum: 1 } } },
  ]);
  const countMap = Object.fromEntries(
    counts.map((item) => [String(item._id), item.listings]),
  );

  return categories.map((category) => ({
    id: String(category._id),
    slug: category.slug,
    name: category.name,
    description: category.description,
    _count: { listings: countMap[String(category._id)] || 0 },
  }));
}

export async function getCategoryBySlug(slug) {
  await connectDB();
  const category = await Category.findOne({ slug }).lean();
  if (!category) return null;
  const listings = await Listing.countDocuments({ category: category._id });
  return {
    id: String(category._id),
    slug: category.slug,
    name: category.name,
    description: category.description,
    _count: { listings },
  };
}

export async function getFeaturedListings() {
  await connectDB();
  await syncEndedListings();
  const listings = await Listing.find({
    status: { $nin: ["CANCELLED", "SOLD"] },
    endsAt: { $gt: new Date() },
  })
    .populate("category")
    .populate("seller", "legalName licenceNumber")
    .populate("buyer", "legalName")
    .sort({ currentBid: -1 })
    .limit(4)
    .lean();
  return hydrateListings(listings);
}

export async function getEndingSoonListings() {
  await connectDB();
  await syncEndedListings();
  const listings = await Listing.find({
    status: { $nin: ["CANCELLED", "SOLD"] },
    endsAt: { $gt: new Date() },
  })
    .populate("category")
    .populate("seller", "legalName licenceNumber")
    .populate("buyer", "legalName")
    .sort({ endsAt: 1 })
    .limit(4)
    .lean();
  return hydrateListings(listings).map((listing) => ({
    ...listing,
    isEndingSoon: endingSoon(listing),
  }));
}

export async function getHighestBid(listingId) {
  await connectDB();
  if (!isValidId(listingId)) return null;
  const bid = await Bid.findOne({ listing: listingId })
    .sort({ amount: -1 })
    .populate("bidder", "legalName")
    .lean();
  return bid ? toBidDTO(bid) : null;
}

export async function isWatching(userId, listingId) {
  await connectDB();
  if (!userId || !isValidId(listingId)) return false;
  return Boolean(await Watch.exists({ user: userId, listing: listingId }));
}

export async function getDashboardData(userId) {
  await connectDB();
  const [listings, bids, watches] = await Promise.all([
    Listing.find({ seller: userId })
      .populate("category")
      .populate("seller", "legalName licenceNumber")
      .populate("buyer", "legalName")
      .sort({ createdAt: -1 })
      .lean(),
    Bid.find({ bidder: userId })
      .populate({
        path: "listing",
        populate: [
          { path: "category" },
          { path: "seller", select: "legalName licenceNumber" },
        ],
      })
      .sort({ createdAt: -1 })
      .lean(),
    Watch.find({ user: userId })
      .populate({
        path: "listing",
        populate: [
          { path: "category" },
          { path: "seller", select: "legalName licenceNumber" },
        ],
      })
      .sort({ createdAt: -1 })
      .lean(),
  ]);

  return {
    listings: hydrateListings(listings),
    bids: bids.map((bid) => ({
      id: String(bid._id),
      amount: bid.amount,
      listingId: String(bid.listing?._id || bid.listing),
      listing: applyComputedStatus(toListingDTO(bid.listing)),
    })),
    watches: watches.map((watch) => ({
      id: String(watch._id),
      listing: applyComputedStatus(toListingDTO(watch.listing)),
    })),
  };
}

export function canPurchaseListing(user, listing, highestBid) {
  if (!user || !listing) return false;
  if (user.id === listing.sellerId) return false;
  const status = listing.computedStatus || getAuctionStatus(listing);
  if (status === "LIVE") return true;
  if (status === "ENDED" && highestBid?.bidder?.id === user.id) return true;
  return false;
}
