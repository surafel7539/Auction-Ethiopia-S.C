"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { getAuctionStatus } from "@/lib/format";
import { Bid, Listing, Payment } from "@/lib/models";
import { isValidId } from "@/lib/serialize";

const METHODS = {
  TELEBIRR: "Telebirr",
  CBE_BIRR: "CBE Birr",
  CARD: "Card",
};

function clean(value) {
  return String(value || "").trim();
}

function digits(value) {
  return clean(value).replace(/\D/g, "");
}

export async function payListingAction(_, formData) {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "Sign in to complete this purchase." };
  }

  const listingId = clean(formData.get("listingId"));
  const method = clean(formData.get("method"));
  const payerName = clean(formData.get("payerName"));
  const payerPhone = clean(formData.get("payerPhone"));
  const cardNumber = digits(formData.get("cardNumber"));
  const expiry = clean(formData.get("expiry"));
  const cvv = digits(formData.get("cvv"));

  if (!isValidId(listingId)) {
    return { error: "This lot could not be found." };
  }
  if (!METHODS[method]) {
    return { error: "Choose a payment method." };
  }
  if (payerName.length < 3) {
    return { error: "Enter the name on the payment account." };
  }

  if (method === "TELEBIRR" || method === "CBE_BIRR") {
    const phone = digits(payerPhone);
    if (phone.length < 9 || phone.length > 12) {
      return { error: "Enter a valid Ethiopian mobile number." };
    }
  }

  if (method === "CARD") {
    if (cardNumber.length < 13 || cardNumber.length > 19) {
      return { error: "Enter a valid card number." };
    }
    if (!/^\d{2}\/\d{2}$/.test(expiry)) {
      return { error: "Enter the card expiry as MM/YY." };
    }
    if (cvv.length < 3 || cvv.length > 4) {
      return { error: "Enter the card security code." };
    }
  }

  await connectDB();
  const listing = await Listing.findById(listingId);
  if (!listing) {
    return { error: "This lot could not be found." };
  }
  if (String(listing.seller) === user.id) {
    return { error: "You cannot buy your own consignment." };
  }

  const status = getAuctionStatus(listing);
  if (status === "SOLD") {
    return { error: "This lot has already been paid for." };
  }
  if (status === "CANCELLED") {
    return { error: "This lot is no longer for sale." };
  }
  if (status === "ENDED") {
    const highest = await Bid.findOne({ listing: listingId })
      .sort({ amount: -1 })
      .lean();
    if (!highest || String(highest.bidder) !== user.id) {
      return { error: "Only the winning bidder can settle this lot." };
    }
  } else if (status !== "LIVE") {
    return { error: "This lot cannot be purchased right now." };
  }

  const amount = Number(listing.currentBid || listing.startingBid);
  if (!Number.isFinite(amount) || amount <= 0) {
    return { error: "This lot does not have a payable amount." };
  }

  const updated = await Listing.findOneAndUpdate(
    {
      _id: listingId,
      seller: { $ne: user.id },
      status: { $nin: ["CANCELLED", "SOLD"] },
    },
    {
      $set: {
        status: "SOLD",
        buyer: user.id,
        paidAt: new Date(),
        paidAmount: amount,
        paymentMethod: method,
      },
    },
    { new: true },
  );

  if (!updated) {
    return { error: "This lot was sold just now. Refresh and try another lot." };
  }

  await Payment.create({
    amount,
    method,
    reference: `AE-${Date.now().toString(36).toUpperCase()}`,
    payerName,
    payerPhone: method === "CARD" ? "" : payerPhone,
    last4: method === "CARD" ? cardNumber.slice(-4) : "",
    listing: listingId,
    buyer: user.id,
  });

  revalidatePath(`/auctions/${listingId}`);
  revalidatePath("/auctions");
  revalidatePath("/dashboard");
  revalidatePath("/");
  redirect(`/auctions/${listingId}?paid=1`);
}
