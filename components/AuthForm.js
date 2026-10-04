"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { loginAction, registerAction } from "@/app/actions/auth";
import { useI18n } from "@/components/LocaleProvider";

const fieldClass = "w-full rounded-xl border border-forest/15 bg-field px-3 py-2 text-lg";

export function AuthForm({ mode = "login", next = "/dashboard" }) {
  const { t } = useI18n();
  const action = mode === "register" ? registerAction : loginAction;
  const [state, formAction, pending] = useActionState(action, {});
  const [role, setRole] = useState("BOTH");
  const [kind, setKind] = useState("");
  const selling = role === "SELLER" || role === "BOTH";

  return (
    <form
      action={formAction}
      className="panel mx-auto w-full max-w-md space-y-4 rounded-[1.8rem] p-5 sm:p-8"
    >
      <input type="hidden" name="next" value={next} />
      <div>
        <p className="text-xs uppercase tracking-[0.22em] text-gold">
          Auction Ethiopia S.C
        </p>
        <h1 className="display mt-2 text-3xl text-heading">
          {mode === "register" ? t("openAccount") : t("clientSignIn")}
        </h1>
        <p className="mt-2 text-sm text-muted">
          {mode === "register" ? t("registerHelp") : t("signInHelp")}
        </p>
      </div>

      {mode === "register" ? (
        <>
          <select
            name="role"
            value={role}
            onChange={(event) => setRole(event.target.value)}
            className={fieldClass}
          >
            <option value="BUYER">{t("buyer")}</option>
            <option value="SELLER">{t("seller")}</option>
            <option value="BOTH">{t("buyerAndSeller")}</option>
          </select>
          {selling ? (
            <div>
              <p className="mb-2 text-xs uppercase tracking-[0.18em] text-yellow">{t("sellingAs")}</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  aria-pressed={kind === "INDIVIDUAL"}
                  onClick={() => setKind("INDIVIDUAL")}
                  className={`rounded-2xl border px-3 py-3 text-sm font-semibold ${
                    kind === "INDIVIDUAL"
                      ? "border-forest bg-forest text-on"
                      : "border-forest/15 bg-field text-heading"
                  }`}
                >
                  {t("individual")}
                </button>
                <button
                  type="button"
                  aria-pressed={kind === "ORGANISATION"}
                  onClick={() => setKind("ORGANISATION")}
                  className={`rounded-2xl border px-3 py-3 text-sm font-semibold ${
                    kind === "ORGANISATION"
                      ? "border-forest bg-forest text-on"
                      : "border-forest/15 bg-field text-heading"
                  }`}
                >
                  {t("organisation")}
                </button>
              </div>
              {kind ? <input type="hidden" name="accountKind" value={kind} /> : null}
            </div>
          ) : null}
          {!selling || kind === "INDIVIDUAL" ? (
            <input
              name="legalName"
              required
              autoComplete="name"
              placeholder={t("legalName")}
              className={fieldClass}
            />
          ) : null}
          {selling && kind === "ORGANISATION" ? (
            <>
              <input
                name="legalName"
                required
                autoComplete="organization"
                placeholder={t("companyName")}
                className={fieldClass}
              />
              <input
                name="contactName"
                required
                autoComplete="name"
                placeholder={t("contactPerson")}
                className={fieldClass}
              />
              <input
                name="city"
                placeholder={t("supplierCity")}
                className={fieldClass}
              />
            </>
          ) : null}
          {!selling || kind ? (
            <input
              name="phone"
              type="tel"
              required
              autoComplete="tel"
              placeholder={t("phoneNumber")}
              className={fieldClass}
            />
          ) : null}
        </>
      ) : null}

      {mode === "login" || !selling || kind ? (
        <>
          <input
            name="licenceNumber"
            required
            autoComplete="username"
            placeholder={selling && kind === "ORGANISATION" ? t("tradeLicence") : t("licenceNumber")}
            className={fieldClass}
          />
          <PasswordField
            autoComplete={mode === "register" ? "new-password" : "current-password"}
            placeholder={mode === "register" ? t("passwordHint") : t("password")}
          />
        </>
      ) : null}

      {state?.error ? <p className="text-sm text-clay">{state.error}</p> : null}

      <button
        type="submit"
        disabled={pending || (mode === "register" && selling && !kind)}
        className="w-full rounded-full bg-forest py-3 text-sm font-semibold text-on disabled:opacity-60"
      >
        {pending ? t("pleaseWait") : mode === "register" ? t("createAccount") : t("signIn")}
      </button>

      <p className="text-center text-sm text-muted">
        {mode === "register" ? (
          <>
            {t("alreadyRegistered")}{" "}
            <Link href={`/login?next=${encodeURIComponent(next)}`} className="text-forest">
              {t("signIn")}
            </Link>
          </>
        ) : (
          <>
            {t("newClient")}{" "}
            <Link href={`/register?next=${encodeURIComponent(next)}`} className="text-forest">
              {t("createAnAccount")}
            </Link>
          </>
        )}
      </p>

      {mode === "login" ? (
        <p className="rounded-xl bg-gold-soft/40 px-3 py-2 text-xs text-heading">
          {t("demoBuyer")}
        </p>
      ) : null}
    </form>
  );
}

function PasswordField({ autoComplete, placeholder }) {
  const { t } = useI18n();
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        type={visible ? "text" : "password"}
        name="password"
        required
        minLength={8}
        autoComplete={autoComplete}
        placeholder={placeholder}
        className="w-full rounded-xl border border-forest/15 py-2 pl-3 pr-10 text-lg"
      />
      <button
        type="button"
        onClick={() => setVisible((open) => !open)}
        aria-pressed={visible}
        aria-label={visible ? t("hidePassword") : t("showPassword")}
        className="absolute inset-y-0 right-1 my-1 flex w-9 items-center justify-center rounded-lg text-forest hover:bg-gold-soft/60"
      >
        {visible ? <EyeOffIcon /> : <EyeIcon />}
      </button>
    </div>
  );
}

function EyeIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2.1 12s3.6-6.5 9.9-6.5S21.9 12 21.9 12 18.3 18.5 12 18.5 2.1 12 2.1 12Z" />
      <circle cx="12" cy="12" r="2.6" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 3l18 18" />
      <path d="M10.6 10.6A2.6 2.6 0 0 0 12 14.6a2.6 2.6 0 0 0 2.4-1.6" />
      <path d="M9.9 5.6A10.7 10.7 0 0 1 12 5.5c6.3 0 9.9 6.5 9.9 6.5a16.7 16.7 0 0 1-3.4 3.9" />
      <path d="M6.6 6.6A16.4 16.4 0 0 0 2.1 12S5.7 18.5 12 18.5a10.8 10.8 0 0 0 3.3-.5" />
    </svg>
  );
}
