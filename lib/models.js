import mongoose, { Schema } from "mongoose";
import { IDLE_BID_MS } from "./format";
import { connectDB } from "./db";
import { toBidDTO, toListingDTO, toUserDTO } from "./serialize";

const userSchema = new Schema(
  {
    legalName: { type: String, required: true },
    licenceNumber: { type: String, required: true, unique: true, uppercase: true, trim: true },
    phone: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    role: { type: String, default: "BUYER" },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

const categorySchema = new Schema({
  slug: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
});

const listingSchema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    images: { type: String, default: "[]" },
    startingBid: { type: Number, required: true },
    currentBid: { type: Number, required: true },
    bidIncrement: { type: Number, default: 100 },
    reservePrice: Number,
    condition: { type: String, required: true },
    location: { type: String, required: true },
    status: { type: String, default: "LIVE" },
    startsAt: { type: Date, default: Date.now },
    endsAt: { type: Date, required: true },
    lastBidAt: Date,
    category: { type: Schema.Types.ObjectId, ref: "Category", required: true },
    seller: { type: Schema.Types.ObjectId, ref: "User", required: true },
    buyer: { type: Schema.Types.ObjectId, ref: "User" },
    paidAt: Date,
    paidAmount: Number,
    paymentMethod: String,
    bidCount: { type: Number, default: 0 },
    watchCount: { type: Number, default: 0 },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

const bidSchema = new Schema(
  {
    amount: { type: Number, required: true },
    listing: { type: Schema.Types.ObjectId, ref: "Listing", required: true },
    bidder: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

const watchSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    listing: { type: Schema.Types.ObjectId, ref: "Listing", required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

watchSchema.index({ user: 1, listing: 1 }, { unique: true });

const paymentSchema = new Schema(
  {
    amount: { type: Number, required: true },
    method: { type: String, required: true },
    reference: { type: String, required: true },
    payerName: { type: String, required: true },
    payerPhone: String,
    last4: String,
    listing: { type: Schema.Types.ObjectId, ref: "Listing", required: true },
    buyer: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

function defineModel(name, schema) {
  if (mongoose.models[name]) {
    delete mongoose.models[name];
  }
  return mongoose.model(name, schema);
}

export const User = defineModel("User", userSchema);
export const Category = defineModel("Category", categorySchema);
export const Listing = defineModel("Listing", listingSchema);
export const Bid = defineModel("Bid", bidSchema);
export const Watch = defineModel("Watch", watchSchema);
export const Payment = defineModel("Payment", paymentSchema);

const listingPopulate = [
  { path: "category" },
  { path: "seller", select: "legalName licenceNumber" },
  { path: "buyer", select: "legalName" },
];

export async function findUserById(id) {
  await connectDB();
  const user = await User.findById(id).lean();
  if (!user) return null;
  return { ...toUserDTO(user), passwordHash: user.passwordHash };
}

export async function findUserByLicence(licenceNumber) {
  await connectDB();
  const user = await User.findOne({ licenceNumber }).lean();
  if (!user) return null;
  return { ...toUserDTO(user), passwordHash: user.passwordHash };
}

export async function findUserByLicenceOrPhone(licenceNumber, phone) {
  await connectDB();
  const user = await User.findOne({
    $or: [{ licenceNumber }, { phone }],
  }).lean();
  if (!user) return null;
  return { ...toUserDTO(user), passwordHash: user.passwordHash };
}

export async function createUser(data) {
  await connectDB();
  const user = await User.create(data);
  return toUserDTO(user);
}

export async function findCategoryById(id) {
  await connectDB();
  const category = await Category.findById(id).lean();
  if (!category) return null;
  return { id: String(category._id), ...category };
}

export async function findCategoryBySlug(slug) {
  await connectDB();
  return Category.findOne({ slug }).lean();
}

export async function findListingById(id) {
  await connectDB();
  const listing = await Listing.findById(id).populate(listingPopulate).lean();
  return toListingDTO(listing);
}

export async function createListing(data) {
  await connectDB();
  const listing = await Listing.create({
    title: data.title,
    description: data.description,
    images: data.images,
    startingBid: data.startingBid,
    currentBid: data.currentBid,
    bidIncrement: data.bidIncrement,
    reservePrice: data.reservePrice,
    condition: data.condition,
    location: data.location,
    status: data.status,
    endsAt: data.endsAt,
    category: data.categoryId,
    seller: data.sellerId,
  });
  return { id: String(listing._id) };
}

export async function countBids(listingId) {
  await connectDB();
  return Bid.countDocuments({ listing: listingId });
}

export async function cancelListing(listingId) {
  await connectDB();
  await Listing.findByIdAndUpdate(listingId, { status: "CANCELLED" });
}

export async function updateListingBid(listingId, userId, amount) {
  await connectDB();
  const idleCutoff = new Date(Date.now() - IDLE_BID_MS);
  const updated = await Listing.findOneAndUpdate(
    {
      _id: listingId,
      seller: { $ne: userId },
      status: "LIVE",
      endsAt: { $gt: new Date() },
      currentBid: { $lte: amount },
      $or: [
        { bidCount: { $lte: 0 } },
        { lastBidAt: null },
        { lastBidAt: { $exists: false } },
        { lastBidAt: { $gt: idleCutoff } },
      ],
    },
    {
      $set: { currentBid: amount, lastBidAt: new Date() },
      $inc: { bidCount: 1 },
    },
    { new: true },
  );
  return Boolean(updated);
}

export async function insertBid({ amount, listingId, bidderId }) {
  await connectDB();
  await Bid.create({
    amount,
    listing: listingId,
    bidder: bidderId,
  });
}

export async function findHighestBid(listingId) {
  await connectDB();
  const bid = await Bid.findOne({ listing: listingId })
    .sort({ amount: -1, createdAt: 1 })
    .populate("bidder", "legalName")
    .lean();
  return bid ? toBidDTO(bid) : null;
}

export async function findWatch(userId, listingId) {
  await connectDB();
  return Watch.findOne({ user: userId, listing: listingId }).lean();
}

export async function insertWatch(userId, listingId) {
  await connectDB();
  await Watch.create({ user: userId, listing: listingId });
  await Listing.findByIdAndUpdate(listingId, { $inc: { watchCount: 1 } });
}

export async function deleteWatch(userId, listingId) {
  await connectDB();
  const result = await Watch.deleteOne({ user: userId, listing: listingId });
  if (result.deletedCount) {
    await Listing.findByIdAndUpdate(listingId, {
      $inc: { watchCount: -1 },
    });
  }
}

export async function markListingSold({
  listingId,
  userId,
  amount,
  paymentMethod,
}) {
  await connectDB();
  const updated = await Listing.findOneAndUpdate(
    {
      _id: listingId,
      seller: { $ne: userId },
      status: { $nin: ["CANCELLED", "SOLD"] },
    },
    {
      $set: {
        status: "SOLD",
        buyer: userId,
        paidAt: new Date(),
        paidAmount: amount,
        paymentMethod,
      },
    },
    { new: true },
  );
  return Boolean(updated);
}

export async function insertPayment(data) {
  await connectDB();
  await Payment.create({
    amount: data.amount,
    method: data.method,
    reference: data.reference,
    payerName: data.payerName,
    payerPhone: data.payerPhone,
    last4: data.last4,
    listing: data.listingId,
    buyer: data.buyerId,
  });
}
