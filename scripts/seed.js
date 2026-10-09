const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");
const { Client } = require("pg");

const envPath = path.join(__dirname, "..", ".env.local");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const index = trimmed.indexOf("=");
    if (index === -1) continue;
    const key = trimmed.slice(0, index).trim();
    let value = trimmed.slice(index + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key] || process.env[key] === "") process.env[key] = value;
  }
}

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

function postgresUrl() {
  const raw =
    process.env.SQL_POSTGRES_URL_NON_POOLING ||
    process.env.POSTGRES_URL_NON_POOLING ||
    process.env.SQL_POSTGRES_URL ||
    process.env.POSTGRES_URL ||
    process.env.DATABASE_URL ||
    "";
  if (!raw) {
    throw new Error("Set SQL_POSTGRES_URL from your Supabase env snippet.");
  }
  const url = new URL(raw);
  url.searchParams.delete("sslmode");
  url.searchParams.delete("pgbouncer");
  url.searchParams.delete("supa");
  url.searchParams.delete("uselibpqcompat");
  return url.toString();
}

async function insertReturningId(db, sql, params) {
  const result = await db.query(`${sql} RETURNING id`, params);
  return result.rows[0].id;
}

async function main() {
  const db = new Client({
    connectionString: postgresUrl(),
    ssl: { rejectUnauthorized: false },
  });
  await db.connect();

  await db.query(`
    DROP TABLE IF EXISTS payments, watches, bids, listings, categories, users CASCADE;
  `);
  await db.query(fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8"));

  const passwordHash = await bcrypt.hash("Demo1234!", 10);

  const sellerId = await insertReturningId(
    db,
    `INSERT INTO users (legal_name, licence_number, phone, password_hash, role) VALUES ($1, $2, $3, $4, $5)`,
    ["Hanna Bekele", "AE-SELL-001", "+251911234567", passwordHash, "SELLER"],
  );
  const buyerId = await insertReturningId(
    db,
    `INSERT INTO users (legal_name, licence_number, phone, password_hash, role) VALUES ($1, $2, $3, $4, $5)`,
    ["Dawit Tesfaye", "AE-BUY-001", "+251922111222", passwordHash, "BUYER"],
  );
  const bothId = await insertReturningId(
    db,
    `INSERT INTO users (legal_name, licence_number, phone, password_hash, role) VALUES ($1, $2, $3, $4, $5)`,
    ["Meron Alemu", "AE-BOTH-001", "+251933444555", passwordHash, "BOTH"],
  );

  const seller = { id: sellerId };
  const buyer = { id: buyerId };
  const both = { id: bothId };
  const sellers = { seller: seller.id, both: both.id };

  const createdCategories = {};
  for (const category of categories) {
    createdCategories[category.slug] = await insertReturningId(
      db,
      "INSERT INTO categories (slug, name, description) VALUES ($1, $2, $3)",
      [category.slug, category.name, category.description],
    );
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
      categorySlug: "vehicles",
      sellerKey: "seller",
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
      condition: "Good",
      location: "Addis Ababa",
      endsAt: hours(42),
      categorySlug: "real-estate",
      sellerKey: "both",
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
      condition: "Like New",
      location: "Addis Ababa",
      endsAt: hours(8),
      categorySlug: "art-antiques",
      sellerKey: "seller",
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
      condition: "Good",
      location: "Addis Ababa",
      endsAt: hours(30),
      categorySlug: "electronics",
      sellerKey: "both",
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
      condition: "Excellent",
      location: "Gondar",
      endsAt: hours(12),
      categorySlug: "jewelry",
      sellerKey: "seller",
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
      condition: "Good",
      location: "Adama",
      endsAt: hours(60),
      categorySlug: "industrial",
      sellerKey: "both",
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
      condition: "New",
      location: "Hawassa",
      endsAt: hours(20),
      categorySlug: "agriculture",
      sellerKey: "seller",
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
      condition: "Excellent",
      location: "Dire Dawa",
      endsAt: hours(-6),
      status: "ENDED",
      categorySlug: "collectibles",
      sellerKey: "both",
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
      condition: "Good",
      location: "Mekelle",
      endsAt: hours(54),
      categorySlug: "vehicles",
      sellerKey: "seller",
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
      condition: "Like New",
      location: "Jimma",
      endsAt: hours(36),
      categorySlug: "collectibles",
      sellerKey: "both",
    },
    {
      title: "2016 Toyota Hilux Double Cab",
      description:
        "Double-cab Hilux used for regional site visits. Recent clutch, new tyres, and a documented service book. Inspection and a short test drive in Bahir Dar.",
      images: JSON.stringify([
        "https://images.unsplash.com/photo-1559416523-140ddc3d238c?auto=format&fit=crop&w=1600&q=80",
      ]),
      startingBid: 890000,
      currentBid: 890000,
      bidIncrement: 15000,
      condition: "Good",
      location: "Bahir Dar",
      endsAt: hours(28),
      categorySlug: "vehicles",
      sellerKey: "seller",
    },
    {
      title: "2019 Suzuki Dzire",
      description:
        "City sedan with one owner, automatic transmission, and a clean interior. Ideal for daily Addis use. Service stamps available at viewing.",
      images: JSON.stringify([
        "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=1600&q=80",
      ]),
      startingBid: 620000,
      currentBid: 620000,
      bidIncrement: 10000,
      condition: "Excellent",
      location: "Addis Ababa",
      endsAt: hours(40),
      categorySlug: "vehicles",
      sellerKey: "both",
    },
    {
      title: "CMC Villa Plot, 500 sqm",
      description:
        "Corner residential plot in CMC with road access on two sides. Title deed ready for due diligence. Sold vacant, as-is, where-is.",
      images: JSON.stringify([
        "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1600&q=80",
      ]),
      startingBid: 4200000,
      currentBid: 4200000,
      bidIncrement: 50000,
      condition: "Good",
      location: "Addis Ababa",
      endsAt: hours(72),
      categorySlug: "real-estate",
      sellerKey: "seller",
    },
    {
      title: "Hawassa Lakeside Retail Shop",
      description:
        "Ground-floor shop facing a busy lakeside street, about 48 sqm, with a storeroom and separate meter. Leasehold documents available for review.",
      images: JSON.stringify([
        "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1600&q=80",
      ]),
      startingBid: 3100000,
      currentBid: 3100000,
      bidIncrement: 50000,
      condition: "Good",
      location: "Hawassa",
      endsAt: hours(50),
      categorySlug: "real-estate",
      sellerKey: "both",
    },
    {
      title: "Illuminated Ge'ez Manuscript Leaf",
      description:
        "Single vellum leaf with Ge'ez text and painted border, from a private Gondar collection. Accompanied by a written provenance note. Handle with gloves at viewing.",
      images: JSON.stringify([
        "https://images.unsplash.com/photo-1579783901586-d88db74b4fe4?auto=format&fit=crop&w=1600&q=80",
      ]),
      startingBid: 28000,
      currentBid: 28000,
      bidIncrement: 1000,
      condition: "Excellent",
      location: "Gondar",
      endsAt: hours(16),
      categorySlug: "art-antiques",
      sellerKey: "seller",
    },
    {
      title: "Samsung 65-inch Display Lot of Eight",
      description:
        "Eight 65-inch commercial displays removed from a hotel lobby refresh. Each unit powers on and includes its remote. Sold as one lot from Bole.",
      images: JSON.stringify([
        "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=1600&q=80",
      ]),
      startingBid: 240000,
      currentBid: 240000,
      bidIncrement: 5000,
      condition: "Like New",
      location: "Addis Ababa",
      endsAt: hours(22),
      categorySlug: "electronics",
      sellerKey: "both",
    },
    {
      title: "HP Desktop Refresh, Twelve Units",
      description:
        "Twelve HP business desktops with monitors, wiped and tested after an office move in Adama. Keyboards included. Sold only as a complete lot.",
      images: JSON.stringify([
        "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=1600&q=80",
      ]),
      startingBid: 185000,
      currentBid: 185000,
      bidIncrement: 5000,
      condition: "Good",
      location: "Adama",
      endsAt: hours(34),
      categorySlug: "electronics",
      sellerKey: "seller",
    },
    {
      title: "Silver Wristwatch, Swiss Movement",
      description:
        "Men's silver-cased wristwatch with a Swiss quartz movement and a leather strap. Recently serviced. In-person inspection in Dire Dawa.",
      images: JSON.stringify([
        "https://images.unsplash.com/photo-1523170335258-f5ed11844a49?auto=format&fit=crop&w=1600&q=80",
      ]),
      startingBid: 42000,
      currentBid: 42000,
      bidIncrement: 1000,
      condition: "Excellent",
      location: "Dire Dawa",
      endsAt: hours(14),
      categorySlug: "jewelry",
      sellerKey: "seller",
    },
    {
      title: "350-Litre Concrete Mixer",
      description:
        "Portable diesel concrete mixer with a 350-litre drum, used on two building sites. Starts reliably. Collection from the Dire Dawa yard.",
      images: JSON.stringify([
        "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1600&q=80",
      ]),
      startingBid: 165000,
      currentBid: 165000,
      bidIncrement: 5000,
      condition: "Used",
      location: "Dire Dawa",
      endsAt: hours(48),
      categorySlug: "industrial",
      sellerKey: "both",
    },
    {
      title: "2.5-Ton Warehouse Forklift",
      description:
        "Diesel forklift, 2.5-ton capacity, with a side-shift attachment and a recent mast inspection. Suitable for a dry warehouse. Viewing in Kality.",
      images: JSON.stringify([
        "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1600&q=80",
      ]),
      startingBid: 540000,
      currentBid: 540000,
      bidIncrement: 10000,
      condition: "Good",
      location: "Addis Ababa",
      endsAt: hours(26),
      categorySlug: "industrial",
      sellerKey: "seller",
    },
    {
      title: "Massey Ferguson Tractor, 2014",
      description:
        "Field tractor with a front loader, used on a Bahir Dar farm. Hours recorded in the logbook. Tyres have useful tread. Sold without implements.",
      images: JSON.stringify([
        "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&w=1600&q=80",
      ]),
      startingBid: 760000,
      currentBid: 760000,
      bidIncrement: 15000,
      condition: "Good",
      location: "Bahir Dar",
      endsAt: hours(44),
      categorySlug: "agriculture",
      sellerKey: "both",
    },
    {
      title: "White Honey, 200 kg",
      description:
        "Two hundred kilograms of filtered white honey from Jimma highlands, packed in food-grade pails. Moisture reading and harvest date supplied with the lot.",
      images: JSON.stringify([
        "https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?auto=format&fit=crop&w=1600&q=80",
      ]),
      startingBid: 96000,
      currentBid: 96000,
      bidIncrement: 2000,
      condition: "New",
      location: "Jimma",
      endsAt: hours(18),
      categorySlug: "agriculture",
      sellerKey: "seller",
    },
    {
      title: "Ethiopian Stamp Album, 1960s",
      description:
        "Bound album of Ethiopian postage stamps from the 1960s, with a typed inventory. A collector's lot, not a single stamp. Viewing by appointment in Addis Ababa.",
      images: JSON.stringify([
        "https://images.unsplash.com/photo-1578269174936-2709b6aeb913?auto=format&fit=crop&w=1600&q=80",
      ]),
      startingBid: 15000,
      currentBid: 15000,
      bidIncrement: 500,
      condition: "Excellent",
      location: "Addis Ababa",
      endsAt: hours(10),
      categorySlug: "collectibles",
      sellerKey: "both",
    },
    {
      title: "Bajaj Three-Wheeler Fleet of Four",
      description:
        "Four city three-wheelers from one operator in Mekelle. Each starts and includes its documents. Sold as a fleet, not individually.",
      images: JSON.stringify([
        "https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=1600&q=80",
      ]),
      startingBid: 480000,
      currentBid: 480000,
      bidIncrement: 10000,
      condition: "Good",
      location: "Mekelle",
      endsAt: hours(38),
      categorySlug: "vehicles",
      sellerKey: "seller",
    },
    {
      title: "Harar Woven Basket Set",
      description:
        "A set of twelve handwoven Harar baskets in graduated sizes, unused and suitable for a shop display or hospitality interior.",
      images: JSON.stringify([
        "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=1600&q=80",
      ]),
      startingBid: 6500,
      currentBid: 6500,
      bidIncrement: 250,
      condition: "Like New",
      location: "Dire Dawa",
      endsAt: hours(32),
      categorySlug: "collectibles",
      sellerKey: "both",
    },
    {
      title: "MacBook Air 13-inch",
      description:
        "Single 13-inch MacBook Air, M-series chip, 16GB memory, 512GB storage. Battery health checked and the device factory reset. Collection from Bole, Addis Ababa.",
      images: JSON.stringify([
        "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=1600&q=80",
      ]),
      startingBid: 85000,
      currentBid: 85000,
      bidIncrement: 2000,
      condition: "Like New",
      location: "Addis Ababa",
      endsAt: hours(26),
      categorySlug: "electronics",
      sellerKey: "seller",
    },
    {
      title: "iPhone 15",
      description:
        "iPhone 15, 128GB, unlocked, with the original box and cable. Screen unmarked and the battery recently checked. Viewing by appointment in Addis Ababa.",
      images: JSON.stringify([
        "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=1600&q=80",
      ]),
      startingBid: 42000,
      currentBid: 42000,
      bidIncrement: 1000,
      condition: "Excellent",
      location: "Addis Ababa",
      endsAt: hours(20),
      categorySlug: "electronics",
      sellerKey: "both",
    },
    {
      title: "iPad Air",
      description:
        "iPad Air with Wi-Fi, 128GB, and a keyboard folio. Reset and ready for a new owner. Suitable for study or a shop counter. Collection from Kazanchis.",
      images: JSON.stringify([
        "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=1600&q=80",
      ]),
      startingBid: 38000,
      currentBid: 38000,
      bidIncrement: 1000,
      condition: "Excellent",
      location: "Addis Ababa",
      endsAt: hours(24),
      categorySlug: "electronics",
      sellerKey: "seller",
    },
    {
      title: "2022 Toyota Corolla Cross",
      description:
        "Scheduled lot. Compact crossover with one owner and a full service file. Viewing opens with the auction in Addis Ababa.",
      images: JSON.stringify([
        "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=1600&q=80",
      ]),
      startingBid: 1450000,
      currentBid: 1450000,
      bidIncrement: 25000,
      condition: "Excellent",
      location: "Addis Ababa",
      startsAt: hours(36),
      endsAt: hours(108),
      categorySlug: "vehicles",
      sellerKey: "seller",
    },
    {
      title: "22k Gold Bracelet",
      description:
        "Scheduled lot. Hand-finished 22-karat gold bracelet, hallmarked, offered as a single piece from Gondar.",
      images: JSON.stringify([
        "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=1600&q=80",
      ]),
      startingBid: 72000,
      currentBid: 72000,
      bidIncrement: 2000,
      condition: "Like New",
      location: "Gondar",
      startsAt: hours(18),
      endsAt: hours(90),
      categorySlug: "jewelry",
      sellerKey: "both",
    },
    {
      title: "Bole Commercial Floor",
      description:
        "Scheduled lot. Open-plan commercial floor near Bole Road, about 210 sqm, with parking. Title review begins when the auction opens.",
      images: JSON.stringify([
        "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1600&q=80",
      ]),
      startingBid: 8900000,
      currentBid: 8900000,
      bidIncrement: 100000,
      condition: "Good",
      location: "Addis Ababa",
      startsAt: hours(72),
      endsAt: hours(168),
      categorySlug: "real-estate",
      sellerKey: "seller",
    },
    {
      title: "Coffee Pulper, Station Size",
      description:
        "Scheduled lot. Washed-process pulper from a Hawassa station, recently serviced. Collection after the hammer.",
      images: JSON.stringify([
        "https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=1600&q=80",
      ]),
      startingBid: 260000,
      currentBid: 260000,
      bidIncrement: 5000,
      condition: "Good",
      location: "Hawassa",
      startsAt: hours(48),
      endsAt: hours(120),
      categorySlug: "agriculture",
      sellerKey: "both",
    },
    {
      title: "Vintage Medium-Format Camera",
      description:
        "Scheduled lot. Working medium-format camera with two lenses, from a private Addis collection. Inspection on the opening day.",
      images: JSON.stringify([
        "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1600&q=80",
      ]),
      startingBid: 34000,
      currentBid: 34000,
      bidIncrement: 1000,
      condition: "Excellent",
      location: "Addis Ababa",
      startsAt: hours(12),
      endsAt: hours(84),
      categorySlug: "collectibles",
      sellerKey: "seller",
    },
    {
      title: "Site Generator, 100kVA",
      description:
        "Scheduled lot. Containerised 100kVA generator with a transfer switch, stored in Adama. The lot opens for bidding on the published date.",
      images: JSON.stringify([
        "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=1600&q=80",
      ]),
      startingBid: 980000,
      currentBid: 980000,
      bidIncrement: 20000,
      condition: "Good",
      location: "Adama",
      startsAt: hours(60),
      endsAt: hours(132),
      categorySlug: "industrial",
      sellerKey: "both",
    },
  ];

  for (const listing of listings) {
    const hasBid = listing.currentBid > listing.startingBid;
    const listingId = await insertReturningId(
      db,
      `INSERT INTO listings (
        title, description, images, starting_bid, current_bid, bid_increment, reserve_price,
        condition, location, status, starts_at, ends_at, last_bid_at, category_id, seller_id, bid_count
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
      [
        listing.title,
        listing.description,
        listing.images,
        listing.startingBid,
        listing.currentBid,
        listing.bidIncrement,
        listing.reservePrice ?? null,
        listing.condition,
        listing.location,
        listing.status || "LIVE",
        listing.startsAt || new Date(),
        listing.endsAt,
        hasBid ? new Date() : null,
        createdCategories[listing.categorySlug],
        sellers[listing.sellerKey],
        hasBid ? 1 : 0,
      ],
    );

    if (hasBid) {
      await db.query(
        "INSERT INTO bids (amount, listing_id, bidder_id) VALUES ($1, $2, $3)",
        [listing.currentBid, listingId, buyer.id],
      );
    }
  }

  await db.end();
  console.log("Seeded Crown Bid demo data in Supabase Postgres.");
  console.log("Seller: AE-SELL-001 / Demo1234!");
  console.log("Buyer:  AE-BUY-001 / Demo1234!");
  console.log("Both:   AE-BOTH-001 / Demo1234!");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
