import type { Metadata } from "next";
import { LoginForm } from "@/modules/_shared/auth/login-form";

export const metadata: Metadata = { title: "Iniciar sesión" };

export default function LoginPage() {
  return (
    <div className="w-full max-w-sm">
      <div className="mb-8">
        <span
          className="brand-logo text-foreground mb-6 block"
          role="img"
          aria-label="Abby Pixel"
          style={{ height: 30, width: 140 }}
        />
        <h1 className="text-[26px] font-semibold tracking-tight text-foreground">
          Bienvenido de vuelta
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Ingresa a tu cuenta para gestionar tu facturación.
        </p>
      </div>

      <LoginForm />

      <p className="mt-6 text-sm text-muted-foreground">
        ¿Aún no tienes cuenta?{" "}
        <a
          href="https://hub.abbypixel.com/login?mode=signup"
          className="font-medium text-foreground hover:underline"
        >
          Crear empresa
        </a>
      </p>
    </div>
  );
}
