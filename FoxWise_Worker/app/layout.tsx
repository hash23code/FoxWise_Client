import type { Metadata } from "next";
import { ClerkProvider } from '@clerk/nextjs'
import "./globals.css";

export const metadata: Metadata = {
  title: "FoxWise Worker - Gestion de Tâches",
  description: "Application employé pour la gestion de tâches et suivi de travaux",
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
          formButtonPrimary: 'bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700',
          card: 'bg-gray-900 border border-gray-800',
          headerTitle: 'text-white',
          headerSubtitle: 'text-gray-400',
          socialButtonsBlockButton: 'bg-gray-800 border-gray-700 hover:bg-gray-700 text-white',
          formFieldLabel: 'text-gray-300',
          formFieldInput: 'bg-gray-800 border-gray-700 text-white',
          footerActionLink: 'text-purple-500 hover:text-purple-400',
          identityPreviewText: 'text-white',
          identityPreviewEditButton: 'text-purple-500',
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
