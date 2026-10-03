import { execute, query } from "./db";

function num(value) {
  if (value == null || value === "") return null;
  return Number(value);
}

export function mapUser(row) {
  if (!row) return null;
  return {
    id: String(row.id),
    legalName: row.legalName,
    licenceNumber: row.licenceNumber,
    phone: row.phone,
    passwordHash: row.passwordHash,
    role: row.role,
    createdAt: row.createdAt,
  };
}

export function mapCategory(row) {
  if (!row) return null;
  return {
    id: String(row.id),
    slug: row.slug,
    name: row.name,
    description: row.description || "",
  };
}

export function mapListing(row) {
  if (!row) return null;
  const categoryId = row.category_id ?? row.categoryId;
  const sellerId = row.seller_id ?? row.sellerId;
  const buyerId = row.buyer_id ?? row.buyerId;
  return {
    id: String(row.id),
    title: row.title,
    description: row.description,
    images: row.images,
    startingBid: num(row.startingBid),
    currentBid: num(row.currentBid),
    bidIncrement: num(row.bidIncrement),
    reservePrice: num(row.reservePrice),
    condition: row.condition,
    location: row.location,
    status: row.status,
    startsAt: row.startsAt,
    endsAt: row.endsAt,
    lastBidAt: row.lastBidAt || null,
    createdAt: row.createdAt,
    categoryId: categoryId != null ? String(categoryId) : "",
    sellerId: sellerId != null ? String(sellerId) : "",
    buyerId: buyerId != null ? String(buyerId) : "",
    paidAt: row.paidAt || null,
    paidAmount: num(row.paidAmount),
    paymentMethod: row.paymentMethod || "",
    bidCount: Number(row.bidCount || 0),
    watchCount: Number(row.watchCount || 0),
    category: categoryId
      ? {
          id: String(categoryId),
          slug: row.category_slug || "",
          name: row.category_name || "",
          description: row.category_description || "",
        }
      : null,
    seller: sellerId
      ? {
          id: String(sellerId),
          legalName: row.seller_name || "",
          licenceNumber: row.seller_licence || "",
        }
      : null,
    buyer: buyerId
      ? {
          id: String(buyerId),
          legalName: row.buyer_name || "",
        }
      : null,
  };
}

export function mapBid(row) {
  if (!row) return null;
  return {
    id: String(row.id),
    amount: num(row.amount),
    createdAt: row.createdAt,
    listingId: String(row.listingId || row.listing_id || ""),
    listing: row.listing_title
      ? mapListing({
          id: row.listingId,
          title: row.listing_title,
          description: row.listing_description,
          images: row.listing_images,
          startingBid: row.listing_startingBid,
          currentBid: row.listing_currentBid,
          bidIncrement: row.listing_bidIncrement,
          reservePrice: row.listing_reservePrice,
          condition: row.listing_condition,
          location: row.listing_location,
          status: row.listing_status,
          startsAt: row.listing_startsAt,
          endsAt: row.listing_endsAt,
          lastBidAt: row.listing_lastBidAt,
          createdAt: row.listing_createdAt,
          categoryId: row.listing_categoryId,
          sellerId: row.listing_sellerId,
          buyerId: row.listing_buyerId,
          paidAt: row.listing_paidAt,
          paidAmount: row.listing_paidAmount,
          paymentMethod: row.listing_paymentMethod,
          bidCount: row.listing_bidCount,
          watchCount: row.listing_watchCount,
          category_id: row.category_id,
          category_slug: row.category_slug,
          category_name: row.category_name,
          category_description: row.category_description,
          seller_id: row.seller_id,
          seller_name: row.seller_name,
          seller_licence: row.seller_licence,
        })
      : undefined,
    bidder: row.bidderId
      ? {
          id: String(row.bidderId),
          legalName: row.bidder_name || "",
        }
      : null,
  };
}

export const LISTING_SELECT = `
  SELECT
    l.*,
    c.id AS category_id,
    c.slug AS category_slug,
    c.name AS category_name,
    c.description AS category_description,
    s.id AS seller_id,
    s.legalName AS seller_name,
    s.licenceNumber AS seller_licence,
    buy.id AS buyer_id,
    buy.legalName AS buyer_name
  FROM listings l
  LEFT JOIN categories c ON c.id = l.categoryId
  LEFT JOIN users s ON s.id = l.sellerId
  LEFT JOIN users buy ON buy.id = l.buyerId
`;

export async function findUserById(id) {
  const rows = await query("SELECT * FROM users WHERE id = ?", [id]);
  return mapUser(rows[0]);
}

export async function findUserByLicence(licenceNumber) {
  const rows = await query("SELECT * FROM users WHERE licenceNumber = ?", [
    licenceNumber,
  ]);
  return mapUser(rows[0]);
}

export async function findUserByLicenceOrPhone(licenceNumber, phone) {
  const rows = await query(
    "SELECT * FROM users WHERE licenceNumber = ? OR phone = ? LIMIT 1",
    [licenceNumber, phone],
  );
  return mapUser(rows[0]);
}

