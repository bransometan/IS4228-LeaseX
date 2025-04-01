import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";

import Navbar from "@/components/common/Navbar";
import { Toaster } from "@/components/ui/toaster";
import ReduxProvider from "@/components/providers/ReduxProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "LeaseX",
  description: "Lease properties",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      appearance={{
        elements: {
          footer: "hidden",
        },
      }}
    >
      <ReduxProvider>
        <html lang="en">
          <body className={inter.className}>
            <main className="flex flex-col min-h-[100vh]">
              <Navbar />
              <div className="mt-20 mx-8 mb-10">
                {children}
                <Toaster />
              </div>
            </main>
          </body>
        </html>
      </ReduxProvider>
    </ClerkProvider>
  );
}
