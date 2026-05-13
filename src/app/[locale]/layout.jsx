import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { Inter, Fraunces, JetBrains_Mono } from "next/font/google";
import { routing } from "@/i18n/routing";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PageTransition from "@/components/PageTransition";
import "../globals.css";

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-inter",
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
  axes: ["SOFT", "opsz"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin", "cyrillic"],
  variable: "--font-jetbrains",
  display: "swap",
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const titles = {
    ru: "KINO — Смотреть фильмы онлайн",
    en: "KINO — Watch Movies Online",
    uz: "KINO — Filmlarni onlayn tomosha qiling",
  };
  const descriptions = {
    ru: "Смотрите фильмы и сериалы онлайн бесплатно в HD качестве",
    en: "Watch movies and TV series online for free in HD quality",
    uz: "Filmlar va seriallarni onlayn bepul HD sifatda tomosha qiling",
  };
  return {
    title: { default: titles[locale] || titles.ru, template: `%s — KINO` },
    description: descriptions[locale] || descriptions.ru,
  };
}

export default async function LocaleLayout({ children, params }) {
  const { locale } = await params;

  if (!routing.locales.includes(locale)) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <html
      lang={locale}
      className={`dark ${inter.variable} ${fraunces.variable} ${jetbrainsMono.variable}`}
    >
      <head>
        <meta name="theme-color" content="#07070b" />
        <link rel="preconnect" href="https://image.tmdb.org" />
      </head>
      <body className="min-h-screen flex flex-col">
        <NextIntlClientProvider messages={messages}>
          <Header />
          <main className="flex-1">
            <PageTransition>{children}</PageTransition>
          </main>
          <Footer />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
