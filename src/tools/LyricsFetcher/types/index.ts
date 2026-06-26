// ─────────────────────────────────────────────────────────────
// types/index.ts
// Provider-agnostic type definitions.
// Every provider implementation must map its response to these.
// New providers only need to satisfy these interfaces — nothing else changes.
// ─────────────────────────────────────────────────────────────

// ── Shared primitives ────────────────────────────────────────

/** ISO 8601 date string, e.g. "2025-03-14" */
export type ISODate = string;

/** A provider's internal ID for a resource — kept as a string to stay agnostic */
export type ProviderId = string;

// ── Artist ───────────────────────────────────────────────────

export interface Artist {
  /** Provider-internal ID */
  id: ProviderId;
  /** Canonical display name */
  name: string;
  /** Slug / URL-safe name if the provider exposes one */
  slug?: string;
  /** Absolute URL to the artist's page on the provider */
  url?: string;
  /** URL to artist image/thumbnail */
  imageUrl?: string;
  /** Which provider this record came from */
  provider: ProviderName;
}

// ── Song (without lyrics) ────────────────────────────────────

export interface Song {
  id: ProviderId;
  title: string;
  /** Full artist name string as displayed */
  artistName: string;
  /** Structured artist reference if the provider exposes it */
  artist?: Artist;
  albumName?: string;
  releaseDate?: ISODate;
  /** Absolute URL to the song's page on the provider */
  url?: string;
  /** URL to album art / song thumbnail */
  thumbnailUrl?: string;
  /** Language tag, e.g. "en", "hi", "kn" */
  language?: string;
  provider: ProviderName;
}

// ── LyricsResult — Song + full lyric text ────────────────────

export interface LyricsResult {
  song: Song;
  /**
   * Raw lyric text.
   * - Newlines separate lines.
   * - Double newlines separate stanzas / sections.
   * - Section headers like [Verse 1] are preserved when available.
   */
  lyrics: string;
  /** Source of the lyrics — api = returned by API, scraped = HTML extraction */
  source: "api" | "scraped";
  /** Unix timestamp when these lyrics were fetched */
  fetchedAt: number;
}

// ── ArtistSongsResult — paginated song list ──────────────────

export interface ArtistSongsResult {
  artist: Artist;
  songs: Song[];
  /** Total songs known to the provider, if exposed */
  total?: number;
  page: number;
  perPage: number;
  hasMore: boolean;
  provider: ProviderName;
}

// ── Tool modes ───────────────────────────────────────────────

export type ToolMode = "by-artist" | "by-song";

export interface ByArtistOptions {
  mode: "by-artist";
  artistName: string;
  /** Page number, 1-indexed */
  page?: number;
  perPage?: number;
  /** Sort order when the provider supports it */
  sort?: "popularity" | "release_date" | "title";
}

export interface BySongOptions {
  mode: "by-song";
  songTitle: string;
  artistName: string;
  /**
   * Whether to fetch full lyrics.
   * Some providers return lyrics in the search result (false = skip extra call).
   */
  fetchLyrics?: boolean;
}

export type ToolOptions = ByArtistOptions | BySongOptions;

// ── Provider interface ───────────────────────────────────────

/**
 * The only string that must be registered in ProviderRegistry.
 * Add new names here as you add implementations.
 */
export type ProviderName = "genius" | "musixmatch" | "azlyrics" | "lrclib";

/**
 * Every lyrics provider must implement this interface.
 * Adding a new provider = creating a new class that satisfies this.
 * Nothing in the tool core needs to change.
 */
export interface LyricsProvider {
  /** Unique name — must match ProviderName */
  readonly name: ProviderName;

  /**
   * Search for songs by artist name.
   * Returns a paginated list of Song objects — no lyric text.
   */
  getSongsByArtist(options: ByArtistOptions): Promise<ArtistSongsResult>;

  /**
   * Search for a specific song and optionally return its lyrics.
   * Implementations may fetch lyrics in the same call or as a second request.
   */
  getSongWithLyrics(options: BySongOptions): Promise<LyricsResult>;
}

// ── Provider config passed at construction ───────────────────

export interface ProviderConfig {
  /** API key / access token — optional for providers that don't need auth */
  apiKey?: string;
  /** Request timeout in milliseconds. Default: 10_000 */
  timeoutMs?: number;
  /** Max retries on transient failures. Default: 2 */
  maxRetries?: number;
  /** Custom User-Agent header for scraped providers */
  userAgent?: string;
}

// ── Error types ──────────────────────────────────────────────

export type LyricsErrorCode =
  | "NOT_FOUND"
  | "AUTH_FAILED"
  | "RATE_LIMITED"
  | "SCRAPE_FAILED"
  | "NETWORK_ERROR"
  | "PARSE_ERROR"
  | "PROVIDER_ERROR";

export class LyricsError extends Error {
  constructor(
    public readonly code: LyricsErrorCode,
    message: string,
    public readonly provider: ProviderName,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = "LyricsError";
  }
}

// ── Tool result wrapper ──────────────────────────────────────

export type ToolResult<T> =
  | { ok: true; data: T; provider: ProviderName }
  | { ok: false; error: LyricsError };