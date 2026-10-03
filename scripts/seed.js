const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");
const mysql = require("mysql2/promise");

function loadEnv(file) {
  try {
    const text = fs.readFileSync(file, "utf8");
    for (const line of text.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq < 1) continue;
      const key = trimmed.slice(0, eq);
      if (process.env[key]) continue;
      let value = trimmed.slice(eq + 1);
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      process.env[key] = value;
    }
  } catch {
    // optional local env file
  }
}

loadEnv(path.join(process.cwd(), ".env.local"));

const host = process.env.MYSQL_HOST || "127.0.0.1";
const port = Number(process.env.MYSQL_PORT || 3306);
const user = process.env.MYSQL_USER || "root";
const password = process.env.MYSQL_PASSWORD || "";
const database = process.env.MYSQL_DATABASE || "auction_ethiopia";

const categories = [
  {
    slug: "vehicles",
    name: "Vehicles",
    description:
      "Cars, trucks, motorcycles, and commercial fleets from across Ethiopia.",
  },
  {
    slug: "real-estate",
    name: "Real Estate",
    description:
      "Homes, plots, and commercial buildings offered through sealed and live sale.",
  },
  {
    slug: "art-antiques",
    name: "Art & Antiques",
    description:
      "Paintings, manuscripts, liturgical objects, and heritage pieces.",
  },
  {
    slug: "electronics",
    name: "Electronics",
    description: "Phones, computers, audiovisual equipment, and office tech.",
  },
  {
    slug: "jewelry",
    name: "Jewelry",
    description: "Gold, filigree, watches, and gemstone lots.",
  },
  {
    slug: "industrial",
    name: "Industrial Equipment",
    description: "Machinery, generators, construction plant, and workshop tools.",
  },
  {
    slug: "agriculture",
    name: "Agriculture",
    description: "Coffee, livestock, farm machinery, and processing equipment.",
  },
  {
    slug: "collectibles",
    name: "Collectibles",
    description: "Coins, stamps, vintage goods, and limited Ethiopian editions.",
  },
];

async function applySchema(connection) {
  const schema = fs.readFileSync(
    path.join(__dirname, "schema.sql"),
    "utf8",
  );
  const statements = schema
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean);
  for (const statement of statements) {
    await connection.query(statement);
  }
}

