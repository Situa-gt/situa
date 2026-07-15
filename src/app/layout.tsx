import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { Toaster } from "sonner";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { RouteTransition } from "@/components/layout/RouteTransition";

const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const STORAGE_BUCKET = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || "project-media"

function publicFaviconUrl(fileName: string) {
  if (!SUPABASE_URL) return undefined
  return `${SUPABASE_URL}/storage/v1/object/public/${STORAGE_BUCKET}/settings/public/favicon/${fileName}`
}

const dmSans = DM_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://situa.gt"),
  title: "Sitúa | Proyectos en preventa en Guatemala",
  description:
    "Explora más de 50 proyectos de apartamentos y casas en preventa y construcción en Guatemala. Compara precios, modelos y zonas. Plataforma verificada por ADIG.",
  openGraph: {
    siteName: "Sitúa",
    locale: "es_GT",
    type: "website",
    images: [
      {
        url: "/og-default.jpg",
        width: 1200,
        height: 630,
        alt: "Sitúa – Proyectos en preventa en Guatemala",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@situagt_",
  },
  icons: {
    icon: publicFaviconUrl("favicon-32.png"),
    apple: publicFaviconUrl("apple-touch-icon.png"),
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${dmSans.variable} h-full scroll-smooth antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {GTM_ID && (
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
              height="0"
              width="0"
              style={{ display: 'none', visibility: 'hidden' }}
            />
          </noscript>
        )}
        <Navbar />
        <RouteTransition>{children}</RouteTransition>
        <Footer />
        <Toaster richColors position="top-center" />
        {GTM_ID && (
          <Script
            id="gtm"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${GTM_ID}');`,
            }}
          />
        )}
      </body>
    </html>
  );
}
