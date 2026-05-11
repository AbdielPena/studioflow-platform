// ============================================================================
// Adapter base para sistemas externos de inventario.
// Cada sistema externo extiende esta clase con su semántica propia.
// ============================================================================

import type { Decimal } from "decimal.js";

export type StockQueryItem = { externalProductId: string };
export type StockQueryResult = {
  externalProductId: string;
  available: number;
  reserved?: number;
  updatedAt: string;
};

export type InventoryReserveInput = {
  invoiceId: string;
  items: Array<{ externalProductId: string; quantity: Decimal.Value }>;
};

export type InventoryCommitInput = InventoryReserveInput;
export type InventoryReleaseInput = { invoiceId: string };

export type AdapterResult<T> =
  | { ok: true; data: T; raw?: unknown; durationMs: number }
  | { ok: false; error: { code: string; message: string; retryable: boolean }; raw?: unknown; durationMs: number };

export type AdapterConfig = {
  baseUrl: string;
  authType: "BEARER" | "BASIC" | "API_KEY" | "HMAC";
  authToken?: string | null;
  apiKey?: string | null;
  customHeaders?: Record<string, string> | null;
  timeoutMs: number;
  endpoints: {
    stock?: string;
    reserve?: string;
    commit?: string;
    release?: string;
    products?: string;
  };
};

export abstract class InventoryAdapter {
  constructor(protected readonly config: AdapterConfig) {}

  abstract queryStock(items: StockQueryItem[]): Promise<AdapterResult<StockQueryResult[]>>;
  abstract reserve(input: InventoryReserveInput): Promise<AdapterResult<{ reservationId: string }>>;
  abstract commit(input: InventoryCommitInput): Promise<AdapterResult<{ committed: true }>>;
  abstract release(input: InventoryReleaseInput): Promise<AdapterResult<{ released: true }>>;
  abstract healthCheck(): Promise<AdapterResult<{ status: "ok" }>>;

  protected buildHeaders(extra?: Record<string, string>): Headers {
    const headers = new Headers({
      "Content-Type": "application/json",
      Accept: "application/json",
    });
    if (this.config.authType === "BEARER" && this.config.authToken) {
      headers.set("Authorization", `Bearer ${this.config.authToken}`);
    } else if (this.config.authType === "API_KEY" && this.config.apiKey) {
      headers.set("X-API-Key", this.config.apiKey);
    } else if (this.config.authType === "BASIC" && this.config.authToken) {
      headers.set("Authorization", `Basic ${this.config.authToken}`);
    }
    if (this.config.customHeaders) {
      for (const [k, v] of Object.entries(this.config.customHeaders)) headers.set(k, v);
    }
    if (extra) for (const [k, v] of Object.entries(extra)) headers.set(k, v);
    return headers;
  }

  protected async request<T>(
    path: string,
    init: RequestInit = {},
  ): Promise<{ ok: true; data: T; raw: unknown; status: number } | { ok: false; error: string; raw: unknown; status: number; retryable: boolean }> {
    const url = new URL(path, this.config.baseUrl).toString();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.config.timeoutMs);

    try {
      const res = await fetch(url, {
        ...init,
        headers: this.buildHeaders(init.headers as Record<string, string>),
        signal: controller.signal,
      });
      const raw = await res.json().catch(() => null);
      if (!res.ok) {
        const retryable = res.status >= 500 || res.status === 429;
        return {
          ok: false,
          status: res.status,
          error: `HTTP ${res.status}`,
          raw,
          retryable,
        };
      }
      return { ok: true, data: raw as T, raw, status: res.status };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Network error";
      return {
        ok: false,
        status: 0,
        error: message,
        raw: null,
        retryable: true,
      };
    } finally {
      clearTimeout(timer);
    }
  }
}
