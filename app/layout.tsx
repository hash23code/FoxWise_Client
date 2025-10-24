import type { Metadata } from "next";
import { ClerkProvider } from '@clerk/nextjs'
import "./globals.css";

export const metadata: Metadata = {
  title: "FoxWise Client - Gestion de Clients Intelligente",
  description: "Application complète de gestion de clients avec intelligence artificielle",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="fr">
        <body className="antialiased">
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
