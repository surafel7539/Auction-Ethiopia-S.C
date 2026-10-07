"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { logoutAction } from "@/app/actions/auth";
import { BrandMark } from "@/components/BrandMark";
import { LanguageToggle } from "@/components/LanguageToggle";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useI18n } from "@/components/LocaleProvider";

export function Header({ user: initialUser = null }) {
  const { t } = useI18n();
  const links = [
    { href: "/auctions", label: t("auctions") },
    { href: "/categories", label: t("categories") },
    { href: "/suppliers", label: t("suppliers") },
    { href: "/sell", label: t("sellLot") },
  ];
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState(initialUser);
  const [ready, setReady] = useState(Boolean(initialUser));

  useEffect(() => {
    let cancelled = false;
    fetch("/api/me")
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (cancelled || !data) return;
        setUser(data.user || null);
        setReady(true);
      })
      .catch(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <header className="sticky top-0 z-40">
      <div className="flag-bar" />
      <div className="px-3 pt-3 sm:px-4">
        <div className="panel mx-auto flex max-w-7xl items-center justify-between gap-3 rounded-full px-3 py-2 sm:px-4">
          <Link href="/" className="flex min-w-0 items-center gap-2.5">
            <BrandMark className="h-10 w-10" />
            <span className="min-w-0 leading-tight">
              <span className="block truncate display text-lg text-heading">
                Crown Bid
              </span>
              <span className="block text-[10px] uppercase tracking-[0.2em] text-yellow">
                {t("shareCompany")}
              </span>
            </span>
          </Link>

          <nav className="hidden items-center gap-1 text-sm font-medium text-blue lg:flex">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-full px-3 py-2 transition hover:bg-blue/10 hover:text-forest"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <form action="/auctions" className="hidden min-w-0 flex-1 max-w-xs xl:block">
            <input
              type="search"
              name="q"
              placeholder={t("searchLots")}
              className="w-full rounded-full border border-forest/10 bg-field/80 px-4 py-2 text-sm outline-none"
            />
          </form>

          <div className="flex shrink-0 items-center gap-2 text-sm">
            {!ready ? (
              <span className="inline-block h-9 w-16" aria-hidden="true" />
            ) : user ? (
              <>
                <Link
                  href="/dashboard"
                  className="max-w-[7rem] truncate rounded-full px-2 py-2 text-blue hover:bg-blue/10 sm:max-w-28 sm:px-3"
                >
                  {user.name.split(" ")[0]}
                </Link>
                <form action={logoutAction}>
                  <button
                    type="submit"
                    className="rounded-full bg-orange px-3.5 py-2 text-on hover:bg-orange/90"
                  >
                    {t("signOut")}
                  </button>
                </form>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="hidden rounded-full px-3 py-2 text-blue hover:bg-blue/10 sm:inline"
                >
                  {t("signIn")}
                </Link>
                <Link
                  href="/register"
                  className="rounded-full bg-forest px-4 py-2 font-semibold text-on hover:bg-forest-deep"
                >
                  {t("join")}
                </Link>
              </>
            )}
            <LanguageToggle />
            <ThemeToggle />
            <button
              type="button"
              className="grid h-11 w-11 place-items-center rounded-full border border-forest/15 text-forest lg:hidden"
              aria-expanded={open}
              aria-label={t("toggleMenu")}
              onClick={() => setOpen((value) => !value)}
            >
              {open ? "✕" : "☰"}
            </button>
          </div>
        </div>
      </div>

      {open ? (
        <div className="panel mx-3 mt-2 rounded-3xl px-4 py-4 lg:hidden">
          <form action="/auctions" className="mb-4">
            <input
              type="search"
              name="q"
              placeholder={t("searchLots")}
              className="w-full rounded-full border border-forest/15 bg-field px-4 py-2 text-sm outline-none"
            />
          </form>
          <nav className="flex flex-col gap-1 text-base font-medium text-blue">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-2xl px-3 py-2 hover:bg-blue/10"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            {ready && user ? (
              <Link href="/dashboard" className="rounded-2xl px-3 py-2" onClick={() => setOpen(false)}>
                {t("dashboard")}
              </Link>
            ) : null}
            {ready && !user ? (
              <Link href="/login" className="rounded-2xl px-3 py-2" onClick={() => setOpen(false)}>
                {t("signIn")}
              </Link>
            ) : null}
          </nav>
        </div>
      ) : null}
    </header>
  );
}
