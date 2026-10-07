import { execute, insert, query, queryOne } from "./db";
import { listingFromRow, toBidDTO, toListingDTO, toUserDTO } from "./serialize";

const LISTING_SELECT = `
  SELECT
    l.*,
    c.slug AS categorySlug,
    c.name AS categoryName,
    c.description AS categoryDescription,
    seller.legalName AS sellerName,
    seller.licenceNumber AS sellerLicence,
    buyer.legalName AS buyerName
  FROM listings l
  INNER JOIN categories c ON c.id = l.categoryId
  INNER JOIN users seller ON seller.id = l.sellerId
  LEFT JOIN users buyer ON buyer.id = l.buyerId
`;

export async function findUserById(id) {
  const user = await queryOne("SELECT * FROM users WHERE id = ?", [id]);
  if (!user) return null;
  return { ...toUserDTO(user), passwordHash: user.passwordHash };
}

export async function findUserByLicence(licenceNumber) {
  const user = await queryOne("SELECT * FROM users WHERE licenceNumber = ?", [
    licenceNumber,
  ]);
  if (!user) return null;
  return { ...toUserDTO(user), passwordHash: user.passwordHash };
}

export async function findUserByLicenceOrPhone(licenceNumber, phone) {
  const user = await queryOne(
    "SELECT * FROM users WHERE licenceNumber = ? OR phone = ?",
    [licenceNumber, phone],
  );
  if (!user) return null;
  return { ...toUserDTO(user), passwordHash: user.passwordHash };
}

export async function createUser(data) {
  const id = await insert(
    `INSERT INTO users (legalName, licenceNumber, phone, passwordHash, role, accountKind, contactName, city)
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
      title, description, images, startingBid, currentBid, bidIncrement, reservePrice,
      \`condition\`, location, status, startsAt, endsAt, categoryId, sellerId
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
    "SELECT COUNT(*) AS count FROM bids WHERE listingId = ?",
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
     SET currentBid = ?, lastBidAt = NOW(), bidCount = bidCount + 1
     WHERE id = ?
       AND sellerId <> ?
       AND status = 'LIVE'
       AND endsAt > NOW()
       AND currentBid <= ?`,
    [amount, listingId, userId, amount],
  );
  return Boolean(result.affectedRows);
}

export async function insertBid({ amount, listingId, bidderId }) {
  await insert(
    "INSERT INTO bids (amount, listingId, bidderId) VALUES (?, ?, ?)",
    [amount, listingId, bidderId],
  );
}

export async function findHighestBid(listingId) {
  const bid = await queryOne(
    `SELECT b.*, u.id AS bidderId, u.legalName AS bidderName
     FROM bids b
     INNER JOIN users u ON u.id = b.bidderId
     WHERE b.listingId = ?
     ORDER BY b.amount DESC, b.createdAt ASC
     LIMIT 1`,
    [listingId],
  );
  return bid ? toBidDTO(bid) : null;
}

export async function findWatch(userId, listingId) {
  return queryOne("SELECT * FROM watches WHERE userId = ? AND listingId = ?", [
    userId,
    listingId,
  ]);
}

export async function insertWatch(userId, listingId) {
  await insert("INSERT INTO watches (userId, listingId) VALUES (?, ?)", [
    userId,
    listingId,
  ]);
  await execute(
    "UPDATE listings SET watchCount = watchCount + 1 WHERE id = ?",
    [listingId],
  );
}

export async function deleteWatch(userId, listingId) {
  const result = await execute(
    "DELETE FROM watches WHERE userId = ? AND listingId = ?",
    [userId, listingId],
  );
  if (result.affectedRows) {
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
     SET status = 'SOLD', buyerId = ?, paidAt = NOW(), paidAmount = ?, paymentMethod = ?
     WHERE id = ?
       AND sellerId <> ?
       AND status NOT IN ('CANCELLED', 'SOLD')`,
    [userId, amount, paymentMethod, listingId, userId],
  );
  return Boolean(result.affectedRows);
}

export async function insertPayment(data) {
  await insert(
    `INSERT INTO payments (amount, method, reference, payerName, payerPhone, last4, listingId, buyerId)
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
