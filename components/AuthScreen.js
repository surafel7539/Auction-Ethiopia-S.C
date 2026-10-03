"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AuthForm } from "@/components/AuthForm";

function AuthScreenForm({ mode }) {
  const params = useSearchParams();
  return (
    <AuthForm mode={mode} next={params.get("next") || "/dashboard"} />
  );
}

export function AuthScreen({ mode }) {
  return (
    <Suspense fallback={<div className="mx-auto h-80 max-w-md" />}>
      <AuthScreenForm mode={mode} />
    </Suspense>
  );
}
