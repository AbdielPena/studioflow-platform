import { moduleLogger } from "./logger";

const log = moduleLogger("email");

type EmailResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

type SendInput = {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
};

// ============================================================================
// Email service — Resend wrapper sin dependencia hard del SDK.
// Si RESEND_API_KEY no está configurado, hace log y retorna ok:false silencioso.
// Esto permite arrancar dev sin Resend hasta que el usuario quiera mandar mails.
// ============================================================================

export async function sendEmail(input: SendInput): Promise<EmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM ?? "StudioFlow <noreply@studioflow.app>";

  if (!apiKey) {
    log.warn({ subject: input.subject, to: input.to }, "RESEND_API_KEY not set, skipping email");
    return { ok: false, error: "Email service not configured" };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: Array.isArray(input.to) ? input.to : [input.to],
        subject: input.subject,
        html: input.html,
        text: input.text,
        reply_to: input.replyTo,
      }),
    });
    if (!res.ok) {
      const errBody = await res.text();
      log.error({ status: res.status, body: errBody }, "Resend failed");
      return { ok: false, error: `Resend error ${res.status}` };
    }
    const data = (await res.json()) as { id: string };
    log.info({ id: data.id, subject: input.subject }, "Email sent");
    return { ok: true, id: data.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Network error";
    log.error({ err }, "Email send failed");
    return { ok: false, error: message };
  }
}
