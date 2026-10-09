import { query, queryOne, execute } from "./db";
import { endingSoon, effectiveEndsAt, getAuctionStatus, parseImages } from "./format";
import { LISTING_SELECT, findCategoryBySlug } from "./models";
import { isValidId, listingFromRow, toBidDTO, toListingDTO } from "./serialize";

function applyComputedStatus(listing) {
  return { ...listing, computedStatus: getAuctionStatus(listing) };
}

function hydrateListings(rows) {
  return rows.map((row) => applyComputedStatus(toListingDTO(listingFromRow(row))));
}

const OPEN_LOT_SQL = `l.status = 'LIVE' AND l.ends_at > NOW() AND l.starts_at <= NOW()`;

export async function syncEndedListings() {
  await execute(
    "UPDATE listings SET status = 'LIVE' WHERE status = 'ENDED' AND ends_at > NOW()",
  );
  await execute(
    "UPDATE listings SET status = 'ENDED' WHERE status = 'LIVE' AND ends_at <= NOW()",
  );
}

export async function buildListingQuery(filters = {}) {
  const where = [];
  const params = [];
  const nowOpen = OPEN_LOT_SQL;

  if (filters.q) {
    where.push("(l.title ILIKE ? OR l.description ILIKE ? OR l.location ILIKE ?)");
    const like = `%${filters.q}%`;
    params.push(like, like, like);
  }

  if (filters.minPrice) {
    where.push("l.current_bid >= ?");
    params.push(Number(filters.minPrice));
  }

  if (filters.maxPrice) {
    where.push("l.current_bid <= ?");
    params.push(Number(filters.maxPrice));
  }

  if (filters.location && filters.location !== "all") {
    where.push("l.location = ?");
    params.push(filters.location);
  }

  if (filters.sellerId && isValidId(filters.sellerId)) {
    where.push("l.seller_id = ?");
    params.push(filters.sellerId);
  }

  if (filters.categoryId && isValidId(filters.categoryId)) {
    where.push("l.category_id = ?");
    params.push(filters.categoryId);
  } else if (filters.categorySlug) {
    const category = await findCategoryBySlug(filters.categorySlug);
    if (category) {
      where.push("l.category_id = ?");
      params.push(category.id);
    } else {
      where.push("1 = 0");
    }
  }

  if (filters.status === "live") {
    where.push(nowOpen);
  } else if (filters.status === "ending") {
    where.push(nowOpen);
    where.push("l.ends_at <= NOW() + INTERVAL '24 hours'");
  } else if (filters.status === "ended") {
    where.push("(l.status IN ('ENDED', 'SOLD') OR l.ends_at <= NOW())");
  }

  return {
    where: where.length ? `WHERE ${where.join(" AND ")}` : "",
    params,
  };
}

export function buildListingSort(sort) {
  switch (sort) {
    case "newest":
      return "l.created_at DESC";
    case "price_asc":
      return "l.current_bid ASC";
    case "price_desc":
      return "l.current_bid DESC";
    case "popular":
      return "l.bid_count DESC";
    case "ending":
    default:
      return "l.ends_at ASC";
  }
}

export async function getListings(filters = {}) {
  await syncEndedListings();
  const { where, params } = await buildListingQuery(filters);
  const rows = await query(
    `${LISTING_SELECT} ${where} ORDER BY ${buildListingSort(filters.sort)}`,
    params,
  );
  return hydrateListings(rows);
}

export async function getListingById(id) {
  if (!isValidId(id)) return null;
  await syncEndedListings();
  const listing = await queryOne(`${LISTING_SELECT} WHERE l.id = ?`, [id]);
  if (!listing) return null;

  const bids = await query(
    `SELECT b.*, u.id AS "bidderId", u.legal_name AS "bidderName"
     FROM bids b
     INNER JOIN users u ON u.id = b.bidder_id
     WHERE b.listing_id = ?
     ORDER BY b.created_at DESC`,
    [id],
  );

  return applyComputedStatus(
    toListingDTO(listingFromRow(listing), {
      bids: bids.map(toBidDTO),
      bidCount: listing.bidCount ?? bids.length,
    }),
  );
}

