import { ModulePlaceholder } from "@/components/shared/module-placeholder";
import { Camera } from "lucide-react";

export const metadata = { title: "Galerías" };

export default function GalleryPage() {
  return (
    <ModulePlaceholder
      icon={Camera}
      title="Galerías"
      description="Estilo Pixieset. Galería privada/pública por proyecto con acceso protegido."
      phase="Migración pendiente"
      features={[
        "Galería pública o protegida por contraseña",
        "Selección de favoritos por cliente",
        "Marca de agua opcional",
        "Vencimiento de acceso",
        "Storage en Supabase",
      ]}
    />
  );
}
