"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/packages/auth";
import { loginSchema } from "@/packages/auth/schemas";
import { ok, fail, type ActionResult } from "@/lib/errors";

export async function loginAction(formData: FormData): Promise<ActionResult<{ ok: true }>> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return fail("VALIDATION_ERROR", "Credenciales inválidas", parsed.error.flatten());
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirect: false,
    });
    return ok({ ok: true });
  } catch (err) {
    if (err instanceof AuthError) {
      switch (err.type) {
        case "CredentialsSignin":
          return fail("UNAUTHORIZED", "Correo o contraseña incorrectos");
        default:
          return fail("INTERNAL_ERROR", "No pudimos iniciar sesión");
      }
    }
    throw err;
  }
}
