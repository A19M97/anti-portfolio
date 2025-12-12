import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Next.js 15 Boilerplate",
  description: "Production-ready Next.js 15 boilerplate with Clerk, Prisma, and shadcn/ui",
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
