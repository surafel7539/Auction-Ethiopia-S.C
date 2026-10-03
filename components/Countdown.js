"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/components/LocaleProvider";

function getParts(endsAt) {
  const remaining = new Date(endsAt).getTime() - Date.now();
  if (remaining <= 0) {
    return { ended: true, label: "Auction ended" };
  }

  const totalSeconds = Math.floor(remaining / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const label =
    days > 0
      ? `${days}d ${hours}h ${minutes}m`
      : `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  return { ended: false, label };
}

export function Countdown({ endsAt, className = "" }) {
  const { t } = useI18n();
  const [parts, setParts] = useState(null);

  useEffect(() => {
    const tick = () => setParts(getParts(endsAt));
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [endsAt]);

  return (
    <span className={className} suppressHydrationWarning>
      {parts?.ended ? t("statusEnded") : parts?.label || "—"}
    </span>
  );
}
