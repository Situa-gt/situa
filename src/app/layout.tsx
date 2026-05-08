import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { RouteTransition } from "@/components/layout/RouteTransition";

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
        <Navbar />
        <RouteTransition>{children}</RouteTransition>
        <Footer />
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
