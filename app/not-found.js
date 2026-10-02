import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-16 text-center sm:py-24">
      <p className="text-xs uppercase tracking-[0.22em] text-gold">404</p>
      <h1 className="display page-title mt-3 text-forest-deep">Lot not found</h1>
      <p className="mt-4 text-muted">
        That page is not in the catalogue. Return to the live auctions.
      </p>
      <Link
        href="/auctions"
        className="mt-8 inline-block rounded-full bg-forest px-6 py-3 text-sm text-paper"
      >
        Browse auctions
      </Link>
    </div>
  );
}
