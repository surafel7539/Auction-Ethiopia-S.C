import { connectDB } from "./db";
import { endingSoon, effectiveEndsAt, getAuctionStatus, parseImages } from "./format";
import { Bid, Category, Listing, User, Watch } from "./models";
import { isValidId, toBidDTO, toListingDTO } from "./serialize";

function applyComputedStatus(listing) {
  return { ...listing, computedStatus: getAuctionStatus(listing) };
}

function openLotFilter(now = new Date()) {
  return {
    status: "LIVE",
    endsAt: { $gt: now },
    startsAt: { $not: { $gt: now } },
  };
}

const listingPopulate = [
  { path: "category" },
  { path: "seller", select: "legalName licenceNumber" },
  { path: "buyer", select: "legalName" },
];

export async function syncEndedListings() {
  await connectDB();
  const now = new Date();
  await Listing.updateMany(
    { status: "ENDED", endsAt: { $gt: now } },
    { $set: { status: "LIVE" } },
  );
  await Listing.updateMany(
    { status: "LIVE", endsAt: { $lte: now } },
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
  sellerId,
}) {
  const query = {};
  const and = [];
  const now = new Date();

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

  if (sellerId && isValidId(sellerId)) {
    query.seller = sellerId;
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

  if (status === "live") {
    Object.assign(query, openLotFilter(now));
  } else if (status === "ending") {
    const soon = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    Object.assign(query, openLotFilter(now));
    query.endsAt = { $gt: now, $lte: soon };
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
    .populate(listingPopulate)
    .sort(buildListingSort(filters.sort))
    .lean();
  return hydrateListings(listings);
}

export async function getListingById(id) {
  await connectDB();
  if (!isValidId(id)) return null;
  await syncEndedListings();

  const listing = await Listing.findById(id).populate(listingPopulate).lean();
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

function supplierFromUser(user, stats) {
  return {
    id: String(user._id),
    name: user.legalName,
    role: user.role,
    accountKind: user.accountKind === "ORGANISATION" ? "ORGANISATION" : "INDIVIDUAL",
    contactName: user.contactName || "",
    city: user.city || stats.location || "",
    lotCount: stats.count,
    image: stats.image,
  };
}

export async function getSuppliers() {
  await connectDB();
  const users = await User.find({ role: { $in: ["SELLER", "BOTH"] } })
    .select("legalName role accountKind contactName city")
    .sort({ legalName: 1 })
    .lean();
  const listings = await Listing.find()
    .select("seller images location")
    .sort({ createdAt: -1 })
    .lean();
  const stats = new Map();
  for (const listing of listings) {
    const id = String(listing.seller);
    if (!stats.has(id)) stats.set(id, { count: 0, image: "", location: "" });
    const row = stats.get(id);
    row.count += 1;
    if (!row.image) row.image = parseImages(listing.images)[0] || "";
    if (!row.location && listing.location) row.location = listing.location;
  }
  return users.map((user) =>
    supplierFromUser(user, stats.get(String(user._id)) || { count: 0, image: "", location: "" }),
  );
}

export async function getSupplier(id) {
  await connectDB();
  if (!isValidId(id)) return null;
  const user = await User.findOne({ _id: id, role: { $in: ["SELLER", "BOTH"] } })
    .select("legalName role accountKind contactName city")
    .lean();
  if (!user) return null;
  const listings = await Listing.find({ seller: user._id })
    .select("images location")
    .sort({ createdAt: -1 })
    .lean();
  const image = listings.map((listing) => parseImages(listing.images)[0]).find(Boolean) || "";
  const location = listings.find((listing) => listing.location)?.location || "";
  return supplierFromUser(user, { count: listings.length, image, location });
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
  const listings = await Listing.find(openLotFilter())
    .populate(listingPopulate)
    .sort({ currentBid: -1 })
    .limit(4)
    .lean();
  return hydrateListings(listings);
}

export async function getScheduledListings() {
  await connectDB();
  const now = new Date();
  const listings = await Listing.find({
    status: { $nin: ["CANCELLED", "SOLD", "ENDED"] },
    startsAt: { $gt: now },
  })
    .populate(listingPopulate)
    .sort({ startsAt: 1 })
    .lean();
  return hydrateListings(listings);
}

export async function getEndingSoonListings() {
  await connectDB();
  await syncEndedListings();
  const listings = await Listing.find(openLotFilter())
    .populate(listingPopulate)
    .lean();
  return hydrateListings(listings)
    .sort((a, b) => effectiveEndsAt(a) - effectiveEndsAt(b))
    .slice(0, 4)
    .map((listing) => ({
      ...listing,
      isEndingSoon: endingSoon(listing),
    }));
}

export async function getHighestBid(listingId) {
  await connectDB();
  if (!isValidId(listingId)) return null;
  const bid = await Bid.findOne({ listing: listingId })
    .sort({ amount: -1, createdAt: 1 })
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
      .populate(listingPopulate)
      .sort({ createdAt: -1 })
      .lean(),
    Bid.find({ bidder: userId })
      .populate({
        path: "listing",
        populate: listingPopulate,
      })
      .sort({ createdAt: -1 })
      .lean(),
    Watch.find({ user: userId })
      .populate({
        path: "listing",
        populate: listingPopulate,
      })
      .sort({ createdAt: -1 })
      .lean(),
  ]);

  return {
    listings: hydrateListings(listings),
    bids: bids
      .filter((bid) => bid.listing)
      .map((bid) => ({
        id: String(bid._id),
        amount: bid.amount,
        listingId: String(bid.listing._id),
        listing: applyComputedStatus(toListingDTO(bid.listing)),
      })),
    watches: watches
      .filter((watch) => watch.listing)
      .map((watch) => ({
        id: String(watch._id),
        listing: applyComputedStatus(toListingDTO(watch.listing)),
      })),
  };
}

export function canPurchaseListing(user, listing, highestBid) {
  if (!user || !listing) return false;
  if (user.id === listing.sellerId) return false;
  const status = listing.computedStatus || getAuctionStatus(listing);
  if (status === "ENDED" && highestBid?.bidder?.id === user.id) return true;
  return false;
}
