"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { formError } from "@/lib/locale";
import { getAuctionStatus } from "@/lib/format";
import {
  findHighestBid,
  findListingById,
  insertPayment,
  markListingSold,
} from "@/lib/models";
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
    return formError("errSignInPay");
  }

  const listingId = clean(formData.get("listingId"));
  const method = clean(formData.get("method"));
  const payerName = clean(formData.get("payerName"));
  const payerPhone = clean(formData.get("payerPhone"));
  const cardNumber = digits(formData.get("cardNumber"));
  const expiry = clean(formData.get("expiry"));
  const cvv = digits(formData.get("cvv"));

  if (!isValidId(listingId)) {
    return formError("errLotMissing");
  }
  if (!METHODS[method]) {
    return formError("errPayMethod");
  }
  if (payerName.length < 3) {
    return formError("errPayerName");
  }

  if (method === "TELEBIRR" || method === "CBE_BIRR") {
    const phone = digits(payerPhone);
    if (phone.length < 9 || phone.length > 12) {
      return formError("errMobile");
    }
  }

  if (method === "CARD") {
    if (cardNumber.length < 13 || cardNumber.length > 19) {
      return formError("errCard");
    }
    if (!/^\d{2}\/\d{2}$/.test(expiry)) {
      return formError("errExpiry");
    }
    if (cvv.length < 3 || cvv.length > 4) {
      return formError("errCvv");
    }
  }

  const listing = await findListingById(listingId);
  if (!listing) {
    return formError("errLotMissing");
  }
  if (String(listing.sellerId) === user.id) {
    return formError("errOwnBuy");
  }

  const status = getAuctionStatus(listing);
  if (status === "SOLD") {
    return formError("errAlreadyPaid");
  }
  if (status === "CANCELLED") {
    return formError("errNotForSale");
  }
  if (status !== "ENDED") {
    return formError("errStillOpen");
  }

  const highest = await findHighestBid(listingId);
  if (!highest || String(highest.bidder?.id) !== user.id) {
    return formError("errWinnerOnly");
  }

  const amount = Number(listing.currentBid || listing.startingBid);
  if (!Number.isFinite(amount) || amount <= 0) {
    return formError("errNoAmount");
  }

  const updated = await markListingSold({
    listingId,
    userId: user.id,
    amount,
    paymentMethod: method,
  });

  if (!updated) {
    return formError("errSoldRace");
  }

  await insertPayment({
    amount,
    method,
    reference: `AE-${Date.now().toString(36).toUpperCase()}`,
    payerName,
    payerPhone: method === "CARD" ? "" : payerPhone,
    last4: method === "CARD" ? cardNumber.slice(-4) : "",
    listingId,
    buyerId: user.id,
  });

  revalidatePath(`/auctions/${listingId}`);
  revalidatePath("/auctions");
  revalidatePath("/dashboard");
  revalidatePath("/");
  redirect(`/auctions/${listingId}?paid=1`);
}
