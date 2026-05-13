// ============================================================================
// Event Bus — entry point.
// Importar desde aquí garantiza que el dispatcher al Studio Business Hub
// quede registrado al primer uso del bus.
// ============================================================================

export * from "./bus";

// Side-effect: registra el hub-dispatcher al cargar el módulo de eventos.
// Si HUB_HMAC_SECRET no está configurado, los eventos simplemente no se reenvían.
import "./hub-dispatcher";
