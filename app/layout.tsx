import type { Metadata } from "next";
import { DM_Sans, DM_Mono, Bebas_Neue } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-dm-sans",
  display: "swap",
});

const dmMono = DM_Mono({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-dm-mono",
  display: "swap",
});

const bebas = Bebas_Neue({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-bebas",
  display: "swap",
});

export const metadata: Metadata = {
  title: "LEONIDA — Evidence Locker",
  description:
    "Doctor police surveillance photos to make the case get thrown out before forensics catches you. A GTA VI-inspired forensic terminal built with React Image Editor.",
  openGraph: {
    title: "LEONIDA — Evidence Locker",
    description:
      "Doctor the evidence. Beat the system. A GTA VI-inspired forensic terminal.",
    type: "website",
    images: [{ url: "/gta6-cover.jpg", width: 1200, height: 630 }],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`h-full antialiased ${dmSans.variable} ${dmMono.variable} ${bebas.variable}`}>
      <body className="min-h-full flex flex-col bg-[var(--paper)] text-[var(--ink)]">
        {children}
      </body>
    </html>
  );
}
