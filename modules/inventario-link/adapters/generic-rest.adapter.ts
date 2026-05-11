import { Decimal } from "decimal.js";
import {
  InventoryAdapter,
  type AdapterResult,
  type InventoryCommitInput,
  type InventoryReleaseInput,
  type InventoryReserveInput,
  type StockQueryItem,
  type StockQueryResult,
} from "./base.adapter";

// ============================================================================
// Adapter REST genérico — asume convención: POST /stock, /reserve, /commit, /release
// Para integrar con un sistema externo distinto, crear su propio adapter
// y registrarlo en `getAdapter()` (factory).
// ============================================================================

export class GenericRestAdapter extends InventoryAdapter {
  async healthCheck(): Promise<AdapterResult<{ status: "ok" }>> {
    const start = Date.now();
    const res = await this.request<{ status: string }>("/health", { method: "GET" });
    const durationMs = Date.now() - start;
    if (res.ok) return { ok: true, data: { status: "ok" }, raw: res.raw, durationMs };
    return {
      ok: false,
      error: { code: "HEALTH_FAIL", message: res.error, retryable: res.retryable },
      raw: res.raw,
      durationMs,
    };
  }

  async queryStock(items: StockQueryItem[]): Promise<AdapterResult<StockQueryResult[]>> {
    const start = Date.now();
    const path = this.config.endpoints.stock ?? "/stock";
    const res = await this.request<{ items: StockQueryResult[] }>(path, {
      method: "POST",
      body: JSON.stringify({ items }),
    });
    const durationMs = Date.now() - start;
    if (res.ok) return { ok: true, data: res.data.items ?? [], raw: res.raw, durationMs };
    return {
      ok: false,
      error: { code: "STOCK_QUERY_FAIL", message: res.error, retryable: res.retryable },
      raw: res.raw,
      durationMs,
    };
  }

  async reserve(input: InventoryReserveInput): Promise<AdapterResult<{ reservationId: string }>> {
    const start = Date.now();
    const path = this.config.endpoints.reserve ?? "/reserve";
    const res = await this.request<{ reservationId: string }>(path, {
      method: "POST",
      body: JSON.stringify({
        invoiceId: input.invoiceId,
        items: input.items.map((i) => ({
          externalProductId: i.externalProductId,
          quantity: new Decimal(i.quantity).toFixed(4),
        })),
      }),
    });
    const durationMs = Date.now() - start;
    if (res.ok) return { ok: true, data: res.data, raw: res.raw, durationMs };
    return {
      ok: false,
      error: { code: "RESERVE_FAIL", message: res.error, retryable: res.retryable },
      raw: res.raw,
      durationMs,
    };
  }

  async commit(input: InventoryCommitInput): Promise<AdapterResult<{ committed: true }>> {
    const start = Date.now();
    const path = this.config.endpoints.commit ?? "/commit";
    const res = await this.request<{ committed: boolean }>(path, {
      method: "POST",
      body: JSON.stringify({
        invoiceId: input.invoiceId,
        items: input.items.map((i) => ({
          externalProductId: i.externalProductId,
          quantity: new Decimal(i.quantity).toFixed(4),
        })),
      }),
    });
    const durationMs = Date.now() - start;
    if (res.ok) return { ok: true, data: { committed: true }, raw: res.raw, durationMs };
    return {
      ok: false,
      error: { code: "COMMIT_FAIL", message: res.error, retryable: res.retryable },
      raw: res.raw,
      durationMs,
    };
  }

  async release(input: InventoryReleaseInput): Promise<AdapterResult<{ released: true }>> {
    const start = Date.now();
    const path = this.config.endpoints.release ?? "/release";
    const res = await this.request<{ released: boolean }>(path, {
      method: "POST",
      body: JSON.stringify({ invoiceId: input.invoiceId }),
    });
    const durationMs = Date.now() - start;
    if (res.ok) return { ok: true, data: { released: true }, raw: res.raw, durationMs };
    return {
      ok: false,
      error: { code: "RELEASE_FAIL", message: res.error, retryable: res.retryable },
      raw: res.raw,
      durationMs,
    };
  }
}
