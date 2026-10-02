"use server";

import { redirect } from "next/navigation";
import { connectDB } from "@/lib/db";
import { User } from "@/lib/models";
import { toUserDTO } from "@/lib/serialize";
import {
  createSession,
  clearSession,
  hashPassword,
  verifyPassword,
} from "@/lib/auth";

function clean(value) {
  return String(value || "").trim();
}

function normalizeLicence(value) {
  return clean(value).replace(/\s+/g, "").toUpperCase();
}

function normalizePhone(value) {
  return clean(value).replace(/[^\d+]/g, "");
}

export async function registerAction(_, formData) {
  const legalName = clean(formData.get("legalName"));
  const licenceNumber = normalizeLicence(formData.get("licenceNumber"));
  const phone = normalizePhone(formData.get("phone"));
  const password = String(formData.get("password") || "");
  const role = clean(formData.get("role")) || "BUYER";
  const next = clean(formData.get("next")) || "/dashboard";

  if (legalName.length < 2) {
    return { error: "Please enter your legal name." };
  }
  if (licenceNumber.length < 4) {
    return { error: "Enter a valid licence number." };
  }
  if (phone.replace(/\D/g, "").length < 9) {
    return { error: "Enter a valid phone number." };
  }
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }
  if (!["BUYER", "SELLER", "BOTH"].includes(role)) {
    return { error: "Please choose a valid account type." };
  }

  await connectDB();
  const existing = await User.findOne({
    $or: [{ licenceNumber }, { phone }],
  });
  if (existing?.licenceNumber === licenceNumber) {
    return { error: "An account with this licence number already exists." };
  }
  if (existing?.phone === phone) {
    return { error: "An account with this phone number already exists." };
  }

  const user = await User.create({
    legalName,
    licenceNumber,
    phone,
    passwordHash: await hashPassword(password),
    role,
  });

  await createSession(toUserDTO(user));
  redirect(next.startsWith("/") ? next : "/dashboard");
}

export async function loginAction(_, formData) {
  const licenceNumber = normalizeLicence(formData.get("licenceNumber"));
  const password = String(formData.get("password") || "");
  const next = clean(formData.get("next")) || "/dashboard";

  await connectDB();
  const user = await User.findOne({ licenceNumber });
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return { error: "Invalid licence number or password." };
  }

  await createSession(toUserDTO(user));
  redirect(next.startsWith("/") ? next : "/dashboard");
}

export async function logoutAction() {
  await clearSession();
  redirect("/");
}
