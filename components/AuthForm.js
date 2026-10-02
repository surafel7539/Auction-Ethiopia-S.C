"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { loginAction, registerAction } from "@/app/actions/auth";

export function AuthForm({ mode = "login", next = "/dashboard" }) {
  const action = mode === "register" ? registerAction : loginAction;
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form
      action={formAction}
      className="card-shadow mx-auto w-full max-w-md space-y-4 rounded-3xl border border-forest/10 bg-paper p-5 sm:p-8"
    >
      <input type="hidden" name="next" value={next} />
      <div>
        <p className="text-xs uppercase tracking-[0.22em] text-gold">
          Auction Ethiopia S.C
        </p>
        <h1 className="display mt-2 text-3xl text-forest-deep">
          {mode === "register" ? "Open an account" : "Client sign in"}
        </h1>
        <p className="mt-2 text-sm text-muted">
          {mode === "register"
            ? "Register with your legal name, licence, phone, and password."
            : "Sign in with your licence number and password."}
        </p>
      </div>

      {mode === "register" ? (
        <>
          <input
            name="legalName"
            required
            autoComplete="name"
            placeholder="Legal name"
            className="w-full rounded-xl border border-forest/15 px-3 py-2 text-lg"
          />
          <input
            name="phone"
            type="tel"
            required
            autoComplete="tel"
            placeholder="Phone number"
            className="w-full rounded-xl border border-forest/15 px-3 py-2 text-lg"
          />
          <select
            name="role"
            defaultValue="BOTH"
            className="w-full rounded-xl border border-forest/15 bg-white px-3 py-2 text-lg"
          >
            <option value="BUYER">Buyer</option>
            <option value="SELLER">Seller</option>
            <option value="BOTH">Buyer and seller</option>
          </select>
        </>
      ) : null}

      <input
        name="licenceNumber"
        required
        autoComplete="username"
        placeholder="Licence number"
        className="w-full rounded-xl border border-forest/15 px-3 py-2 text-lg"
      />
      <PasswordField
        autoComplete={mode === "register" ? "new-password" : "current-password"}
        placeholder={mode === "register" ? "Password (8+ characters)" : "Password"}
      />

      {state?.error ? <p className="text-sm text-clay">{state.error}</p> : null}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full bg-forest py-3 text-sm font-semibold text-paper disabled:opacity-60"
      >
        {pending
          ? "Please wait..."
          : mode === "register"
            ? "Create account"
            : "Sign in"}
      </button>

      <p className="text-center text-sm text-muted">
        {mode === "register" ? (
          <>
            Already registered?{" "}
            <Link href={`/login?next=${encodeURIComponent(next)}`} className="text-forest">
              Sign in
            </Link>
          </>
        ) : (
          <>
            New client?{" "}
            <Link href={`/register?next=${encodeURIComponent(next)}`} className="text-forest">
              Create an account
            </Link>
          </>
        )}
      </p>

      {mode === "login" ? (
        <p className="rounded-xl bg-gold-soft/40 px-3 py-2 text-xs text-forest-deep">
          Demo buyer licence: AE-BUY-001 / Demo1234!
        </p>
      ) : null}
    </form>
  );
}

function PasswordField({ autoComplete, placeholder }) {
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
        aria-label={visible ? "Hide password" : "Show password"}
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
