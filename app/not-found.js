import Link from "next/link";
import { getLocale } from "@/lib/locale";
import { translate } from "@/lib/messages";

export const dynamic = "force-dynamic";

export default async function NotFound() {
  const locale = await getLocale();
  const t = (key) => translate(locale, key);
  return (
    <div className="mx-auto max-w-xl px-4 py-20 text-center sm:py-28">
      <p className="text-xs uppercase tracking-[0.22em] text-gold">{t("notFoundKicker")}</p>
      <h1 className="display page-title mt-3 text-heading">{t("notFoundTitle")}</h1>
      <p className="mt-4 text-muted">
        {t("notFoundBody")}
      </p>
      <Link
        href="/auctions"
        className="mt-8 inline-block rounded-full bg-forest px-6 py-3 text-sm text-on"
      >
        {t("browseAuctions")}
      </Link>
    </div>
  );
}
