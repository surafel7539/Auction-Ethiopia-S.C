"use client";

import { useState } from "react";
import Link from "next/link";
import { logoutAction } from "@/app/actions/auth";
import { BrandMark } from "@/components/BrandMark";

const links = [
  { href: "/auctions", label: "Auctions" },
  { href: "/categories", label: "Categories" },
  { href: "/sell", label: "Sell a lot" },
  { href: "/how-it-works", label: "How it works" },
];

export function Header({ user }) {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-forest/10 bg-paper/90 backdrop-blur">
      <div className="flag-bar" />
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="flex min-w-0 items-center gap-2 sm:gap-3">
          <BrandMark />
          <span className="min-w-0 leading-tight">
            <span className="block truncate display text-lg text-forest-deep sm:text-xl">
              Auction Ethiopia
            </span>
            <span className="block text-[10px] uppercase tracking-[0.18em] text-gold sm:text-[11px] sm:tracking-[0.22em]">
              Share Company
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-5 text-sm font-medium text-forest lg:flex">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-gold">
              {link.label}
            </Link>
          ))}
        </nav>

        <form action="/auctions" className="hidden flex-1 max-w-sm xl:block">
          <input
            type="search"
            name="q"
            placeholder="Search lots, cities, or categories"
            className="w-full rounded-full border border-forest/15 bg-white px-4 py-2 text-sm outline-none ring-gold/40 focus:ring-2"
          />
        </form>

        <div className="flex items-center gap-2 text-sm">
          {user ? (
            <>
              <Link
                href="/dashboard"
                className="hidden text-forest hover:text-gold sm:inline"
              >
                {user.name.split(" ")[0]}
              </Link>
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="rounded-full border border-forest/20 px-3 py-1.5 text-forest hover:bg-forest hover:text-paper"
                >
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden text-forest hover:text-gold sm:inline"
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className="rounded-full bg-forest px-3 py-1.5 text-paper hover:bg-forest-deep sm:px-4 sm:py-2"
              >
                Join
              </Link>
            </>
          )}
          <button
            type="button"
            className="grid h-11 w-11 place-items-center rounded-full border border-forest/20 text-forest lg:hidden"
            aria-expanded={open}
            aria-label="Toggle menu"
            onClick={() => setOpen((value) => !value)}
          >
            {open ? "✕" : "☰"}
          </button>
        </div>
      </div>

      {open ? (
        <div className="border-t border-forest/10 bg-paper px-4 py-4 lg:hidden">
          <form action="/auctions" className="mb-4">
            <input
              type="search"
              name="q"
              placeholder="Search lots"
              className="w-full rounded-full border border-forest/15 bg-white px-4 py-2 text-sm outline-none"
            />
          </form>
          <nav className="flex flex-col gap-3 text-base font-medium text-forest">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            {user ? (
              <Link href="/dashboard" onClick={() => setOpen(false)}>
                Dashboard
              </Link>
            ) : (
              <Link href="/login" onClick={() => setOpen(false)}>
                Sign in
              </Link>
            )}
          </nav>
        </div>
      ) : null}
    </header>
  );
}
