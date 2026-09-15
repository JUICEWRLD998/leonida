import type { Metadata, Viewport } from "next";
import { Courier_Prime, Archivo_Black } from "next/font/google";
import "./globals.css";

// Everything in a property room is typed on a Courier. This is the file's voice.
const courier = Courier_Prime({
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
  variable: "--font-courier",
  display: "swap",
});

// The stamp. Heavy enough to look pressed into paper, used large and rarely.
const archivoBlack = Archivo_Black({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-archivo-black",
  display: "swap",
});

export const metadata: Metadata = {
  title: "LEONIDA PD — Evidence Locker · Case 06",
  description:
    "Alter three exhibits until forensics can no longer match a single flagged region, and get the case thrown out. A GTA VI-inspired forensic game built with React Image Editor.",
  openGraph: {
    title: "LEONIDA PD — Evidence Locker",
    description:
      "Alter the exhibit. Get the case thrown out. A GTA VI-inspired forensic game.",
    type: "website",
    images: [{ url: "/gta6-cover.jpg", width: 1200, height: 630 }],
  },
};

export const viewport: Viewport = {
  themeColor: "#16130F",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`h-full antialiased ${courier.variable} ${archivoBlack.variable}`}
    >
      <body className="min-h-full">{children}</body>
    </html>
  );
}
