// ─────────────────────────────────────────────────────────────
// providers/registry.ts
//
// Central registry for all providers.
//
// To add a new provider:
//   1. Implement LyricsProvider in a new file under providers/
//   2. Import it here
//   3. Add an entry to PROVIDER_REGISTRY
//   4. Add its name to the ProviderName union in types/index.ts
//
// Nothing else in the codebase needs to change.
// ─────────────────────────────────────────────────────────────

import { LyricsProvider, ProviderConfig, ProviderName } from "../types/index.js";
import { GeniusProvider } from "../LyricsProvider/Genius";
import { LRCLibProvider } from "../LyricsProvider/LrcLib";

/** Factory function signature for all providers */
export type ProviderFactory = (config: ProviderConfig) => LyricsProvider;

/**
 * Registry maps provider names to factory functions.
 * Factories are called lazily — providers are only instantiated when requested.
 */
export const PROVIDER_REGISTRY: Record<ProviderName, ProviderFactory> = {
  genius: (config) => new GeniusProvider(config),
  lrclib: (config) => new LRCLibProvider(config),

  // Stubs for future providers — implement the class, then replace the stub.
  musixmatch: (_config) => {
    throw new Error(
      "MusixMatch provider is not yet implemented. " +
        "To add it: create src/providers/musixmatch.ts implementing LyricsProvider, " +
        "then register it here."
    );
  },
  azlyrics: (_config) => {
    throw new Error(
      "AZLyrics provider is not yet implemented. " +
        "AZLyrics has no public API — this would be a scraper-only provider. " +
        "Create src/providers/azlyrics.ts implementing LyricsProvider, " +
        "then register it here."
    );
  },
};

/**
 * Create a provider instance by name.
 * Throws if the name is not registered.
 */
export function createProvider(
  name: ProviderName,
  config: ProviderConfig
): LyricsProvider {
  const factory = PROVIDER_REGISTRY[name];
  if (!factory) {
    throw new Error(
      `Unknown provider "${name}". ` +
        `Available: ${Object.keys(PROVIDER_REGISTRY).join(", ")}`
    );
  }
  return factory(config);
}

/** All registered provider names */
export const AVAILABLE_PROVIDERS: ProviderName[] = Object.keys(
  PROVIDER_REGISTRY
) as ProviderName[];