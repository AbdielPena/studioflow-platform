import { NextResponse, type NextRequest } from "next/server";
import { signIn } from "@/packages/auth";

/**
 * GET /api/auth/hub-sso?token=<JWT>&redirect=<path>
 *
 * Endpoint inbound del Studio Business Hub.
 * Llama signIn("hub-sso", { token }) — el provider valida el JWT y setea
 * la cookie de NextAuth. Luego redirige al path solicitado.
 *
 * NextAuth v5 signIn() en route handler maneja la redirección/cookie automáticamente
 * cuando recibe `redirectTo`.
 */
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  const redirectTo = sanitizeRedirect(request.nextUrl.searchParams.get("redirect"));

  if (!token) {
    return NextResponse.json({ error: "missing_token" }, { status: 400 });
  }

  try {
    // signIn redirige internamente con Set-Cookie; redirectTo es el destino final
    await signIn("hub-sso", { token, redirectTo });
    // Si llegamos acá sin throwear (NextAuth v5 throws para redireccionar), fallback:
    return NextResponse.redirect(new URL(redirectTo, request.url));
  } catch (err) {
    // NextAuth.js v5 lanza un NEXT_REDIRECT como mecanismo de redirección;
    // dejar que Next lo maneje propagándolo.
    if (
      err &&
      typeof err === "object" &&
      "digest" in err &&
      typeof (err as { digest: unknown }).digest === "string" &&
      ((err as { digest: string }).digest.startsWith("NEXT_REDIRECT") ||
        (err as { digest: string }).digest.startsWith("NEXT_HTTP_ERROR"))
    ) {
      throw err;
    }
    console.error("[hub-sso] signIn falló", err);
    return NextResponse.redirect(new URL("/login?error=hub_sso_failed", request.url));
  }
}

function sanitizeRedirect(path: string | null): string {
  if (!path) return "/";
  if (!path.startsWith("/")) return "/";
  if (path.startsWith("//")) return "/";
  return path;
}
