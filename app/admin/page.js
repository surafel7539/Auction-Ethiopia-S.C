import Link from "next/link";
import { adminCancelListingAction, adminCloseListingAction } from "@/app/actions/admin";
import { requireAdmin } from "@/lib/auth";
import { getAdminListings, getAdminPayments, getAdminStats, getAdminUsers } from "@/lib/admin";
import { formatDate, formatETB, statusLabel } from "@/lib/format";
import { getLocale } from "@/lib/locale";
import { translate } from "@/lib/messages";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const locale = await getLocale();
  return { title: translate(locale, "adminTitle") };
}

export default async function AdminPage() {
  const locale = await getLocale();
  const t = (key, vars) => translate(locale, key, vars);
  await requireAdmin();
  const [stats, listings, users, payments] = await Promise.all([
    getAdminStats(),
    getAdminListings(),
    getAdminUsers(),
    getAdminPayments(),
  ]);

  const cards = [
    { label: t("adminClients"), value: String(stats.users) },
    { label: t("adminLiveLots"), value: String(stats.live) },
    { label: t("adminScheduledLots"), value: String(stats.scheduled) },
    { label: t("adminSoldLots"), value: String(stats.sold) },
    { label: t("adminSettlements"), value: formatETB(stats.volume, locale) },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:py-12">
      <p className="text-xs uppercase tracking-[0.22em] text-gold">{t("adminKicker")}</p>
      <h1 className="display page-title mt-2 text-heading">{t("adminTitle")}</h1>
      <p className="mt-3 max-w-2xl text-muted">{t("adminBody")}</p>

      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {cards.map((card) => (
          <div key={card.label} className="panel rounded-3xl p-5">
            <p className="text-[11px] uppercase tracking-[0.18em] text-yellow">{card.label}</p>
            <p className="display mt-2 text-3xl text-heading">{card.value}</p>
          </div>
        ))}
      </div>

      <section className="mt-12">
        <h2 className="display section-title text-heading">{t("adminLots")}</h2>
        {listings.length ? (
          <div className="panel mt-5 overflow-x-auto rounded-[1.6rem]">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="bg-forest text-on">
                <tr>
                  <th className="px-4 py-3">{t("lot")}</th>
                  <th className="px-4 py-3">{t("adminSeller")}</th>
                  <th className="px-4 py-3">{t("bidColumn")}</th>
                  <th className="px-4 py-3">{t("status")}</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {listings.map((listing) => (
                  <tr key={listing.id} className="border-t border-forest/10">
                    <td className="px-4 py-3">
                      <Link href={`/auctions/${listing.id}`} className="font-medium text-heading">
                        {listing.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-muted">{listing.seller?.name || "—"}</td>
                    <td className="px-4 py-3">
                      {formatETB(listing.currentBid, locale)} · {t("bidsCount", { count: listing._count.bids })}
                    </td>
                    <td className="px-4 py-3">{statusLabel(listing.computedStatus, locale)}</td>
                    <td className="px-4 py-3 text-right">
                      {listing.computedStatus === "LIVE" || listing.computedStatus === "SCHEDULED" ? (
                        <div className="flex justify-end gap-3">
                          {listing.computedStatus === "LIVE" ? (
                            <form action={adminCloseListingAction.bind(null, listing.id)}>
                              <button className="text-orange">{t("adminClose")}</button>
                            </form>
                          ) : null}
                          <form action={adminCancelListingAction.bind(null, listing.id)}>
                            <button className="text-clay">{t("cancel")}</button>
                          </form>
                        </div>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-4 text-sm text-muted">{t("adminNoLots")}</p>
        )}
      </section>

      <section className="mt-12">
        <h2 className="display section-title text-heading">{t("adminUsers")}</h2>
        <div className="panel mt-5 overflow-x-auto rounded-[1.6rem]">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="bg-forest text-on">
              <tr>
                <th className="px-4 py-3">{t("legalName")}</th>
                <th className="px-4 py-3">{t("licenceNumber")}</th>
                <th className="px-4 py-3">{t("phoneNumber")}</th>
                <th className="px-4 py-3">{t("adminRole")}</th>
              </tr>
            </thead>
            <tbody>
              {users.map((person) => (
                <tr key={person.id} className="border-t border-forest/10">
                  <td className="px-4 py-3 font-medium text-heading">{person.legalName}</td>
                  <td className="px-4 py-3">{person.licenceNumber}</td>
                  <td className="px-4 py-3">{person.phone}</td>
                  <td className="px-4 py-3">
                    {t(
                      person.role === "ADMIN"
                        ? "roleAdmin"
                        : person.role === "SELLER"
                          ? "roleSeller"
                          : person.role === "BOTH"
                            ? "roleBoth"
                            : "roleBuyer",
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-12">
        <h2 className="display section-title text-heading">{t("adminPayments")}</h2>
        {payments.length ? (
          <div className="panel mt-5 overflow-x-auto rounded-[1.6rem]">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="bg-forest text-on">
                <tr>
                  <th className="px-4 py-3">{t("lot")}</th>
                  <th className="px-4 py-3">{t("adminPayer")}</th>
                  <th className="px-4 py-3">{t("amountDue")}</th>
                  <th className="px-4 py-3">{t("paymentMethod")}</th>
                  <th className="px-4 py-3">{t("adminWhen")}</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.id} className="border-t border-forest/10">
                    <td className="px-4 py-3">
                      <Link href={`/auctions/${payment.listingId}`} className="font-medium text-heading">
                        {payment.listingTitle}
                      </Link>
                    </td>
                    <td className="px-4 py-3">{payment.payerName}</td>
                    <td className="px-4 py-3">{formatETB(payment.amount, locale)}</td>
                    <td className="px-4 py-3">{payment.method}</td>
                    <td className="px-4 py-3 text-muted">{formatDate(payment.createdAt, locale)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-4 text-sm text-muted">{t("adminNoPayments")}</p>
        )}
      </section>
    </div>
  );
}
