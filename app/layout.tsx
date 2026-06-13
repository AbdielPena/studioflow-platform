import type { Metadata, Viewport } from "next";
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

// Necesario para que el responsive funcione en móvil / WebView (sin esto el
// WebView renderiza a ancho de escritorio y los breakpoints no aplican).
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
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
