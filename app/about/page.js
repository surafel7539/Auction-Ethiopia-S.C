export const metadata = {
  title: "About",
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:py-10">
      <p className="text-xs uppercase tracking-[0.22em] text-gold">The house</p>
      <h1 className="display page-title mt-2 text-forest-deep">
        About Auction Ethiopia S.C
      </h1>
      <div className="mt-6 space-y-5 text-base leading-7 text-muted sm:text-lg sm:leading-8">
        <p>
          Auction Ethiopia Share Company is a digital auction house built for
          Ethiopian buyers and sellers. The catalogue covers vehicles, real
          estate, art, jewelry, industrial plant, agricultural lots, and
          collectibles.
        </p>
        <p>
          Sales are timed and incremental. Each bid is attributed to a
          registered client. If two hours pass after the last bid, or the
          scheduled close arrives first, that last bid wins. Sellers keep
          control of starting prices, increments, reserves, and photographs.
        </p>
        <p>
          Head office is on Bole Road, Addis Ababa, with lots offered from
          cities across the country including Dire Dawa, Hawassa, Bahir Dar,
          Mekelle, Adama, Jimma, and Gondar.
        </p>
      </div>
    </div>
  );
}
