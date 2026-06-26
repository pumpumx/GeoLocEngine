// ─────────────────────────────────────────────────────────────
// LyricsTool.ts
//
// The main public class. This is what callers import.
//
// Responsibilities:
//   - Accept provider config at construction
//   - Expose the two tool modes as clean async methods
//   - Handle provider fallback chain (try primary, fall back to secondary)
//   - Return typed results with ok/error wrapper
//
// Usage:
//   const tool = new LyricsTool({ provider: "genius", apiKey: "..." });
//   const result = await tool.getSongsByArtist({ artistName: "Brodha V" });
//   const result = await tool.getSongWithLyrics({ songTitle: "Hengaithe Maige", artistName: "Brodha V" });
// ─────────────────────────────────────────────────────────────

import {
  LyricsProvider,
  ProviderConfig,
  ProviderName,
  ArtistSongsResult,
  LyricsResult,
  ByArtistOptions,
  BySongOptions,
  ToolResult,
  LyricsError,
} from "./types/index";
import { createProvider } from "./providers/registry";

// ── Tool configuration ────────────────────────────────────────

export interface LyricsToolConfig extends ProviderConfig {
  /**
   * Primary provider to use.
   * @default "genius"
   */
  provider?: ProviderName;

  /**
   * Optional fallback providers tried in order if the primary fails.
   * Example: ["lrclib"] — if Genius fails, try LRCLib.
   */
  fallbackProviders?: ProviderName[];

  /**
   * Whether to log provider attempts and errors to stderr.
   * @default false
   */
  verbose?: boolean;
}

// ── Main class ────────────────────────────────────────────────

export class LyricsTool {
  private readonly providers: LyricsProvider[];
  private readonly verbose: boolean;

  constructor(config: LyricsToolConfig = {}) {
    const primaryName: ProviderName = config.provider ?? "genius";
    const fallbackNames: ProviderName[] = config.fallbackProviders ?? [];

    const providerConfig: ProviderConfig = {
      apiKey: config.apiKey,
      timeoutMs: config.timeoutMs,
      maxRetries: config.maxRetries,
      userAgent: config.userAgent,
    };

    // Instantiate primary + fallbacks in order
    this.providers = [primaryName, ...fallbackNames].map((name) =>
      createProvider(name, providerConfig)
    );

    this.verbose = config.verbose ?? false;
  }

  // ── Mode 1: Get all songs by artist ──────────────────────

  /**
   * Fetch a list of songs by an artist.
   * Iterates through the provider chain until one succeeds.
   *
   * @param artistName - Artist display name, e.g. "Brodha V"
   * @param options    - Pagination and sort options
   */
  async getSongsByArtist(
    artistName: string,
    options: Omit<ByArtistOptions, "mode" | "artistName"> = {}
  ): Promise<ToolResult<ArtistSongsResult>> {
    const fullOptions: ByArtistOptions = {
      ...options,
      mode: "by-artist",
      artistName,
    };

    return this.runWithFallback(
      (provider) => provider.getSongsByArtist(fullOptions),
      `getSongsByArtist("${artistName}")`
    );
  }

  // ── Mode 2: Get a song with its full lyrics ───────────────

  /**
   * Search for a specific song and fetch its lyrics.
   * Iterates through the provider chain until one succeeds.
   *
   * @param songTitle  - Song title, e.g. "Hengaithe Maige"
   * @param artistName - Artist name, e.g. "Brodha V"
   * @param options    - Whether to fetch full lyrics (default: true)
   */
  async getSongWithLyrics(
    songTitle: string,
    artistName: string,
    options: Omit<BySongOptions, "mode" | "songTitle" | "artistName"> = {}
  ): Promise<ToolResult<LyricsResult>> {
    const fullOptions: BySongOptions = {
      ...options,
      mode: "by-song",
      songTitle,
      artistName,
      fetchLyrics: options.fetchLyrics ?? true,
    };

    return this.runWithFallback(
      (provider) => provider.getSongWithLyrics(fullOptions),
      `getSongWithLyrics("${songTitle}" by "${artistName}")`
    );
  }

  // ── Fallback chain runner ─────────────────────────────────

  /**
   * Try each provider in order.
   * Returns the first successful result.
   * If all providers fail, returns the last error.
   */
  private async runWithFallback<T>(
    operation: (provider: LyricsProvider) => Promise<T>,
    label: string
  ): Promise<ToolResult<T>> {
    let lastError: LyricsError | undefined;

    for (const provider of this.providers) {
      try {
        this.log(`[${provider.name}] Attempting ${label}`);
        const data = await operation(provider);
        this.log(`[${provider.name}] Success`);
        return { ok: true, data, provider: provider.name };
      } catch (err) {
        const lyricsErr =
          err instanceof LyricsError
            ? err
            : new LyricsError(
                "PROVIDER_ERROR",
                err instanceof Error ? err.message : String(err),
                provider.name,
                err
              );

        this.log(
          `[${provider.name}] Failed: ${lyricsErr.code} — ${lyricsErr.message}`
        );
        lastError = lyricsErr;

        // Don't try fallbacks for auth failures — they'll all fail
        if (lyricsErr.code === "AUTH_FAILED") break;
      }
    }

    return {
      ok: false,
      error:
        lastError ??
        new LyricsError("PROVIDER_ERROR", "All providers failed", "genius"),
    };
  }

  // ── Utilities ─────────────────────────────────────────────

  /** Names of all active providers in priority order */
  get providerNames(): ProviderName[] {
    return this.providers.map((p) => p.name);
  }

  private log(message: string): void {
    if (this.verbose) {
      process.stderr.write(`[LyricsTool] ${message}\n`);
    }
  }
}