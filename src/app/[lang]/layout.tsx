import { RootProvider } from "fumadocs-ui/provider/next";
import { i18nProvider } from "fumadocs-ui/i18n";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { translations } from "@/lib/layout.shared";
import "../global.css";

export const metadata: Metadata = {
  title: { default: "Illyaverse", template: "%s · Illyaverse" },
  description: "Deploy, configure and run an Illyaverse osu! community server.",
};

export default async function Layout({
  params,
  children,
}: {
  params: Promise<{ lang: string }>;
  children: ReactNode;
}) {
  const { lang } = await params;
  return (
    <html lang={lang} suppressHydrationWarning>
      <body className="flex flex-col min-h-screen">
        <RootProvider i18n={i18nProvider(translations, lang)}>
          {children}
        </RootProvider>
      </body>
    </html>
  );
}
