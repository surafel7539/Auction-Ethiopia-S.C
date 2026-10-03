"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { logoutAction } from "@/app/actions/auth";
import { BrandMark } from "@/components/BrandMark";

const links = [
  { href: "/auctions", label: "Auctions" },
  { href: "/categories", label: "Categories" },
  { href: "/sell", label: "Sell a lot" },
  { href: "/help", label: "How it works" },
];

export function Header() {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/me")
      .then((response) => (response.ok ? response.json() : { user: null }))
      .then((data) => {
        if (!cancelled) setUser(data.user || null);
      })
      .catch(() => {
        if (!cancelled) setUser(null);
      })
      .finally(() => {
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
              <span className="block truncate display text-lg text-forest-deep">
                Auction Ethiopia
              </span>
              <span className="block text-[10px] uppercase tracking-[0.2em] text-yellow">
                Share Company
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
              placeholder="Search lots"
              className="w-full rounded-full border border-forest/10 bg-white/80 px-4 py-2 text-sm outline-none"
            />
          </form>

          <div className="flex items-center gap-2 text-sm">
            {!ready ? (
              <span className="inline-block h-9 w-16" aria-hidden="true" />
            ) : user ? (
              <>
                <Link
                  href="/dashboard"
                  className="hidden rounded-full px-3 py-2 text-blue hover:bg-blue/10 sm:inline"
                >
                  {user.name.split(" ")[0]}
                </Link>
                <form action={logoutAction}>
                  <button
                    type="submit"
                    className="rounded-full bg-orange px-3.5 py-2 text-paper hover:bg-orange/90"
                  >
                    Sign out
                  </button>
                </form>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="hidden rounded-full px-3 py-2 text-blue hover:bg-blue/10 sm:inline"
                >
                  Sign in
                </Link>
                <Link
                  href="/register"
                  className="rounded-full bg-forest px-4 py-2 font-semibold text-paper hover:bg-forest-deep"
                >
                  Join
                </Link>
              </>
            )}
            <button
              type="button"
              className="grid h-11 w-11 place-items-center rounded-full border border-forest/15 text-forest lg:hidden"
              aria-expanded={open}
              aria-label="Toggle menu"
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
              placeholder="Search lots"
              className="w-full rounded-full border border-forest/15 bg-white px-4 py-2 text-sm outline-none"
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
                Dashboard
              </Link>
            ) : null}
            {ready && !user ? (
              <Link href="/login" className="rounded-2xl px-3 py-2" onClick={() => setOpen(false)}>
                Sign in
              </Link>
            ) : null}
          </nav>
        </div>
      ) : null}
    </header>
  );
}
