"use server";

import { cookies } from "next/headers";

export async function setLocaleAction(locale) {
  const store = await cookies();
  store.set("auction-lang", locale === "am" ? "am" : "en", {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
}
