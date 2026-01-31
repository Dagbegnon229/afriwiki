import type { Metadata } from "next";
import { AppearanceProvider } from "@/components/AppearanceProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "AfriWiki — L'encyclopédie des entrepreneurs africains",
  description:
    "AfriWiki est l'encyclopédie libre des entrepreneurs africains que vous pouvez améliorer.",
  keywords: [
    "entrepreneurs africains",
    "startup afrique",
    "business africa",
    "fondateurs africains",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        {/* Google Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Source+Sans+3:wght@400;600;700&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <AppearanceProvider>{children}</AppearanceProvider>
      </body>
    </html>
  );
}
