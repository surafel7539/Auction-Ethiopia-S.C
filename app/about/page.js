import { getLocale } from "@/lib/locale";
import { translate } from "@/lib/messages";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const locale = await getLocale();
  return { title: translate(locale, "aboutHouse") };
}

export default async function AboutPage() {
  const locale = await getLocale();
  const t = (key) => translate(locale, key);
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:py-16">
      <p className="text-xs uppercase tracking-[0.22em] text-gold">{t("theHouse")}</p>
      <h1 className="display page-title mt-2 text-heading">
        {t("aboutTitle")}
      </h1>
      <div className="mt-6 space-y-5 text-base leading-7 text-muted sm:text-lg sm:leading-8">
        <p>{t("about1")}</p>
        <p>{t("about2")}</p>
        <p>{t("about3")}</p>
      </div>
    </div>
  );
}
