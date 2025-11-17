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
    <ClerkProvider
      appearance={{
        elements: {
          formButtonPrimary: 'bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700',
          card: 'bg-gray-900 border border-gray-800',
          headerTitle: 'text-white',
          headerSubtitle: 'text-gray-400',
          socialButtonsBlockButton: 'bg-gray-800 border-gray-700 hover:bg-gray-700 text-white',
          formFieldLabel: 'text-gray-300',
          formFieldInput: 'bg-gray-800 border-gray-700 text-white',
          footerActionLink: 'text-orange-500 hover:text-orange-400',
          identityPreviewText: 'text-white',
          identityPreviewEditButton: 'text-orange-500',
        },
        layout: {
          logoImageUrl: '/logo.png',
          socialButtonsPlacement: 'bottom',
        },
      }}
    >
      <html lang="fr">
        <body className="antialiased">
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
