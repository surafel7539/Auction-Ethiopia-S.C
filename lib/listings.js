import { query } from "./db";
import {
  LISTING_SELECT,
  findCategoryBySlug,
  findHighestBid as findHighestBidRow,
  findListingById,
  findWatch,
  mapBid,
  mapListing,
} from "./models";
import { endingSoon, getAuctionStatus } from "./format";
import { isValidId, toBidDTO, toListingDTO } from "./serialize";

function applyComputedStatus(listing) {
  return { ...listing, computedStatus: getAuctionStatus(listing) };
}

function like(value) {
  return `%${String(value).replace(/[%_\\]/g, "\\$&")}%`;
}

const OPEN_LOT = `
  l.status = 'LIVE'
  AND l.endsAt > NOW()
  AND (
    l.bidCount = 0
    OR l.lastBidAt IS NULL
    OR l.lastBidAt > DATE_SUB(NOW(), INTERVAL 2 HOUR)
  )
`;

export async function syncEndedListings() {
  await query(
    `UPDATE listings
     SET status = 'ENDED'
     WHERE status = 'LIVE'
       AND (
         endsAt <= NOW()
         OR (
           bidCount > 0
           AND lastBidAt IS NOT NULL
           AND lastBidAt <= DATE_SUB(NOW(), INTERVAL 2 HOUR)
         )
       )`,
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
  const clauses = [];
  const params = [];

  if (q) {
    const pattern = like(q);
    clauses.push(
      "(l.title LIKE ? OR l.description LIKE ? OR l.location LIKE ?)",
    );
    params.push(pattern, pattern, pattern);
  }

  if (minPrice) {
    clauses.push("l.currentBid >= ?");
    params.push(Number(minPrice));
  }

  if (maxPrice) {
    clauses.push("l.currentBid <= ?");
    params.push(Number(maxPrice));
  }

  if (location && location !== "all") {
    clauses.push("l.location = ?");
    params.push(location);
  }

  if (categoryId && isValidId(categoryId)) {
    clauses.push("l.categoryId = ?");
    params.push(Number(categoryId));
  } else if (categorySlug) {
    const category = await findCategoryBySlug(categorySlug);
    if (category) {
      clauses.push("l.categoryId = ?");
      params.push(Number(category.id));
    } else {
      clauses.push("1 = 0");
    }
  }

  if (status === "live") {
    clauses.push(OPEN_LOT);
  } else if (status === "ending") {
    clauses.push(OPEN_LOT);
    clauses.push(
      `LEAST(
        l.endsAt,
        IF(l.bidCount > 0 AND l.lastBidAt IS NOT NULL, DATE_ADD(l.lastBidAt, INTERVAL 2 HOUR), l.endsAt)
      ) <= DATE_ADD(NOW(), INTERVAL 24 HOUR)`,
    );
  } else if (status === "ended") {
    clauses.push(
      `(l.status IN ('ENDED', 'SOLD')
        OR l.endsAt <= NOW()
        OR (
          l.bidCount > 0
          AND l.lastBidAt IS NOT NULL
          AND l.lastBidAt <= DATE_SUB(NOW(), INTERVAL 2 HOUR)
        ))`,
    );
  }

  return {
    where: clauses.length ? `WHERE ${clauses.join(" AND ")}` : "",
    params,
  };
}

export function buildListingSort(sort) {
  switch (sort) {
    case "newest":
      return "l.createdAt DESC";
    case "price_asc":
      return "l.currentBid ASC";
    case "price_desc":
      return "l.currentBid DESC";
    case "popular":
      return "l.bidCount DESC";
    case "ending":
    default:
      return "l.endsAt ASC";
  }
}

function hydrateListings(rows) {
  return rows
    .map(mapListing)
    .map((listing) => applyComputedStatus(toListingDTO(listing)));
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

  const listing = await findListingById(id);
  if (!listing) return null;

  const bids = await query(
    `SELECT b.*, u.legalName AS bidder_name
     FROM bids b
     LEFT JOIN users u ON u.id = b.bidderId
     WHERE b.listingId = ?
     ORDER BY b.createdAt DESC`,
    [id],
  );

  return applyComputedStatus(
    toListingDTO(listing, {
      bids: bids.map((row) => toBidDTO(mapBid(row))),
      bidCount: listing.bidCount ?? bids.length,
    }),
  );
}

export async function getCategories() {
  const categories = await query(
    "SELECT * FROM categories ORDER BY name ASC",
  );
  const counts = await query(
    "SELECT categoryId, COUNT(*) AS listings FROM listings GROUP BY categoryId",
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
  const rows = await query(
    "SELECT COUNT(*) AS listings FROM listings WHERE categoryId = ?",
    [category.id],
  );
  return {
    ...category,
    _count: { listings: Number(rows[0]?.listings || 0) },
  };
}

export async function getFeaturedListings() {
  await syncEndedListings();
  const rows = await query(
    `${LISTING_SELECT}
     WHERE ${OPEN_LOT}
     ORDER BY l.currentBid DESC
     LIMIT 4`,
  );
  return hydrateListings(rows);
}

export async function getEndingSoonListings() {
  await syncEndedListings();
  const rows = await query(
    `${LISTING_SELECT}
     WHERE ${OPEN_LOT}
     ORDER BY LEAST(
       l.endsAt,
       IF(l.bidCount > 0 AND l.lastBidAt IS NOT NULL, DATE_ADD(l.lastBidAt, INTERVAL 2 HOUR), l.endsAt)
     ) ASC
     LIMIT 4`,
  );
  return hydrateListings(rows).map((listing) => ({
    ...listing,
    isEndingSoon: endingSoon(listing),
  }));
}

export async function getHighestBid(listingId) {
  if (!isValidId(listingId)) return null;
  const bid = await findHighestBidRow(listingId);
  return bid ? toBidDTO(bid) : null;
}

export async function isWatching(userId, listingId) {
  if (!userId || !isValidId(listingId)) return false;
  return Boolean(await findWatch(userId, listingId));
}

export async function getDashboardData(userId) {
  const [listings, bids, watches] = await Promise.all([
    query(
      `${LISTING_SELECT} WHERE l.sellerId = ? ORDER BY l.createdAt DESC`,
      [userId],
    ),
    query(
      `SELECT
        b.*,
        u.legalName AS bidder_name,
        l.id AS listingId,
        l.title AS listing_title,
        l.description AS listing_description,
        l.images AS listing_images,
        l.startingBid AS listing_startingBid,
        l.currentBid AS listing_currentBid,
        l.bidIncrement AS listing_bidIncrement,
        l.reservePrice AS listing_reservePrice,
        l.\`condition\` AS listing_condition,
        l.location AS listing_location,
        l.status AS listing_status,
        l.startsAt AS listing_startsAt,
        l.endsAt AS listing_endsAt,
        l.lastBidAt AS listing_lastBidAt,
        l.createdAt AS listing_createdAt,
        l.categoryId AS listing_categoryId,
        l.sellerId AS listing_sellerId,
        l.buyerId AS listing_buyerId,
        l.paidAt AS listing_paidAt,
        l.paidAmount AS listing_paidAmount,
        l.paymentMethod AS listing_paymentMethod,
        l.bidCount AS listing_bidCount,
        l.watchCount AS listing_watchCount,
        c.id AS category_id,
        c.slug AS category_slug,
        c.name AS category_name,
        c.description AS category_description,
        s.id AS seller_id,
        s.legalName AS seller_name,
        s.licenceNumber AS seller_licence
       FROM bids b
       LEFT JOIN users u ON u.id = b.bidderId
       LEFT JOIN listings l ON l.id = b.listingId
       LEFT JOIN categories c ON c.id = l.categoryId
       LEFT JOIN users s ON s.id = l.sellerId
       WHERE b.bidderId = ?
       ORDER BY b.createdAt DESC`,
      [userId],
    ),
    query(
      `SELECT
        w.id,
        w.listingId,
        l.title AS listing_title,
        l.description AS listing_description,
        l.images AS listing_images,
        l.startingBid AS listing_startingBid,
        l.currentBid AS listing_currentBid,
        l.bidIncrement AS listing_bidIncrement,
        l.reservePrice AS listing_reservePrice,
        l.\`condition\` AS listing_condition,
        l.location AS listing_location,
        l.status AS listing_status,
        l.startsAt AS listing_startsAt,
        l.endsAt AS listing_endsAt,
        l.lastBidAt AS listing_lastBidAt,
        l.createdAt AS listing_createdAt,
        l.categoryId AS listing_categoryId,
        l.sellerId AS listing_sellerId,
        l.buyerId AS listing_buyerId,
        l.paidAt AS listing_paidAt,
        l.paidAmount AS listing_paidAmount,
        l.paymentMethod AS listing_paymentMethod,
        l.bidCount AS listing_bidCount,
        l.watchCount AS listing_watchCount,
        c.id AS category_id,
        c.slug AS category_slug,
        c.name AS category_name,
        c.description AS category_description,
        s.id AS seller_id,
        s.legalName AS seller_name,
        s.licenceNumber AS seller_licence
       FROM watches w
       LEFT JOIN listings l ON l.id = w.listingId
       LEFT JOIN categories c ON c.id = l.categoryId
       LEFT JOIN users s ON s.id = l.sellerId
       WHERE w.userId = ?
       ORDER BY w.createdAt DESC`,
      [userId],
    ),
  ]);

  return {
    listings: hydrateListings(listings),
    bids: bids.map((row) => {
      const bid = mapBid(row);
      return {
        id: bid.id,
        amount: bid.amount,
        listingId: bid.listingId,
        listing: applyComputedStatus(toListingDTO(bid.listing)),
      };
    }),
    watches: watches.map((row) => ({
      id: String(row.id),
      listing: applyComputedStatus(
        toListingDTO(
          mapBid({
            ...row,
            listingId: row.listingId,
            listing_title: row.listing_title,
          }).listing,
        ),
      ),
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
