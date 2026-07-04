import type { Metadata } from "next";
import { Fraunces, Inter, Noto_Sans_Ethiopic } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { Navbar } from "@/components/Navbar";

const display = Fraunces({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});

const sans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const ethiopic = Noto_Sans_Ethiopic({
  subsets: ["ethiopic"],
  weight: ["400", "500", "600"],
  variable: "--font-ethiopic",
  display: "swap",
});

export const metadata: Metadata = {
  title: "PDPMRS \u2014 Pharmacy Discovery & Medicine Reservation",
  description:
    "Find nearby pharmacies, get AI-assisted prescription analysis, and reserve medicines online.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable} ${ethiopic.variable}`}>
      <body>
        <AuthProvider>
          <Navbar />
          <main className="min-h-[calc(100vh-73px)]">{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
