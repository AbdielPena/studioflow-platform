import type { ExternalInventoryConnection } from "@prisma/client";
import { GenericRestAdapter } from "./generic-rest.adapter";
import type { InventoryAdapter, AdapterConfig } from "./base.adapter";

export function getAdapter(connection: ExternalInventoryConnection): InventoryAdapter {
  const config: AdapterConfig = {
    baseUrl: connection.baseUrl,
    authType: (connection.authType as AdapterConfig["authType"]) ?? "BEARER",
    authToken: connection.authToken,
    apiKey: connection.apiKey,
    customHeaders: (connection.customHeaders as Record<string, string> | null) ?? null,
    timeoutMs: connection.timeoutMs,
    endpoints: (connection.endpoints as AdapterConfig["endpoints"]) ?? {},
  };

  // Aquí se ramifica por tipo de sistema externo en el futuro:
  // if (connection.name === "Bind ERP") return new BindAdapter(config);
  // if (connection.name === "Loyverse") return new LoyverseAdapter(config);
  return new GenericRestAdapter(config);
}
