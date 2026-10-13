import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "SamaDokita - Votre santé, partout avec vous",
  description: "Le dossier médical numérique : consultations, ordonnances, analyses et vaccinations réunies en un seul endroit.",
  manifest: "/manifest.json",
  icons: { icon: "/icon-512.png" },
};
export const viewport: Viewport = { themeColor: "#0B4B75" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (<html lang="fr"><body>{children}</body></html>);
}
