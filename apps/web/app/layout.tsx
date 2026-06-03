import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BGlyt | Free AI Background Removal Instantly",
  description: "Instantly remove backgrounds from images with pixel-perfect AI accuracy. Completely free, fast, and high-fidelity transparent PNG exports.",
  keywords: [
    "background removal",
    "AI background remover",
    "erase background",
    "transparent background",
    "PNG transparent export",
    "WithoutBG AI",
    "free bg remover",
    "high-fidelity image cutout"
  ],
  authors: [{ name: "BGlyt Team" }],
  openGraph: {
    title: "BGlyt | Free AI Background Removal Instantly",
    description: "Instantly remove backgrounds from images with pixel-perfect AI accuracy. Completely free, fast, and high-fidelity transparent PNG exports.",
    url: "https://bglyt.com",
    siteName: "BGlyt",
    images: [
      {
        url: "/logo.png",
        width: 800,
        height: 600,
        alt: "BGlyt Logo"
      }
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "BGlyt | Free AI Background Removal Instantly",
    description: "Instantly remove backgrounds from images with pixel-perfect AI accuracy.",
    images: ["/logo.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} h-full antialiased`}
    >
      <body className={`${inter.className} min-h-full flex flex-col`}>
        {children}
      </body>
    </html>
  );
}
