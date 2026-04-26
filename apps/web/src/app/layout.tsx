import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { readLocale, readTheme, localeDir } from "@/lib/settings";
import "./globals.css";

export const metadata: Metadata = {
  title: "PortVision — Operations Center",
  description: "AR-powered smart port operations dashboard",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = readLocale();
  const theme = readTheme();
  const messages = await getMessages();
  return (
    <html lang={locale} dir={localeDir(locale)} data-theme={theme}>
      <body>
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
