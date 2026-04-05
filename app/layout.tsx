import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { Cormorant_Garamond, DM_Sans } from "next/font/google";
import { Providers } from "@/components/Providers";
import { authOptions } from "@/lib/auth-options";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm",
  subsets: ["latin"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Fashion Agent — Wardrobe",
  description: "Inventory your clothes and get AI outfit ideas from what you actually own.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession(authOptions);

  return (
    <html
      lang="en"
      className={`${dmSans.variable} ${cormorant.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-stone-100 font-sans text-stone-900">
        <Providers session={session}>{children}</Providers>
      </body>
    </html>
  );
}
