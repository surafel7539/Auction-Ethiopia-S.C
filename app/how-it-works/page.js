export const metadata = {
  title: "How it works",
};

const steps = [
  {
    title: "Create a client account",
    body: "Register as a buyer, seller, or both. Your session is stored securely so you can bid and consign from the same desk.",
  },
  {
    title: "Inspect the catalogue",
    body: "Every lot shows photographs, condition, city, current bid, increment, reserve status, and a live countdown.",
  },
  {
    title: "Filter what you want",
    body: "Search by keyword, set a price range, choose a city, or open a dedicated category page such as Vehicles or Agriculture.",
  },
  {
    title: "Place incremental bids",
    body: "Bids must meet the next increment. You cannot bid on your own consignment. The highest bid at close wins.",
  },
  {
    title: "Consign your own lot",
    body: "Sellers publish title, description, images, starting bid, increment, and auction length. Listings with no bids can be withdrawn.",
  },
  {
    title: "Track everything",
    body: "The client desk keeps your listings, latest bids, and watchlist in one place.",
  },
  {
    title: "Pay for the lot",
    body: "Buy a live lot at the current bid, or settle after you win. Payment can be recorded with Telebirr, CBE Birr, or card.",
  },
];

export default function HowItWorksPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:py-10">
      <p className="text-xs uppercase tracking-[0.22em] text-gold">Guidance</p>
      <h1 className="display page-title mt-2 text-forest-deep">How it works</h1>
      <p className="mt-3 text-sm text-muted sm:text-base">
        Auction Ethiopia S.C runs timed online sales. The rules are simple and
        the record is public to registered clients.
      </p>
      <ol className="mt-8 space-y-4 sm:mt-10 sm:space-y-6">
        {steps.map((step, index) => (
          <li
            key={step.title}
            className="card-shadow rounded-2xl border border-forest/10 bg-paper p-5 sm:p-6"
          >
            <p className="text-xs uppercase tracking-wide text-gold">
              Step {index + 1}
            </p>
            <h2 className="display mt-2 text-2xl text-forest-deep">
              {step.title}
            </h2>
            <p className="mt-2 text-muted">{step.body}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
