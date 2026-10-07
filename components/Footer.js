import Link from "next/link";
import { BrandMark } from "@/components/BrandMark";
import { getLocale } from "@/lib/locale";
import { translate } from "@/lib/messages";

export async function Footer() {
  const locale = await getLocale();
  const t = (key, vars) => translate(locale, key, vars);
  return (
    <footer className="mt-16 bg-forest-deep text-on">
      <div className="flag-bar" />
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:grid-cols-2 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <Link href="/" className="flex items-center gap-3">
            <BrandMark className="h-12 w-12" />
            <p className="display text-3xl">Crown Bid</p>
          </Link>
          <p className="mt-4 max-w-sm text-sm leading-7 text-on/75">
            {t("footerAbout")}
          </p>
        </div>
        <div className="lg:col-span-2">
          <p className="text-xs uppercase tracking-[0.22em] text-yellow">{t("browse")}</p>
          <div className="mt-4 flex flex-col gap-2 text-sm text-on/85">
            <Link href="/auctions" className="hover:text-lime">{t("liveAuctions")}</Link>
            <Link href="/categories" className="hover:text-lime">{t("categories")}</Link>
            <Link href="/suppliers" className="hover:text-lime">{t("suppliers")}</Link>
            <Link href="/sell" className="hover:text-lime">{t("sellWithUs")}</Link>
          </div>
        </div>
        <div className="lg:col-span-2">
          <p className="text-xs uppercase tracking-[0.22em] text-orange">{t("company")}</p>
          <div className="mt-4 flex flex-col gap-2 text-sm text-on/85">
            <Link href="/about" className="hover:text-lime">{t("aboutHouse")}</Link>
            <a href="mailto:hello@crownbid.com" className="hover:text-lime">{t("contact")}</a>
          </div>
        </div>
        <div className="lg:col-span-3">
          <p className="text-xs uppercase tracking-[0.22em] text-green">{t("headOffice")}</p>
          <p className="mt-4 text-sm leading-7 text-on/75">
            {t("officeAddress")}
            <br />
            +251 11 667 4400
            <br />
            {t("officeHours")}
          </p>
        </div>
      </div>
      <p className="border-t border-white/10 px-4 py-5 text-center text-xs text-on/55">
        {t("rights", { year: new Date().getFullYear() })}
      </p>
    </footer>
  );
}
