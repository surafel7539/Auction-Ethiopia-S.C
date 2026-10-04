import { Cormorant_Garamond, Source_Sans_3, Geist_Mono, Noto_Sans_Ethiopic } from "next/font/google";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { LocaleProvider } from "@/components/LocaleProvider";
import { getCurrentUser } from "@/lib/auth";
import { getLocale } from "@/lib/locale";
import { translate } from "@/lib/messages";
import "./globals.css";

const serif = Cormorant_Garamond({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const sans = Source_Sans_3({
  variable: "--font-body",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const ethiopic = Noto_Sans_Ethiopic({
  variable: "--font-ethiopic",
  subsets: ["ethiopic"],
  weight: ["400", "600", "700"],
});

export async function generateMetadata() {
  const locale = await getLocale();
  return {
    title: {
      default: "Auction Ethiopia S.C",
      template: "%s · Auction Ethiopia S.C",
    },
    description: translate(locale, "metaDescription"),
    icons: {
      icon: "/logo.jpg",
      apple: "/logo.jpg",
    },
  };
}

export default async function RootLayout({ children }) {
  const locale = await getLocale();
  const user = await getCurrentUser();
  const headerUser = user?.name ? { name: user.name } : null;
  return (
    <html
      lang={locale}
      suppressHydrationWarning
      className={`${serif.variable} ${sans.variable} ${geistMono.variable} ${ethiopic.variable} h-full antialiased`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("auction-theme");if(t==="dark"||(!t&&window.matchMedia("(prefers-color-scheme: dark)").matches)){document.documentElement.classList.add("dark")}}catch(e){}})();`,
          }}
        />
      </head>
      <body className="flex min-h-full flex-col font-sans text-foreground">
        <LocaleProvider locale={locale}>
          <Header user={headerUser} />
          <main className="flex-1">{children}</main>
          <Footer />
        </LocaleProvider>
      </body>
    </html>
  );
}
