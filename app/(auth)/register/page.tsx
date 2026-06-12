import { redirect } from "next/navigation";

/**
 * Registro centralizado en el hub (PixelOS).
 *
 * El alta de cuentas se hace SOLO desde el hub. El acceso a Facturación se
 * provisiona por SSO del hub (/api/auth/hub-sso). Quien llegue a /register se
 * redirige al hub abriendo directo en "Crear cuenta".
 */
// Dinámica: si fuera estática, Next evalúa el redirect en build y cachea un 200
// en vez de redirigir en cada request.
export const dynamic = "force-dynamic";

const HUB_SIGNUP_URL = "https://hub.abbypixel.com/login?mode=signup";

export default function RegisterPage() {
  redirect(HUB_SIGNUP_URL);
}
