import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { DemoBanner } from "@/components/layout/demo-banner";
import { Providers } from "@/components/providers";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

export const metadata: Metadata = {
  title: {
    default: "DentalCare — Your Smile Deserves the Best Care",
    template: "%s | DentalCare",
  },
  description:
    "Book dental appointments online with DentalCare. General dentistry, cleanings, orthodontics, implants, pediatric and emergency care across three Seattle clinics.",
  keywords: ["dentist", "dental appointment", "dental clinic", "teeth cleaning", "orthodontics", "Seattle dentist"],
  openGraph: {
    title: "DentalCare — Your Smile Deserves the Best Care",
    description: "Modern dental care with easy online appointment booking.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen flex flex-col">
        <Providers>
          <SiteHeader />
          <DemoBanner />
          <main className="flex-1">{children}</main>
          <SiteFooter />
          <Toaster position="top-center" richColors closeButton />
        </Providers>
      </body>
    </html>
  );
}
