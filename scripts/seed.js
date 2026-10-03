const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/auction-ethiopia";

const userSchema = new mongoose.Schema(
  {
    legalName: String,
    licenceNumber: { type: String, unique: true },
    phone: { type: String, unique: true },
    passwordHash: String,
    role: { type: String, default: "BUYER" },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

const categorySchema = new mongoose.Schema({
  slug: { type: String, unique: true },
  name: String,
  description: String,
});

const listingSchema = new mongoose.Schema(
  {
    title: String,
    description: String,
    images: String,
    startingBid: Number,
    currentBid: Number,
    bidIncrement: Number,
    reservePrice: Number,
    condition: String,
    location: String,
    status: { type: String, default: "LIVE" },
    startsAt: { type: Date, default: Date.now },
    endsAt: Date,
    lastBidAt: Date,
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
    seller: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    bidCount: { type: Number, default: 0 },
    watchCount: { type: Number, default: 0 },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

const bidSchema = new mongoose.Schema(
  {
    amount: Number,
    listing: { type: mongoose.Schema.Types.ObjectId, ref: "Listing" },
    bidder: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

const User = mongoose.models.User || mongoose.model("User", userSchema);
const Category =
  mongoose.models.Category || mongoose.model("Category", categorySchema);
const Listing =
  mongoose.models.Listing || mongoose.model("Listing", listingSchema);
const Bid = mongoose.models.Bid || mongoose.model("Bid", bidSchema);
const Watch =
  mongoose.models.Watch ||
  mongoose.model(
    "Watch",
    new mongoose.Schema({
      user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      listing: { type: mongoose.Schema.Types.ObjectId, ref: "Listing" },
    }),
  );

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

async function main() {
  await mongoose.connect(MONGODB_URI);
  await Promise.all([
    Watch.deleteMany({}),
    Bid.deleteMany({}),
    Listing.deleteMany({}),
    Category.deleteMany({}),
    User.deleteMany({}),
  ]);
  await User.collection.dropIndexes().catch(() => {});

  const passwordHash = await bcrypt.hash("Demo1234!", 10);

  const seller = await User.create({
    legalName: "Hanna Bekele",
    licenceNumber: "AE-SELL-001",
    phone: "+251911234567",
    passwordHash,
    role: "SELLER",
  });

  const buyer = await User.create({
    legalName: "Dawit Tesfaye",
    licenceNumber: "AE-BUY-001",
    phone: "+251922111222",
    passwordHash,
    role: "BUYER",
  });

  const both = await User.create({
    legalName: "Meron Alemu",
    licenceNumber: "AE-BOTH-001",
    phone: "+251933444555",
    passwordHash,
    role: "BOTH",
  });

  const createdCategories = {};
  for (const category of categories) {
    createdCategories[category.slug] = await Category.create(category);
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
      category: createdCategories.vehicles._id,
      seller: seller._id,
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
      category: createdCategories["real-estate"]._id,
      seller: both._id,
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
      category: createdCategories["art-antiques"]._id,
      seller: seller._id,
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
      category: createdCategories.electronics._id,
      seller: both._id,
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
      category: createdCategories.jewelry._id,
      seller: seller._id,
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
      category: createdCategories.industrial._id,
      seller: both._id,
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
      category: createdCategories.agriculture._id,
      seller: seller._id,
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
      category: createdCategories.collectibles._id,
      seller: both._id,
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
      category: createdCategories.vehicles._id,
      seller: seller._id,
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
      category: createdCategories.collectibles._id,
      seller: both._id,
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
      category: createdCategories.vehicles._id,
      seller: seller._id,
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
      category: createdCategories.vehicles._id,
      seller: both._id,
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
      category: createdCategories["real-estate"]._id,
      seller: seller._id,
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
      category: createdCategories["real-estate"]._id,
      seller: both._id,
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
      category: createdCategories["art-antiques"]._id,
      seller: seller._id,
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
      category: createdCategories.electronics._id,
      seller: both._id,
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
      category: createdCategories.electronics._id,
      seller: seller._id,
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
      category: createdCategories.jewelry._id,
      seller: seller._id,
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
      category: createdCategories.industrial._id,
      seller: both._id,
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
      category: createdCategories.industrial._id,
      seller: seller._id,
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
      category: createdCategories.agriculture._id,
      seller: both._id,
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
      category: createdCategories.agriculture._id,
      seller: seller._id,
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
      category: createdCategories.collectibles._id,
      seller: both._id,
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
      category: createdCategories.vehicles._id,
      seller: seller._id,
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
      category: createdCategories.collectibles._id,
      seller: both._id,
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
      category: createdCategories.electronics._id,
      seller: seller._id,
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
      category: createdCategories.electronics._id,
      seller: both._id,
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
      category: createdCategories.electronics._id,
      seller: seller._id,
    },
  ];

  for (const listing of listings) {
    const hasBid = listing.currentBid > listing.startingBid;
    const created = await Listing.create({
      status: listing.status || "LIVE",
      bidCount: hasBid ? 1 : 0,
      ...listing,
      lastBidAt: hasBid ? new Date() : null,
    });

    if (hasBid) {
      await Bid.create({
        amount: created.currentBid,
        listing: created._id,
        bidder: buyer._id,
      });
    }
  }

  console.log("Seeded Auction Ethiopia S.C demo data in MongoDB.");
  console.log("Seller: AE-SELL-001 / Demo1234!");
  console.log("Buyer:  AE-BUY-001 / Demo1234!");
  console.log("Both:   AE-BOTH-001 / Demo1234!");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
