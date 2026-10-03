"use client";

import { toggleWatchAction } from "@/app/actions/watch";
import { useI18n } from "@/components/LocaleProvider";

export function WatchButton({ listingId, watching }) {
  const { t } = useI18n();
  return (
    <form action={toggleWatchAction.bind(null, listingId)}>
      <button
        type="submit"
        className="w-full rounded-full border border-forest/20 bg-field px-4 py-2 text-sm font-medium text-forest hover:bg-forest hover:text-on sm:w-auto"
      >
        {watching ? t("watching") : t("watchLot")}
      </button>
    </form>
  );
}