export async function createUser({
  legalName,
  licenceNumber,
  phone,
  passwordHash,
  role,
}) {
  const result = await execute(
    `INSERT INTO users (legalName, licenceNumber, phone, passwordHash, role)
     VALUES (?, ?, ?, ?, ?)`,
    [legalName, licenceNumber, phone, passwordHash, role],
  );
  return findUserById(result.insertId);
}

export async function findCategoryById(id) {
  const rows = await query("SELECT * FROM categories WHERE id = ?", [id]);
  return mapCategory(rows[0]);
}

export async function findCategoryBySlug(slug) {
  const rows = await query("SELECT * FROM categories WHERE slug = ?", [slug]);
  return mapCategory(rows[0]);
}

export async function findListingById(id) {
  const rows = await query(`${LISTING_SELECT} WHERE l.id = ?`, [id]);
  return mapListing(rows[0]);
}

export async function createListing(data) {
  const result = await execute(
    `INSERT INTO listings (
      title, description, images, startingBid, currentBid, bidIncrement,
      reservePrice, \`condition\`, location, status, endsAt, categoryId, sellerId
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.title,
      data.description,
      data.images,
      data.startingBid,
      data.currentBid,
      data.bidIncrement,
      data.reservePrice,
      data.condition,
      data.location,
      data.status,
      data.endsAt,
      data.categoryId,
      data.sellerId,
    ],
  );
  return findListingById(result.insertId);
}

export async function countBids(listingId) {
  const rows = await query(
    "SELECT COUNT(*) AS total FROM bids WHERE listingId = ?",
    [listingId],
  );
  return Number(rows[0]?.total || 0);
}

export async function cancelListing(listingId) {
  await execute("UPDATE listings SET status = 'CANCELLED' WHERE id = ?", [
    listingId,
  ]);
}

export async function updateListingBid(listingId, userId, amount) {
  const result = await execute(
    `UPDATE listings
     SET currentBid = ?, bidCount = bidCount + 1, lastBidAt = NOW()
     WHERE id = ?
       AND sellerId <> ?
       AND status = 'LIVE'
       AND endsAt > NOW()
       AND (bidCount = 0 OR lastBidAt IS NULL OR lastBidAt > DATE_SUB(NOW(), INTERVAL 2 HOUR))
       AND currentBid <= ?`,
    [amount, listingId, userId, amount],
  );
  return result.affectedRows > 0;
}

export async function insertBid({ amount, listingId, bidderId }) {
  const result = await execute(
    "INSERT INTO bids (amount, listingId, bidderId) VALUES (?, ?, ?)",
    [amount, listingId, bidderId],
  );
  return result.insertId;
}

export async function findHighestBid(listingId) {
  const rows = await query(
    `SELECT b.*, u.legalName AS bidder_name
     FROM bids b
     LEFT JOIN users u ON u.id = b.bidderId
     WHERE b.listingId = ?
     ORDER BY b.amount DESC, b.createdAt ASC
     LIMIT 1`,
    [listingId],
  );
  return mapBid(rows[0]);
}

export async function findWatch(userId, listingId) {
  const rows = await query(
    "SELECT * FROM watches WHERE userId = ? AND listingId = ?",
    [userId, listingId],
  );
  return rows[0] || null;
}

export async function insertWatch(userId, listingId) {
  await execute("INSERT INTO watches (userId, listingId) VALUES (?, ?)", [
    userId,
    listingId,
  ]);
  await execute("UPDATE listings SET watchCount = watchCount + 1 WHERE id = ?", [
    listingId,
  ]);
}

export async function deleteWatch(userId, listingId) {
  const result = await execute(
    "DELETE FROM watches WHERE userId = ? AND listingId = ?",
    [userId, listingId],
  );
  if (result.affectedRows > 0) {
    await execute(
      "UPDATE listings SET watchCount = GREATEST(watchCount - 1, 0) WHERE id = ?",
      [listingId],
    );
  }
}

export async function markListingSold({
  listingId,
  userId,
  amount,
  paymentMethod,
}) {
  const result = await execute(
    `UPDATE listings
     SET status = 'SOLD',
         buyerId = ?,
         paidAt = NOW(),
         paidAmount = ?,
         paymentMethod = ?
     WHERE id = ?
       AND sellerId <> ?
       AND status NOT IN ('CANCELLED', 'SOLD')`,
    [userId, amount, paymentMethod, listingId, userId],
  );
  return result.affectedRows > 0;
}

export async function insertPayment(data) {
  const result = await execute(
    `INSERT INTO payments (
      amount, method, reference, payerName, payerPhone, last4, listingId, buyerId
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.amount,
      data.method,
      data.reference,
      data.payerName,
      data.payerPhone,
      data.last4,
      data.listingId,
      data.buyerId,
    ],
  );
  return result.insertId;
}
