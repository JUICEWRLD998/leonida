import type { Metadata } from "next";
import { Anton, JetBrains_Mono, Inter } from "next/font/google";
import "./globals.css";

const anton = Anton({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const jetMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
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
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${anton.variable} ${jetMono.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
