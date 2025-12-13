import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Anti-Portfolio",
  description: "Un portfolio che celebra gli errori, i fallimenti e le lezioni apprese nel percorso di crescita professionale",
};

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params?: Promise<{ locale?: string }>;
}>) {
  // Get locale from params, default to 'en' if not available
  const locale = params ? (await params).locale || 'en' : 'en';

  return (
    <ClerkProvider>
      <html lang={locale}>
        <body className={inter.className}>
          {children}
          <Toaster />
        </body>
      </html>
    </ClerkProvider>
  );
}
