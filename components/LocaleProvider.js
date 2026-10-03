"use client";

import { createContext, useContext } from "react";
import { translate } from "@/lib/messages";

const LocaleContext = createContext("en");

export function LocaleProvider({ locale, children }) {
  return <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>;
}

export function useI18n() {
  const locale = useContext(LocaleContext);
  return {
    locale,
    t: (key, vars) => translate(locale, key, vars),
  };
}
