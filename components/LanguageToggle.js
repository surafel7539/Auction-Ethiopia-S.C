"use client";

import { useState } from "react";
import { setLocaleAction } from "@/app/actions/locale";
import { useI18n } from "@/components/LocaleProvider";

export function LanguageToggle() {
  const { locale, t } = useI18n();
  const [pending, setPending] = useState(false);
  const amharic = locale === "am";

  async function toggle() {
    if (pending) return;
    const next = amharic ? "en" : "am";
    setPending(true);
    await setLocaleAction(next);
    window.location.reload();
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      aria-pressed={amharic}
      aria-label={amharic ? t("switchToEnglish") : t("switchToAmharic")}
      className="grid h-11 min-w-11 place-items-center rounded-full border border-forest/15 px-2 text-xs font-semibold text-heading"
    >
      {amharic ? "EN" : "አማ"}
    </button>
  );
}
