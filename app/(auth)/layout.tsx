import { Receipt, Calculator, Store, Workflow } from "lucide-react";

/**
 * Layout de auth — split inmersivo minimalista (flat/blanco), alineado al
 * rediseño global de PixelOS. Izquierda: marca + valor del módulo Facturación.
 * Derecha: el formulario. Reskinea login y register de una sola vez.
 */
const FEATURES = [
  {
    icon: Receipt,
    tint: "bg-[#E6EEFB] text-[#5b6b8c]",
    title: "Comprobantes fiscales",
    body: "Emite facturas con NCF válidos y secuencias controladas — sin errores ni huecos.",
  },
  {
    icon: Calculator,
    tint: "bg-[#E8F5EE] text-[#3f8c64]",
    title: "ITBIS automático",
    body: "El impuesto se calcula y se desglosa solo en cada comprobante que emites.",
  },
  {
    icon: Store,
    tint: "bg-[#EFEAF8] text-[#7d6bb0]",
    title: "Punto de venta",
    body: "Cobra en mostrador y registra la venta al instante, lista para facturar.",
  },
  {
    icon: Workflow,
    tint: "bg-[#FBEAF1] text-[#b06487]",
    title: "Todo conectado",
    body: "Tus facturas se sincronizan con el CRM y tus finanzas en tiempo real.",
  },
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh w-full lg:grid-cols-2">
      {/* Izquierda: marca + valor del módulo */}
      <aside className="relative hidden flex-col justify-center border-r bg-muted/20 px-12 py-16 lg:flex xl:px-16">
        <div className="mb-12 inline-flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-foreground text-[15px] font-semibold text-background">
            P
          </span>
          <span className="text-lg font-semibold tracking-tight text-foreground">
            PixelOS
          </span>
          <span className="ml-1 rounded-full border px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
            Facturación
          </span>
        </div>

        <div className="flex max-w-md flex-col gap-7">
          {FEATURES.map((f) => (
            <div key={f.title} className="flex gap-4">
              <span
                className={`flex h-9 w-9 flex-none items-center justify-center rounded-[10px] ${f.tint}`}
              >
                <f.icon className="h-[18px] w-[18px]" strokeWidth={1.8} />
              </span>
              <div>
                <h3 className="text-[14.5px] font-semibold leading-tight text-foreground">
                  {f.title}
                </h3>
                <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
                  {f.body}
                </p>
              </div>
            </div>
          ))}
        </div>
      </aside>

      {/* Derecha: formulario */}
      <section className="flex min-h-dvh flex-col">
        <div className="flex items-center justify-center px-6 pb-2 pt-8 lg:hidden">
          <div className="inline-flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-foreground text-[15px] font-semibold text-background">
              P
            </span>
            <span className="text-lg font-semibold tracking-tight text-foreground">
              PixelOS
            </span>
            <span className="ml-1 rounded-full border px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
              Facturación
            </span>
          </div>
        </div>
        <div className="flex flex-1 items-center justify-center px-6 py-8 lg:py-12">
          {children}
        </div>
      </section>
    </div>
  );
}
