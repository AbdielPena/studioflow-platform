// ============================================================================
// Event Bus cross-module — in-memory (Node single-process)
// Para eventos persistidos / cross-instance, ver pending_inventory_sync_jobs
// o future Supabase Realtime channel.
// ============================================================================

import { moduleLogger } from "@/lib/logger";

const log = moduleLogger("events");

export type PlatformEvent =
  // Facturación
  | { type: "invoice.created"; payload: { invoiceId: string; companyId: string } }
  | { type: "invoice.confirmed"; payload: { invoiceId: string; companyId: string } }
  | { type: "invoice.voided"; payload: { invoiceId: string; companyId: string; reason: string } }
  | { type: "invoice.paid"; payload: { invoiceId: string; companyId: string } }
  | { type: "quote.converted"; payload: { quoteId: string; invoiceId: string; companyId: string } }
  // Inventory link
  | { type: "inventory.sync.requested"; payload: { jobId: string; companyId: string } }
  | { type: "inventory.sync.succeeded"; payload: { jobId: string; companyId: string } }
  | { type: "inventory.sync.failed"; payload: { jobId: string; companyId: string; error: string } }
  // CRM
  | { type: "lead.created"; payload: { leadId: string; companyId: string } }
  | { type: "project.completed"; payload: { projectId: string; companyId: string } }
  // Customers
  | {
      type: "customer.created";
      payload: {
        customerId: string;
        companyId: string;
        legalName?: string;
        email?: string | null;
        phone?: string | null;
        documentNumber?: string | null;
      };
    }
  | {
      type: "customer.updated";
      payload: {
        customerId: string;
        companyId: string;
        legalName?: string;
        email?: string | null;
        phone?: string | null;
      };
    }
  // Gallery
  | { type: "gallery.published"; payload: { galleryId: string; companyId: string } };

export type EventType = PlatformEvent["type"];
export type EventPayload<T extends EventType> = Extract<PlatformEvent, { type: T }>["payload"];

type AnyHandler = (payload: unknown) => Promise<void> | void;
type Handler<T extends EventType> = (payload: EventPayload<T>) => Promise<void> | void;

const handlers = new Map<EventType, Set<AnyHandler>>();

export function subscribe<T extends EventType>(type: T, handler: Handler<T>): () => void {
  if (!handlers.has(type)) handlers.set(type, new Set());
  const wrapped = handler as AnyHandler;
  handlers.get(type)!.add(wrapped);
  return () => {
    handlers.get(type)?.delete(wrapped);
  };
}

export async function publish<T extends EventType>(
  type: T,
  payload: EventPayload<T>,
): Promise<void> {
  const subs = handlers.get(type);
  if (!subs || subs.size === 0) return;
  await Promise.allSettled(
    Array.from(subs).map(async (h) => {
      try {
        await h(payload);
      } catch (err) {
        log.error({ err, type, payload }, "Event handler failed");
      }
    }),
  );
}
