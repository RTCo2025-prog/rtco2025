import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-cairo",
  display: "swap",
});

export const metadata: Metadata = {
  title: "شركة البرج المتألق | منظومة الإدارة المركزية",
  description: "Enterprise ERP System - شركة البرج المتألق للمقاولات والتجارة",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className={`${cairo.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-cairo text-[14px] bg-slate-950 text-slate-100">{children}</body>
    </html>
  );
}