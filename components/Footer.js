import Link from "next/link";
import { BrandMark } from "@/components/BrandMark";

export function Footer() {
  return (
    <footer className="mt-16 bg-forest-deep text-paper">
      <div className="flag-bar" />
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:grid-cols-2 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <Link href="/" className="flex items-center gap-3">
            <BrandMark className="h-12 w-12" />
            <p className="display text-3xl">Auction Ethiopia S.C</p>
          </Link>
          <p className="mt-4 max-w-sm text-sm leading-7 text-paper/75">
            Ethiopia&apos;s licensed auction house for vehicles, property,
            heritage lots, and commercial assets.
          </p>
        </div>
        <div className="lg:col-span-2">
          <p className="text-xs uppercase tracking-[0.22em] text-yellow">Browse</p>
          <div className="mt-4 flex flex-col gap-2 text-sm text-paper/85">
            <Link href="/auctions" className="hover:text-lime">Live auctions</Link>
            <Link href="/categories" className="hover:text-lime">Categories</Link>
            <Link href="/sell" className="hover:text-lime">Sell with us</Link>
          </div>
        </div>
        <div className="lg:col-span-2">
          <p className="text-xs uppercase tracking-[0.22em] text-orange">Company</p>
          <div className="mt-4 flex flex-col gap-2 text-sm text-paper/85">
            <Link href="/about" className="hover:text-lime">About the house</Link>
            <Link href="/help" className="hover:text-lime">How it works</Link>
            <a href="mailto:hello@auctionethiopia.com" className="hover:text-lime">Contact</a>
          </div>
        </div>
        <div className="lg:col-span-3">
          <p className="text-xs uppercase tracking-[0.22em] text-green">Head office</p>
          <p className="mt-4 text-sm leading-7 text-paper/75">
            Bole Road, Addis Ababa
            <br />
            +251 11 667 4400
            <br />
            Mon–Sat, 8:30–17:30
          </p>
        </div>
      </div>
      <p className="border-t border-white/10 px-4 py-5 text-center text-xs text-paper/55">
        © {new Date().getFullYear()} Auction Ethiopia Share Company. All rights reserved.
      </p>
    </footer>
  );
}
