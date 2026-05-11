import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/modules/_shared/auth/login-form";

export const metadata: Metadata = { title: "Iniciar sesión" };

export default function LoginPage() {
  return (
    <div className="w-full max-w-md">
      <div className="mb-8 text-center">
        <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" stroke="currentColor" strokeWidth="2.2">
            <path d="M3 12l9-9 9 9M5 10v10h14V10" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">Bienvenido de vuelta</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Ingresa a tu plataforma StudioFlow
        </p>
      </div>

      <div className="rounded-2xl border bg-card p-6 shadow-sm">
        <LoginForm />
      </div>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        ¿Aún no tienes cuenta?{" "}
        <Link href="/register" className="font-medium text-primary hover:underline">
          Crear empresa
        </Link>
      </p>
    </div>
  );
}
