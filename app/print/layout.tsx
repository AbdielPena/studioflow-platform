import "./print.css";

export const metadata = { title: "Imprimir" };

export default function PrintLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="print-body">{children}</body>
    </html>
  );
}
