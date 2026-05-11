import { ModulePlaceholder } from "@/components/shared/module-placeholder";
import { Wallet } from "lucide-react";

export const metadata = { title: "Finanzas" };

export default function FinanzasPage() {
  return (
    <ModulePlaceholder
      icon={Wallet}
      title="Finanzas"
      description="CxC, CxP, caja, bancos, conciliación, reportes fiscales."
      phase="Fase 5"
      features={[
        "Cuentas por cobrar con antigüedad de saldos",
        "Cuentas por pagar con programación",
        "Cajas y arqueo diario",
        "Bancos y carteras digitales",
        "Conciliación básica",
        "Reportes fiscales (ITBIS, retenciones)",
      ]}
    />
  );
}
