import type { Metadata } from "next";
import { Providers } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "StudioFlow Platform",
    template: "%s · StudioFlow",
  },
  description:
    "Plataforma unificada: CRM, Galerías, Finanzas, Facturación y Conexión con Inventario Externo.",
  applicationName: "StudioFlow",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
