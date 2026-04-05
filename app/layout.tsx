import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { Providers } from "@/components/Providers";
import { authOptions } from "@/lib/auth-options";
import "./globals.css";

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
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-stone-100 font-sans text-stone-900">
        <Providers session={session}>{children}</Providers>
      </body>
    </html>
  );
}
