import { execute, insert, query, queryOne } from "./db";
import { listingFromRow, toBidDTO, toListingDTO, toUserDTO } from "./serialize";

const LISTING_SELECT = `
  SELECT
    l.*,
    c.slug AS "categorySlug",
    c.name AS "categoryName",
    c.description AS "categoryDescription",
    seller.legal_name AS "sellerName",
    seller.licence_number AS "sellerLicence",
    buyer.legal_name AS "buyerName"
  FROM listings l
  INNER JOIN categories c ON c.id = l.category_id
  INNER JOIN users seller ON seller.id = l.seller_id
  LEFT JOIN users buyer ON buyer.id = l.buyer_id
`;

export async function findUserById(id) {
  const user = await queryOne("SELECT * FROM users WHERE id = ?", [id]);
  if (!user) return null;
  return { ...toUserDTO(user), passwordHash: user.passwordHash };
}

export async function findUserByLicence(licenceNumber) {
  const user = await queryOne("SELECT * FROM users WHERE licence_number = ?", [
    licenceNumber,
  ]);
  if (!user) return null;
  return { ...toUserDTO(user), passwordHash: user.passwordHash };
}

export async function findUserByLicenceOrPhone(licenceNumber, phone) {
  const user = await queryOne(
    "SELECT * FROM users WHERE licence_number = ? OR phone = ?",
    [licenceNumber, phone],
  );
  if (!user) return null;
  return { ...toUserDTO(user), passwordHash: user.passwordHash };
}

export async function createUser(data) {
  const id = await insert(
    `INSERT INTO users (legal_name, licence_number, phone, password_hash, role, account_kind, contact_name, city)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.legalName,
      data.licenceNumber,
      data.phone,
      data.passwordHash,
      data.role || "BUYER",
      data.accountKind || null,
      data.contactName || "",
      data.city || "",
    ],
  );
  return findUserById(id).then((user) => toUserDTO(user));
}

export async function findCategoryById(id) {
  const category = await queryOne("SELECT * FROM categories WHERE id = ?", [id]);
  if (!category) return null;
  return { id: String(category.id), ...category };
}

export async function findCategoryBySlug(slug) {
  return queryOne("SELECT * FROM categories WHERE slug = ?", [slug]);
}

export async function findListingById(id) {
  const listing = await queryOne(`${LISTING_SELECT} WHERE l.id = ?`, [id]);
  return toListingDTO(listingFromRow(listing));
}

export async function createListing(data) {
  const id = await insert(
    `INSERT INTO listings (
      title, description, images, starting_bid, current_bid, bid_increment, reserve_price,
      condition, location, status, starts_at, ends_at, category_id, seller_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, COALESCE(?, NOW()), ?, ?, ?)`,
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
      data.status || "LIVE",
      data.startsAt || null,
      data.endsAt,
      data.categoryId,
      data.sellerId,
    ],
  );
  return { id: String(id) };
}

export async function countBids(listingId) {
  const row = await queryOne(
    "SELECT COUNT(*) AS count FROM bids WHERE listing_id = ?",
    [listingId],
  );
  return Number(row?.count || 0);
}

export async function cancelListing(listingId) {
  await execute("UPDATE listings SET status = 'CANCELLED' WHERE id = ?", [
    listingId,
  ]);
}

export async function updateListingBid(listingId, userId, amount) {
  const result = await execute(
    `UPDATE listings
     SET current_bid = ?, last_bid_at = NOW(), bid_count = bid_count + 1
     WHERE id = ?
       AND seller_id <> ?
       AND status = 'LIVE'
       AND ends_at > NOW()
       AND current_bid <= ?`,
    [amount, listingId, userId, amount],
  );
  return Boolean(result.affectedRows);
}

export async function insertBid({ amount, listingId, bidderId }) {
  await insert(
    "INSERT INTO bids (amount, listing_id, bidder_id) VALUES (?, ?, ?)",
    [amount, listingId, bidderId],
  );
}

export async function findHighestBid(listingId) {
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

export async function findWatch(userId, listingId) {
  return queryOne("SELECT * FROM watches WHERE user_id = ? AND listing_id = ?", [
    userId,
    listingId,
  ]);
}

export async function insertWatch(userId, listingId) {
  await insert("INSERT INTO watches (user_id, listing_id) VALUES (?, ?)", [
    userId,
    listingId,
  ]);
  await execute(
    "UPDATE listings SET watch_count = watch_count + 1 WHERE id = ?",
    [listingId],
  );
}

export async function deleteWatch(userId, listingId) {
  const result = await execute(
    "DELETE FROM watches WHERE user_id = ? AND listing_id = ?",
    [userId, listingId],
  );
  if (result.affectedRows) {
    await execute(
      "UPDATE listings SET watch_count = GREATEST(watch_count - 1, 0) WHERE id = ?",
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
     SET status = 'SOLD', buyer_id = ?, paid_at = NOW(), paid_amount = ?, payment_method = ?
     WHERE id = ?
       AND seller_id <> ?
       AND status NOT IN ('CANCELLED', 'SOLD')`,
    [userId, amount, paymentMethod, listingId, userId],
  );
  return Boolean(result.affectedRows);
}

export async function insertPayment(data) {
  await insert(
    `INSERT INTO payments (amount, method, reference, payer_name, payer_phone, last4, listing_id, buyer_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
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
}

export { LISTING_SELECT };
