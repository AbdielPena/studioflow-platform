import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/modules/_shared/auth/login-form";

export const metadata: Metadata = { title: "Iniciar sesión" };

export default function LoginPage() {
  return (
    <div className="w-full max-w-sm">
      <div className="mb-8">
        <h1 className="text-[26px] font-semibold tracking-tight text-foreground">
          Bienvenido de vuelta
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Ingresa a tu cuenta de PixelOS para gestionar tu facturación.
        </p>
      </div>

      <LoginForm />

      <p className="mt-6 text-sm text-muted-foreground">
        ¿Aún no tienes cuenta?{" "}
        <Link href="/register" className="font-medium text-foreground hover:underline">
          Crear empresa
        </Link>
      </p>
    </div>
  );
}
