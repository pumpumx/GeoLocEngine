// ─────────────────────────────────────────────────────────────
// providers/lrclib.ts
//
// LRCLib provider — https://lrclib.net
//
// LRCLib is a free, open-source lyrics API with no authentication.
// It returns both plain lyrics and time-synced LRC format.
// Good as a free fallback when Genius requires scraping.
//
// Limitations:
//   - Smaller catalogue than Genius (focused on popular/streaming tracks)
//   - No artist song list endpoint — only song search
//   - getSongsByArtist falls back to search + filter
// ─────────────────────────────────────────────────────────────

import {
  LyricsProvider,
  ProviderConfig,
  ProviderName,
  Artist,
  Song,
  LyricsResult,
  ArtistSongsResult,
  ByArtistOptions,
  BySongOptions,
  LyricsError,
} from "../types/index";
import { HttpClient } from "../utils/http";
import { looseMatch, normaliseWhitespace } from "../utils/strings";

// ── LRCLib API response shapes (internal) ────────────────────

interface LRCLibTrack {
  id: number;
  name: string;
  trackName: string;
  artistName: string;
  albumName: string;
  duration: number;
  instrumental: boolean;
  plainLyrics: string | null;
  syncedLyrics: string | null;
}

// ── LRCLib provider ──────────────────────────────────────────

export class LRCLibProvider implements LyricsProvider {
  readonly name: ProviderName = "lrclib";

  private readonly client: HttpClient;

  constructor(config: ProviderConfig = {}) {
    // LRCLib requires no API key
    this.client = new HttpClient("lrclib", {
      baseURL: "https://lrclib.net/api",
      timeoutMs: config.timeoutMs,
      maxRetries: config.maxRetries,
      headers: {
        "Lrclib-Client": "LyricsTool/1.0 (github.com/yourorg/lyrics-tool)",
      },
    });
  }

  // ── Public: getSongsByArtist ───────────────────────────────

  /**
   * LRCLib has no dedicated artist endpoint.
   * We search by artist name and return paginated results.
   */
  async getSongsByArtist(options: ByArtistOptions): Promise<ArtistSongsResult> {
    const page = options.page ?? 1;
    const perPage = options.perPage ?? 20;

    const response = await this.client.get<LRCLibTrack[]>("/search", {
      params: { artist_name: options.artistName },
    });

    const tracks = response.data;

    if (!tracks || tracks.length === 0) {
      throw new LyricsError(
        "NOT_FOUND",
        `No songs found for artist "${options.artistName}" on LRCLib`,
        "lrclib"
      );
    }

    // Filter strictly to the requested artist
    const filtered = tracks.filter((t:LRCLibTrack) =>
      looseMatch(t.artistName, options.artistName)
    );

    // Manual pagination since the API returns all results
    const start = (page - 1) * perPage;
    const paginated = filtered.slice(start, start + perPage);
    const hasMore = start + perPage < filtered.length;

    // Build a synthetic Artist object from the first result
    const artist: Artist = {
      id: options.artistName.toLowerCase().replace(/\s+/g, "-"),
      name: filtered[0]?.artistName ?? options.artistName,
      provider: this.name,
    };

    const songs: Song[] = paginated.map((t:LRCLibTrack) => this.mapSong(t));

    return {
      artist,
      songs,
      total: filtered.length,
      page,
      perPage,
      hasMore,
      provider: this.name,
    };
  }

  // ── Public: getSongWithLyrics ──────────────────────────────

  async getSongWithLyrics(options: BySongOptions): Promise<LyricsResult> {
    // Try exact match endpoint first — faster than search
    try {
      const response = await this.client.get<LRCLibTrack>("/get", {
        params: {
          track_name: options.songTitle,
          artist_name: options.artistName,
        },
      });

      const track = response.data;
      return this.buildLyricsResult(track, options);
    } catch {
      // Fall back to search if exact match fails
    }

    // Search fallback
    const searchResponse = await this.client.get<LRCLibTrack[]>("/search", {
      params: {
        track_name: options.songTitle,
        artist_name: options.artistName,
      },
    });

    const results = searchResponse.data;

    if (!results || results.length === 0) {
      throw new LyricsError(
        "NOT_FOUND",
        `Song "${options.songTitle}" by "${options.artistName}" not found on LRCLib`,
        "lrclib"
      );
    }

    // Pick best match
    const match =
      results.find(
        (t:LRCLibTrack) =>
          looseMatch(t.trackName, options.songTitle) &&
          looseMatch(t.artistName, options.artistName)
      ) ?? results[0];

    return this.buildLyricsResult(match, options);
  }

  // ── Private: buildLyricsResult ────────────────────────────

  private buildLyricsResult(
    track: LRCLibTrack,
    options: BySongOptions
  ): LyricsResult {
    if (track.instrumental) {
      throw new LyricsError(
        "NOT_FOUND",
        `"${track.trackName}" is marked as instrumental — no lyrics available`,
        "lrclib"
      );
    }

    const rawLyrics = track.plainLyrics ?? track.syncedLyrics ?? "";

    if (!rawLyrics && options.fetchLyrics !== false) {
      throw new LyricsError(
        "NOT_FOUND",
        `No lyrics available for "${track.trackName}" on LRCLib`,
        "lrclib"
      );
    }

    // Strip LRC timestamps if using synced lyrics as fallback
    // "[00:14.50]" → ""
    const cleanLyrics = rawLyrics
      ? normaliseWhitespace(rawLyrics.replace(/\[\d{2}:\d{2}\.\d{2}\]/g, ""))
      : "";

    return {
      song: this.mapSong(track),
      lyrics: cleanLyrics,
      source: "api",
      fetchedAt: Date.now(),
    };
  }

  // ── Private: mappers ──────────────────────────────────────

  private mapSong(raw: LRCLibTrack): Song {
    return {
      id: String(raw.id),
      title: raw.trackName,
      artistName: raw.artistName,
      albumName: raw.albumName,
      provider: this.name,
    };
  }
}