import { cookies } from "next/headers";
import { translate } from "@/lib/messages";

export async function getLocale() {
  const store = await cookies();
  return store.get("auction-lang")?.value === "am" ? "am" : "en";
}

export async function formError(key, vars) {
  const locale = await getLocale();
  return { error: translate(locale, key, vars) };
}