function supplierFromUser(user, stats) {
  return {
    id: String(user.id),
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
  const users = await query(
    `SELECT id, legal_name, role, account_kind, contact_name, city
     FROM users
     WHERE role IN ('SELLER', 'BOTH')
     ORDER BY legal_name ASC`,
  );
  const listings = await query(
    "SELECT seller_id, images, location FROM listings ORDER BY created_at DESC",
  );
  const stats = new Map();
  for (const listing of listings) {
    const id = String(listing.sellerId);
    if (!stats.has(id)) stats.set(id, { count: 0, image: "", location: "" });
    const row = stats.get(id);
    row.count += 1;
    if (!row.image) row.image = parseImages(listing.images)[0] || "";
    if (!row.location && listing.location) row.location = listing.location;
  }
  return users.map((user) =>
    supplierFromUser(user, stats.get(String(user.id)) || { count: 0, image: "", location: "" }),
  );
}

export async function getSupplier(id) {
  if (!isValidId(id)) return null;
  const user = await queryOne(
    `SELECT id, legal_name, role, account_kind, contact_name, city
     FROM users
     WHERE id = ? AND role IN ('SELLER', 'BOTH')`,
    [id],
  );
  if (!user) return null;
  const listings = await query(
    "SELECT images, location FROM listings WHERE seller_id = ? ORDER BY created_at DESC",
    [id],
  );
  const image = listings.map((listing) => parseImages(listing.images)[0]).find(Boolean) || "";
  const location = listings.find((listing) => listing.location)?.location || "";
  return supplierFromUser(user, { count: listings.length, image, location });
}

export async function getCategories() {
  const categories = await query("SELECT * FROM categories ORDER BY name ASC");
  const counts = await query(
    "SELECT category_id, COUNT(*) AS listings FROM listings GROUP BY category_id",
  );
  const countMap = Object.fromEntries(
    counts.map((item) => [String(item.categoryId), Number(item.listings)]),
  );

  return categories.map((category) => ({
    id: String(category.id),
    slug: category.slug,
    name: category.name,
    description: category.description,
    _count: { listings: countMap[String(category.id)] || 0 },
  }));
}

export async function getCategoryBySlug(slug) {
  const category = await findCategoryBySlug(slug);
  if (!category) return null;
  const row = await queryOne(
    "SELECT COUNT(*) AS listings FROM listings WHERE category_id = ?",
    [category.id],
  );
  return {
    id: String(category.id),
    slug: category.slug,
    name: category.name,
    description: category.description,
    _count: { listings: Number(row?.listings || 0) },
  };
}

export async function getFeaturedListings() {
  await syncEndedListings();
  const rows = await query(
    `${LISTING_SELECT} WHERE ${OPEN_LOT_SQL} ORDER BY l.current_bid DESC LIMIT 4`,
  );
  return hydrateListings(rows);
}

export async function getScheduledListings() {
  const rows = await query(
    `${LISTING_SELECT}
     WHERE l.status NOT IN ('CANCELLED', 'SOLD', 'ENDED') AND l.starts_at > NOW()
     ORDER BY l.starts_at ASC`,
  );
  return hydrateListings(rows);
}

export async function getEndingSoonListings() {
  await syncEndedListings();
  const rows = await query(`${LISTING_SELECT} WHERE ${OPEN_LOT_SQL}`);
  return hydrateListings(rows)
    .sort((a, b) => effectiveEndsAt(a) - effectiveEndsAt(b))
    .slice(0, 4)
    .map((listing) => ({
      ...listing,
      isEndingSoon: endingSoon(listing),
    }));
}

export async function getHighestBid(listingId) {
  if (!isValidId(listingId)) return null;
  const bid = await queryOne(
    `SELECT b.*, u.id AS "bidderId", u.legal_name AS "bidderName"
     FROM bids b
     INNER JOIN users u ON u.id = b.bidder_id
     WHERE b.listing_id = ?
     ORDER BY b.amount DESC, b.created_at ASC
     LIMIT 1`,
    [listingId],
  );
  return bid ? toBidDTO(bid) : null;
}

export async function isWatching(userId, listingId) {
  if (!userId || !isValidId(listingId)) return false;
  const row = await queryOne(
    "SELECT id FROM watches WHERE user_id = ? AND listing_id = ? LIMIT 1",
    [userId, listingId],
  );
  return Boolean(row);
}

export async function getDashboardData(userId) {
  const [listings, bids, watches] = await Promise.all([
    query(`${LISTING_SELECT} WHERE l.seller_id = ? ORDER BY l.created_at DESC`, [userId]),
    query(
      `SELECT b.id AS "bidRowId", b.amount AS "bidAmount", b.listing_id,
              l.*, c.slug AS "categorySlug", c.name AS "categoryName", c.description AS "categoryDescription",
              seller.legal_name AS "sellerName", seller.licence_number AS "sellerLicence",
              buyer.legal_name AS "buyerName"
       FROM bids b
       INNER JOIN listings l ON l.id = b.listing_id
       INNER JOIN categories c ON c.id = l.category_id
       INNER JOIN users seller ON seller.id = l.seller_id
       LEFT JOIN users buyer ON buyer.id = l.buyer_id
       WHERE b.bidder_id = ?
       ORDER BY b.created_at DESC`,
      [userId],
    ),
    query(
      `SELECT w.id AS "watchRowId",
              l.*, c.slug AS "categorySlug", c.name AS "categoryName", c.description AS "categoryDescription",
              seller.legal_name AS "sellerName", seller.licence_number AS "sellerLicence",
              buyer.legal_name AS "buyerName"
       FROM watches w
       INNER JOIN listings l ON l.id = w.listing_id
       INNER JOIN categories c ON c.id = l.category_id
       INNER JOIN users seller ON seller.id = l.seller_id
       LEFT JOIN users buyer ON buyer.id = l.buyer_id
       WHERE w.user_id = ?
       ORDER BY w.created_at DESC`,
      [userId],
    ),
  ]);

  return {
    listings: hydrateListings(listings),
    bids: bids.map((bid) => ({
      id: String(bid.bidRowId),
      amount: Number(bid.bidAmount),
      listingId: String(bid.listingId),
      listing: applyComputedStatus(toListingDTO(listingFromRow(bid))),
    })),
    watches: watches.map((watch) => ({
      id: String(watch.watchRowId),
      listing: applyComputedStatus(toListingDTO(listingFromRow(watch))),
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
