import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mon planning A/B",
  description:
    "Emploi du temps en semaines alternées A et B, consultable par jour, par semaine et par mois.",
  // Ajout à l'écran d'accueil de l'iPhone : nom sous l'icône, et ouverture
  // en plein écran, sans la barre de Safari. L'icône est `app/apple-icon.png`.
  appleWebApp: {
    title: "Planning",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f7f9" },
    { media: "(prefers-color-scheme: dark)", color: "#0c0e13" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
