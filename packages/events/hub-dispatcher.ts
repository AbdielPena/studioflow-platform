// ============================================================================
// Studio Business Hub — Outbound dispatcher
// Suscribe a los eventos del bus interno y los reenvía al hub federado
// con firma HMAC. Idempotente (el hub deduplica por external_reference).
// ============================================================================

import { createHmac } from "node:crypto";
import { moduleLogger } from "@/lib/logger";
import { subscribe, type EventType, type EventPayload, type PlatformEvent } from "./bus";

const log = moduleLogger("events:hub");

const HUB_URL = process.env.HUB_URL ?? "http://localhost:3100";
const HMAC_SECRET = process.env.HUB_HMAC_SECRET;
const SYSTEM_ID = "studioflow_platform";

// Mapeo de evento interno → evento federado
type FederatedEvent =
  | "invoice.created"
  | "invoice.confirmed"
  | "invoice.voided"
  | "invoice.paid"
  | "lead.created"
  | "project.completed"
  | "gallery.published";

const FEDERATED: Set<EventType> = new Set([
  "invoice.created",
  "invoice.confirmed",
  "invoice.voided",
  "invoice.paid",
  "lead.created",
  "project.completed",
  "gallery.published",
  "customer.created",
  "customer.updated",
]);

function signBody(secret: string, body: string, ts: number): string {
  const mac = createHmac("sha256", secret);
  mac.update(`${ts}.${body}`);
  return `t=${ts},sha256=${mac.digest("hex")}`;
}

function extractEntityId<T extends EventType>(type: T, payload: EventPayload<T>): string {
  const p = payload as Record<string, string>;
  switch (type) {
    case "invoice.created":
    case "invoice.confirmed":
    case "invoice.voided":
    case "invoice.paid":
      return p.invoiceId;
    case "lead.created":
      return p.leadId;
    case "project.completed":
      return p.projectId;
    case "gallery.published":
      return p.galleryId;
    case "customer.created":
    case "customer.updated":
      return p.customerId;
    default:
      return p.id ?? "unknown";
  }
}

async function forwardToHub<T extends EventType>(type: T, payload: EventPayload<T>): Promise<void> {
  if (!HMAC_SECRET) {
    log.warn("HUB_HMAC_SECRET no configurado; evento no enviado");
    return;
  }
  const entityId = extractEntityId(type, payload);
  const body = JSON.stringify({
    event_type: type,
    external_reference: `${SYSTEM_ID}:${type}:${entityId}`,
    payload,
    occurred_at: new Date().toISOString(),
  });
  const ts = Math.floor(Date.now() / 1000);
  const signature = signBody(HMAC_SECRET, body, ts);

  try {
    const res = await fetch(`${HUB_URL}/api/ingest/${SYSTEM_ID}`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-hub-signature": signature },
      body,
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      log.error({ status: res.status, type, body: text }, "Hub ingest fallido");
    }
  } catch (err) {
    log.error({ err, type }, "Hub ingest threw");
  }
}

let registered = false;

/**
 * Registra el dispatcher una sola vez (idempotente). Se llama desde el bootstrap
 * del server o desde un import side-effect en módulos top-level.
 */
export function registerHubDispatcher(): void {
  if (registered) return;
  registered = true;

  for (const type of FEDERATED) {
    subscribe(type as EventType, (payload) => {
      // fire-and-forget; bus ya capta excepciones
      void forwardToHub(type as EventType, payload as EventPayload<EventType>);
    });
  }
  log.info({ events: Array.from(FEDERATED) }, "Hub dispatcher registrado");
}

// Auto-register al primer import (Next.js single-process per route group).
registerHubDispatcher();
