import mongoose, { Schema } from "mongoose";

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
  if (mongoose.modelSchemas?.[name]) {
    delete mongoose.modelSchemas[name];
  }
  return mongoose.model(name, schema);
}

export const User = defineModel("User", userSchema);
export const Category = defineModel("Category", categorySchema);
export const Listing = defineModel("Listing", listingSchema);
export const Bid = defineModel("Bid", bidSchema);
export const Watch = defineModel("Watch", watchSchema);
export const Payment = defineModel("Payment", paymentSchema);
