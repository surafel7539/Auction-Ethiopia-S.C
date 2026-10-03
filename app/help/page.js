import Link from "next/link";

export const dynamic = "force-static";

export const metadata = {
  title: "How it works",
};

const steps = [
  {
    title: "Create a client account",
    body: "Register as a buyer, seller, or both. Your session stays on this device so you can bid and consign from the same desk.",
  },
  {
    title: "Inspect the catalogue",
    body: "Every lot shows photographs, condition, city, current bid, increment, reserve status, and the time left.",
  },
  {
    title: "Filter what you want",
    body: "Search by keyword, set a price range, choose a city, or open a department such as Vehicles or Agriculture.",
  },
  {
    title: "Place incremental bids",
    body: "Each bid must meet the next increment. You cannot bid on your own consignment. The seller does not choose a bid.",
  },
  {
    title: "Two quiet hours close the lot",
    body: "After a bid, the lot stays open for two hours. A new bid starts that window again. If nobody bids in those two hours, the last bid wins. The scheduled close still applies if it comes first, and a lot with no bids simply ends with no winner.",
  },
  {
    title: "The winner pays the house",
    body: "There is no buy-now button. When the lot has ended, only the winning bidder can pay with Telebirr, CBE Birr, or card. The lot is then marked Sold.",
  },
];

export default function HelpPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:py-10">
      <p className="text-xs uppercase tracking-[0.22em] text-yellow">
        How it works
      </p>
      <h1 className="display page-title mt-2 text-blue">How a sale works</h1>
      <p className="mt-3 text-sm text-muted sm:text-base">
        Auction Ethiopia S.C is a timed house. The clock chooses the winner.
        Sellers and bidders do not exchange phone numbers on this site.
        Settlement goes through the house payment page.
      </p>

      <ol className="mt-8 space-y-4">
        {steps.map((step, index) => (
          <li
            key={step.title}
            className="card-shadow rounded-2xl border border-forest/10 bg-paper p-5 sm:p-6"
          >
            <p className="text-xs uppercase tracking-wide text-yellow">
              Step {index + 1}
            </p>
            <h2 className="display mt-2 text-2xl text-forest-deep">{step.title}</h2>
            <p className="mt-2 text-sm leading-7 text-muted sm:text-base">
              {step.body}
            </p>
          </li>
        ))}
      </ol>

      <section className="card-shadow mt-4 rounded-2xl border border-forest/10 bg-paper p-5 sm:p-6">
        <h2 className="display text-2xl text-forest-deep">Sellers</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-7 text-muted sm:text-base">
          <li>
            Publish a lot with photographs, starting bid, increment, city, and
            duration.
          </li>
          <li>
            Bid history shows the bidder&apos;s legal name and amount only.
          </li>
          <li>
            Phone numbers stay private. The house does not pass contact details
            between seller and bidder.
          </li>
          <li>
            A listing with no bids can be cancelled from the client desk. A
            listing with bids cannot.
          </li>
        </ul>
      </section>

      <section className="card-shadow mt-4 rounded-2xl border border-forest/10 bg-paper p-5 sm:p-6">
        <h2 className="display text-2xl text-forest-deep">Payment methods</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-7 text-muted sm:text-base">
          <li>
            <strong className="text-green">Telebirr</strong> — name on the
            account and an Ethiopian mobile number.
          </li>
          <li>
            <strong className="text-blue">CBE Birr</strong> — the same fields,
            recorded as a CBE transfer.
          </li>
          <li>
            <strong className="text-yellow">Card</strong> — name, card number,
            expiry, and CVV. This is a demo record; no live charge is sent.
          </li>
        </ul>
        <Link
          href="/dashboard"
          className="mt-5 inline-block rounded-full bg-green px-5 py-2 text-sm font-semibold text-paper"
        >
          Open client desk
        </Link>
      </section>

      <p className="mt-8 text-sm text-muted">
        Demo buyer for a closed lot: licence{" "}
        <strong className="text-forest-deep">AE-BUY-001</strong>, password{" "}
        <strong className="text-forest-deep">Demo1234!</strong>. That account
        holds the winning bid on the Imperial-Era Silver Coin Collection.
      </p>
    </div>
  );
}
