import type { Metadata } from "next";
import { AppearanceProvider } from "@/components/AppearanceProvider";
import "./globals.css";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://afriwiki.vercel.app';

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "AfriWiki — L'encyclopédie des entrepreneurs africains",
    template: "%s | AfriWiki",
  },
  description:
    "Découvrez les parcours inspirants des entrepreneurs africains. AfriWiki est l'encyclopédie collaborative dédiée aux fondateurs de startups, chefs d'entreprises et leaders économiques d'Afrique.",
  keywords: [
    "entrepreneurs africains",
    "startup afrique",
    "business africa",
    "fondateurs africains",
    "fintech afrique",
    "tech afrique",
    "investisseurs africains",
    "success story afrique",
    "innovation afrique",
  ],
  authors: [{ name: "AfriWiki" }],
  creator: "AfriWiki",
  publisher: "AfriWiki",
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: baseUrl,
    siteName: "AfriWiki",
    title: "AfriWiki — L'encyclopédie des entrepreneurs africains",
    description:
      "Découvrez les parcours inspirants des entrepreneurs africains. Plus de 10 000 profils vérifiés dans 54 pays.",
    images: [
      {
        url: `${baseUrl}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "AfriWiki - L'encyclopédie des entrepreneurs africains",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AfriWiki — L'encyclopédie des entrepreneurs africains",
    description:
      "Découvrez les parcours inspirants des entrepreneurs africains.",
    images: [`${baseUrl}/og-image.png`],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    // À remplir après configuration Google Search Console
    // google: "votre-code-verification",
  },
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
