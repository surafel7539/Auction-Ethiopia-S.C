"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AuthForm } from "@/components/AuthForm";
import { useI18n } from "@/components/LocaleProvider";

function AuthScreenForm({ mode }) {
  const params = useSearchParams();
  return (
    <AuthForm mode={mode} next={params.get("next") || "/dashboard"} />
  );
}

export function AuthScreen({ mode }) {
  const { t } = useI18n();
  return (
    <div className="mx-auto grid max-w-6xl items-center gap-8 px-4 py-10 lg:grid-cols-[0.9fr_1.1fr] lg:py-16">
      <div className="hidden overflow-hidden rounded-[2rem] bg-forest-deep p-10 text-on lg:block">
        <p className="text-xs uppercase tracking-[0.24em] text-yellow">Auction Ethiopia S.C</p>
        <p className="display mt-4 text-5xl leading-none">{t("authHeadline")}</p>
        <p className="mt-4 max-w-sm text-sm leading-7 text-on/75">
          {t("authBody")}
        </p>
      </div>
      <Suspense fallback={<div className="mx-auto h-80 max-w-md" />}>
        <AuthScreenForm mode={mode} />
      </Suspense>
    </div>
  );
}
