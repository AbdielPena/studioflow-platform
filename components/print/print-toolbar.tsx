"use client";

import Link from "next/link";

export function PrintToolbar({ backHref }: { backHref: string }) {
  return (
    <div className="print-toolbar">
      <Link href={backHref} className="print-btn print-btn--ghost">
        ← Volver
      </Link>
      <button onClick={() => window.print()} className="print-btn">
        🖨 Imprimir / Guardar PDF
      </button>
    </div>
  );
}
