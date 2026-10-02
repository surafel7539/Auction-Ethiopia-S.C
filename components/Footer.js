import Link from "next/link";
import { BrandMark } from "@/components/BrandMark";

export function Footer() {
  return (
    <footer className="mt-12 border-t border-forest/10 bg-forest-deep text-paper sm:mt-16">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-2 sm:py-12 lg:grid-cols-4 lg:gap-10">
        <div className="sm:col-span-2 lg:col-span-1">
          <Link href="/" className="flex items-center gap-3">
            <BrandMark className="h-12 w-12" />
            <p className="display text-2xl">Auction Ethiopia S.C</p>
          </Link>
          <p className="mt-3 text-sm text-gold-soft/80">
            Ethiopia&apos;s licensed auction house for vehicles, property,
            heritage lots, and commercial assets.
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-gold">Browse</p>
          <div className="mt-3 flex flex-col gap-2 text-sm">
            <Link href="/auctions">Live auctions</Link>
            <Link href="/categories">Categories</Link>
            <Link href="/sell">Sell with us</Link>
          </div>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-gold">Company</p>
          <div className="mt-3 flex flex-col gap-2 text-sm">
            <Link href="/about">About the house</Link>
            <Link href="/how-it-works">How bidding works</Link>
            <a href="mailto:hello@auctionethiopia.com">Contact</a>
          </div>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-gold">
            Head office
          </p>
          <p className="mt-3 text-sm leading-7 text-gold-soft/80">
            Bole Road, Addis Ababa
            <br />
            +251 11 667 4400
            <br />
            Mon–Sat, 8:30–17:30
          </p>
        </div>
      </div>
      <div className="flag-bar" />
      <p className="px-4 py-4 text-center text-xs text-gold-soft/70">
        © {new Date().getFullYear()} Auction Ethiopia Share Company. All rights
        reserved.
      </p>
    </footer>
  );
}
