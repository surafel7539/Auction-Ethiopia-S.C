import { query, queryOne } from "./db";
import { listingFromRow, toListingDTO, toUserDTO } from "./serialize";
import { getAuctionStatus } from "./format";
import { LISTING_SELECT } from "./models";

export async function getAdminStats() {
  const [users, listings, payments] = await Promise.all([
    queryOne(
      `SELECT
         COUNT(*)::int AS total,
         COUNT(*) FILTER (WHERE role = 'BUYER')::int AS buyers,
         COUNT(*) FILTER (WHERE role IN ('SELLER', 'BOTH'))::int AS sellers
       FROM users
       WHERE role <> 'ADMIN'`,
    ),
    queryOne(
      `SELECT
         COUNT(*)::int AS total,
         COUNT(*) FILTER (WHERE status = 'LIVE' AND starts_at <= NOW() AND ends_at > NOW())::int AS live,
         COUNT(*) FILTER (WHERE status = 'LIVE' AND starts_at > NOW())::int AS scheduled,
         COUNT(*) FILTER (WHERE status = 'SOLD')::int AS sold,
         COUNT(*) FILTER (WHERE status = 'CANCELLED')::int AS cancelled
       FROM listings`,
    ),
    queryOne(
      `SELECT COUNT(*)::int AS count, COALESCE(SUM(amount), 0) AS volume FROM payments`,
    ),
  ]);

  return {
    users: Number(users?.total || 0),
    buyers: Number(users?.buyers || 0),
    sellers: Number(users?.sellers || 0),
    lots: Number(listings?.total || 0),
    live: Number(listings?.live || 0),
    scheduled: Number(listings?.scheduled || 0),
    sold: Number(listings?.sold || 0),
    cancelled: Number(listings?.cancelled || 0),
    payments: Number(payments?.count || 0),
    volume: Number(payments?.volume || 0),
  };
}

export async function getAdminListings() {
  const rows = await query(
    `${LISTING_SELECT} ORDER BY l.created_at DESC LIMIT 80`,
  );
  return rows.map((row) => {
    const listing = toListingDTO(listingFromRow(row));
    return { ...listing, computedStatus: getAuctionStatus(listing) };
  });
}

export async function getAdminUsers() {
  const rows = await query(
    `SELECT id, legal_name, licence_number, phone, role, account_kind, contact_name, city, created_at
     FROM users
     ORDER BY created_at DESC`,
  );
  return rows.map((row) => toUserDTO(row));
}

export async function getAdminPayments() {
  return query(
    `SELECT p.id, p.amount, p.method, p.reference, p.payer_name, p.created_at,
            l.id AS "listingId", l.title AS "listingTitle"
     FROM payments p
     INNER JOIN listings l ON l.id = p.listing_id
     ORDER BY p.created_at DESC
     LIMIT 80`,
  );
}