async function main() {
  console.log("Connecting to MySQL...");
  const admin = await mysql.createConnection({ host, port, user, password });
  await admin.query(
    `CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
  );
  await admin.end();

  const connection = await mysql.createConnection({
    host,
    port,
    user,
    password,
    database,
    multipleStatements: true,
  });
  console.log("Connected.");

  await connection.query("SET FOREIGN_KEY_CHECKS = 0");
  await connection.query("DROP TABLE IF EXISTS payments");
  await connection.query("DROP TABLE IF EXISTS watches");
  await connection.query("DROP TABLE IF EXISTS bids");
  await connection.query("DROP TABLE IF EXISTS listings");
  await connection.query("DROP TABLE IF EXISTS categories");
  await connection.query("DROP TABLE IF EXISTS users");
  await connection.query("SET FOREIGN_KEY_CHECKS = 1");
  await applySchema(connection);

  const passwordHash = await bcrypt.hash("Demo1234!", 10);

  const [sellerResult] = await connection.execute(
    `INSERT INTO users (legalName, licenceNumber, phone, passwordHash, role)
     VALUES (?, ?, ?, ?, ?)`,
    ["Hanna Bekele", "AE-SELL-001", "+251911234567", passwordHash, "SELLER"],
  );
  const [buyerResult] = await connection.execute(
    `INSERT INTO users (legalName, licenceNumber, phone, passwordHash, role)
     VALUES (?, ?, ?, ?, ?)`,
    ["Dawit Tesfaye", "AE-BUY-001", "+251922111222", passwordHash, "BUYER"],
  );
  const [bothResult] = await connection.execute(
    `INSERT INTO users (legalName, licenceNumber, phone, passwordHash, role)
     VALUES (?, ?, ?, ?, ?)`,
    ["Meron Alemu", "AE-BOTH-001", "+251933444555", passwordHash, "BOTH"],
  );

  const sellerId = sellerResult.insertId;
  const buyerId = buyerResult.insertId;
  const bothId = bothResult.insertId;

  const createdCategories = {};
  for (const category of categories) {
    const [result] = await connection.execute(
      "INSERT INTO categories (slug, name, description) VALUES (?, ?, ?)",
      [category.slug, category.name, category.description],
    );
    createdCategories[category.slug] = result.insertId;
  }

  const now = Date.now();
  const hours = (value) => new Date(now + value * 60 * 60 * 1000);

  const listings = [
    {
      title: "2018 Toyota Land Cruiser VX",
      description:
        "Well-maintained Land Cruiser with full service history, dual-zone climate, leather interior, and recent tyre replacement. Ideal for highland and long-distance travel. Inspection available at Bole, Addis Ababa.",
      images: JSON.stringify([
        "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?auto=format&fit=crop&w=1600&q=80",
        "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1600&q=80",
      ]),
      startingBid: 1850000,
      currentBid: 2140000,
      bidIncrement: 25000,
      reservePrice: 2300000,
      condition: "Excellent",
      location: "Addis Ababa",
      endsAt: hours(18),
      categoryId: createdCategories.vehicles,
      sellerId,
    },
    {
      title: "Bole 3-Bedroom Apartment with City View",
      description:
        "Corner apartment near Bole Medhanialem, 142 sqm, two parking spaces, backup generator, and 24-hour security. Title documents ready for due diligence. Sold as-is, where-is.",
      images: JSON.stringify([
        "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1600&q=80",
      ]),
      startingBid: 6500000,
      currentBid: 7200000,
      bidIncrement: 100000,
      reservePrice: null,
      condition: "Good",
      location: "Addis Ababa",
      endsAt: hours(42),
      categoryId: createdCategories["real-estate"],
      sellerId: bothId,
    },
    {
      title: "Contemporary Ethiopian Painting, Mixed Media",
      description:
        "Large mixed-media canvas by a noted Addis studio artist. Framed, signed, and accompanied by a certificate of authenticity. Suitable for corporate or private collections.",
      images: JSON.stringify([
        "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&w=1600&q=80",
      ]),
      startingBid: 45000,
      currentBid: 62000,
      bidIncrement: 2000,
      reservePrice: null,
      condition: "Like New",
      location: "Addis Ababa",
      endsAt: hours(8),
      categoryId: createdCategories["art-antiques"],
      sellerId,
    },
    {
      title: "MacBook Pro 16-inch Lot of Five Units",
      description:
        "Corporate refresh lot: five 16-inch MacBook Pro units, M-series chips, 32GB RAM. Each device wiped and tested. Sold as a single lot. Collection from Kazanchis office.",
      images: JSON.stringify([
        "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=1600&q=80",
      ]),
      startingBid: 280000,
      currentBid: 335000,
      bidIncrement: 5000,
      reservePrice: null,
      condition: "Good",
      location: "Addis Ababa",
      endsAt: hours(30),
      categoryId: createdCategories.electronics,
      sellerId: bothId,
    },
    {
      title: "22k Gold Filigree Cross Necklace",
      description:
        "Hand-worked 22-karat gold Ethiopian filigree cross on a matching chain. Weight approximately 18 grams. Hallmarked and available for in-person inspection.",
      images: JSON.stringify([
        "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=1600&q=80",
      ]),
      startingBid: 95000,
      currentBid: 118000,
      bidIncrement: 2500,
      reservePrice: null,
      condition: "Excellent",
      location: "Gondar",
      endsAt: hours(12),
      categoryId: createdCategories.jewelry,
      sellerId,
    },
    {
      title: "45kVA Diesel Generator, Low Hours",
      description:
        "Standby diesel generator with soundproof canopy, automatic transfer switch, and documented service log. Suitable for small factory or hotel backup power.",
      images: JSON.stringify([
        "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=1600&q=80",
      ]),
      startingBid: 410000,
      currentBid: 410000,
      bidIncrement: 10000,
      reservePrice: null,
      condition: "Good",
      location: "Adama",
      endsAt: hours(60),
      categoryId: createdCategories.industrial,
      sellerId: bothId,
    },
    {
      title: "Yirgacheffe Grade 1 Green Coffee, 50 Bags",
      description:
        "Fifty 60kg bags of washed Yirgacheffe Grade 1, current harvest, stored in a dry warehouse in Hawassa. Cupping notes and moisture readings available on request.",
      images: JSON.stringify([
        "https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=1600&q=80",
      ]),
      startingBid: 780000,
      currentBid: 845000,
      bidIncrement: 15000,
      reservePrice: null,
      condition: "New",
      location: "Hawassa",
      endsAt: hours(20),
      categoryId: createdCategories.agriculture,
      sellerId,
    },
    {
      title: "Imperial-Era Silver Coin Collection",
      description:
        "A private collection of 24 Ethiopian silver coins from the late imperial period, housed in a lined presentation case with an inventory list.",
      images: JSON.stringify([
        "https://images.unsplash.com/photo-1621416894565-c2dcb0c0d0a0?auto=format&fit=crop&w=1600&q=80",
      ]),
      startingBid: 38000,
      currentBid: 51000,
      bidIncrement: 1000,
      reservePrice: null,
      condition: "Excellent",
      location: "Dire Dawa",
      endsAt: hours(-6),
      status: "ENDED",
      categoryId: createdCategories.collectibles,
      sellerId: bothId,
    },
    {
      title: "Isuzu NPR Light Truck, 2020",
      description:
        "Single-owner NPR used for city distribution. Recent engine service, new battery, and clean cabin. Available for test drive in Mekelle.",
      images: JSON.stringify([
        "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=1600&q=80",
      ]),
      startingBid: 920000,
      currentBid: 990000,
      bidIncrement: 15000,
      reservePrice: null,
      condition: "Good",
      location: "Mekelle",
      endsAt: hours(54),
      categoryId: createdCategories.vehicles,
      sellerId,
    },
    {
      title: "Traditional Coffee Ceremony Set",
      description:
        "Complete jabena, cups, incense burner, and carved stool set from a Jimma workshop. Unused display piece, suitable for hospitality venues.",
      images: JSON.stringify([
        "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1600&q=80",
      ]),
      startingBid: 8500,
      currentBid: 12000,
      bidIncrement: 500,
      reservePrice: null,
      condition: "Like New",
      location: "Jimma",
      endsAt: hours(36),
      categoryId: createdCategories.collectibles,
      sellerId: bothId,
    },
  ];

  for (const listing of listings) {
    const hasBid = listing.currentBid > listing.startingBid;
    const [created] = await connection.execute(
      `INSERT INTO listings (
        title, description, images, startingBid, currentBid, bidIncrement,
        reservePrice, \`condition\`, location, status, endsAt, lastBidAt, categoryId, sellerId, bidCount
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        listing.title,
        listing.description,
        listing.images,
        listing.startingBid,
        listing.currentBid,
        listing.bidIncrement,
        listing.reservePrice,
        listing.condition,
        listing.location,
        listing.status || "LIVE",
        listing.endsAt,
        hasBid ? new Date() : null,
        listing.categoryId,
        listing.sellerId,
        hasBid ? 1 : 0,
      ],
    );

    if (hasBid) {
      await connection.execute(
        "INSERT INTO bids (amount, listingId, bidderId) VALUES (?, ?, ?)",
        [listing.currentBid, created.insertId, buyerId],
      );
    }
  }

  await connection.end();
  console.log("Seeded Auction Ethiopia S.C demo data in MySQL.");
  console.log("Seller: AE-SELL-001 / Demo1234!");
  console.log("Buyer:  AE-BUY-001 / Demo1234!");
  console.log("Both:   AE-BOTH-001 / Demo1234!");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
