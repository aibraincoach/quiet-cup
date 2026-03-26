import type { Metadata } from "next";
import type { ReactNode } from "react";
import { DM_Sans } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Street Whisperer",
  description: "Map-first cafe busyness near you",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en" className={dmSans.variable}>
      <body className="m-0 h-dvh overflow-hidden bg-stone-100 antialiased">
        {children}
      </body>
    </html>
  );
}
