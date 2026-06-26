// ─────────────────────────────────────────────────────────────
// providers/genius.ts
//
// Genius provider implementation.
//
// Architecture note:
//   Genius exposes a REST API for search and song metadata, but does NOT
//   return full lyric text via API. Lyrics must be scraped from the song's
//   HTML page. This provider handles both:
//     1. API call  → search / artist songs
//     2. HTML scrape → full lyrics text
//
// To add a new provider, copy this file as a template and implement
// the LyricsProvider interface in src/types/index.ts.
// ─────────────────────────────────────────────────────────────

import * as cheerio from "cheerio";
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

// ── Genius API response shapes (internal — not exported) ──────

interface GeniusApiResponse<T> {
  meta: { status: number; message?: string };
  response: T;
}

interface GeniusArtist {
  id: number;
  name: string;
  slug: string;
  url: string;
  image_url: string;
  header_image_url: string;
}

interface GeniusSong {
  id: number;
  title: string;
  full_title: string;
  url: string;
  song_art_image_thumbnail_url: string;
  release_date_for_display?: string;
  language?: string;
  primary_artist: GeniusArtist;
  album?: {
    name: string;
    release_date_components?: { year?: number; month?: number; day?: number };
  };
}

interface GeniusSearchHit {
  type: "song";
  result: GeniusSong;
}

// ── Genius provider ──────────────────────────────────────────

export class GeniusProvider implements LyricsProvider {
  readonly name: ProviderName = "genius";

  private readonly api: HttpClient;
  private readonly scraper: HttpClient;
  private readonly apiKey: string;

  constructor(config: ProviderConfig) {
    if (!config.apiKey) {
      throw new LyricsError(
        "AUTH_FAILED",
        "Genius provider requires an API key. Get one at https://genius.com/api-clients",
        "genius"
      );
    }

    this.apiKey = config.apiKey;

    // Separate HTTP clients for API calls vs HTML scraping
    this.api = new HttpClient("genius", {
      baseURL: "https://api.genius.com",
      timeoutMs: config.timeoutMs,
      maxRetries: config.maxRetries,
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        Accept: "application/json",
      },
    });

    this.scraper = new HttpClient("genius", {
      timeoutMs: config.timeoutMs ?? 15_000,
      maxRetries: config.maxRetries,
      headers: {
        // Mimic a real browser to avoid Cloudflare blocks
        "User-Agent":
          config.userAgent ??
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });
  }

  // ── Public: getSongsByArtist ───────────────────────────────

  async getSongsByArtist(options: ByArtistOptions): Promise<ArtistSongsResult> {
    const page = options.page ?? 1;
    const perPage = options.perPage ?? 20;

    // Step 1: resolve artist ID from name
    const artist = await this.searchArtist(options.artistName);

    // Step 2: fetch artist songs
    const sortParam = this.mapSort(options.sort);

    const response = await this.api.get<
      GeniusApiResponse<{ songs: GeniusSong[]; next_page: number | null }>
    >(`/artists/${artist.id}/songs`, {
      params: {
        per_page: perPage,
        page,
        sort: sortParam,
      },
    });

    const { songs: rawSongs, next_page } = response.data.response;

    const songs: Song[] = rawSongs.map((s) => this.mapSong(s));

    return {
      artist,
      songs,
      page,
      perPage,
      hasMore: next_page !== null,
      provider: this.name,
    };
  }

  // ── Public: getSongWithLyrics ──────────────────────────────

  async getSongWithLyrics(options: BySongOptions): Promise<LyricsResult> {
    // Step 1: search for the song
    const song = await this.searchSong(options.songTitle, options.artistName);

    // Step 2: early return without lyrics if caller didn't ask
    if (options.fetchLyrics === false) {
      return {
        song,
        lyrics: "",
        source: "api",
        fetchedAt: Date.now(),
      };
    }

    // Step 3: scrape full lyrics from the song page
    const lyrics = await this.scrapeLyrics(song.url!);

    return {
      song,
      lyrics,
      source: "scraped",
      fetchedAt: Date.now(),
    };
  }

  // ── Private: searchArtist ─────────────────────────────────

  private async searchArtist(artistName: string): Promise<Artist> {
    const response = await this.api.get<
      GeniusApiResponse<{ hits: GeniusSearchHit[] }>
    >("/search", {
      params: { q: artistName },
    });

    const hits = response.data.response.hits;

    // Find a hit whose primary_artist name loosely matches
    const hit = hits.find((h) =>
      looseMatch(h.result.primary_artist.name, artistName)
    );

    if (!hit) {
      throw new LyricsError(
        "NOT_FOUND",
        `Artist "${artistName}" not found on Genius`,
        "genius"
      );
    }

    return this.mapArtist(hit.result.primary_artist);
  }

  // ── Private: searchSong ───────────────────────────────────

  private async searchSong(
    songTitle: string,
    artistName: string
  ): Promise<Song> {
    const query = `${songTitle} ${artistName}`;

    const response = await this.api.get<
      GeniusApiResponse<{ hits: GeniusSearchHit[] }>
    >("/search", {
      params: { q: query },
    });

    const hits = response.data.response.hits;

    // Prefer an exact match on both title and artist
    const exactHit = hits.find(
      (h) =>
        looseMatch(h.result.title, songTitle) &&
        looseMatch(h.result.primary_artist.name, artistName)
    );

    // Fall back to first hit with matching artist
    const looseHit = hits.find((h) =>
      looseMatch(h.result.primary_artist.name, artistName)
    );

    const hit = exactHit ?? looseHit;

    if (!hit) {
      throw new LyricsError(
        "NOT_FOUND",
        `Song "${songTitle}" by "${artistName}" not found on Genius`,
        "genius"
      );
    }

    return this.mapSong(hit.result);
  }

  // ── Private: scrapeLyrics ─────────────────────────────────

  private async scrapeLyrics(songUrl: string): Promise<string> {
    let html: string;

    try {
      html = await this.scraper.getHtml(songUrl);
    } catch (err) {
      throw new LyricsError(
        "SCRAPE_FAILED",
        `Failed to fetch lyrics page: ${songUrl}`,
        "genius",
        err
      );
    }

    return this.extractLyricsFromHtml(html, songUrl);
  }

  /**
   * Extract lyric text from Genius HTML.
   *
   * Genius wraps lyrics in <div data-lyrics-container="true"> blocks.
   * Each block may contain multiple stanzas separated by <br> tags.
   * Section headers like [Verse 1] are in plain text.
   *
   * Strategy:
   *   1. Select all data-lyrics-container divs
   *   2. Replace <br> with \n
   *   3. Extract text, preserving newlines
   *   4. Normalise excessive blank lines
   */
  private extractLyricsFromHtml(html: string, sourceUrl: string): string {
    const $ = cheerio.load(html);

    const containers = $("[data-lyrics-container='true']");

    if (containers.length === 0) {
      throw new LyricsError(
        "SCRAPE_FAILED",
        `No lyrics containers found on page. Genius may have changed their HTML structure. URL: ${sourceUrl}`,
        "genius"
      );
    }

    const parts: string[] = [];

    containers.each((_i, el) => {
      // Replace <br> with newline markers before text extraction
      $(el)
        .find("br")
        .replaceWith("\n");

      // Remove "You might also like" injected elements
      $(el).find("[class*='ReferentFragmentdesktop']").remove();
      $(el).find("a[href*='genius.com']").each((_j, a) => {
        const text = $(a).text();
        // Keep text content but remove wrapper anchor
        $(a).replaceWith(text);
      });

      const text = $(el).text();
      parts.push(text);
    });

    const raw = parts.join("\n\n");
    return normaliseWhitespace(raw);
  }

  // ── Private: mappers ──────────────────────────────────────

  private mapArtist(raw: GeniusArtist): Artist {
    return {
      id: String(raw.id),
      name: raw.name,
      slug: raw.slug,
      url: raw.url,
      imageUrl: raw.image_url,
      provider: this.name,
    };
  }

  private mapSong(raw: GeniusSong): Song {
    return {
      id: String(raw.id),
      title: raw.title,
      artistName: raw.primary_artist.name,
      artist: this.mapArtist(raw.primary_artist),
      albumName: raw.album?.name,
      releaseDate: raw.release_date_for_display,
      url: raw.url,
      thumbnailUrl: raw.song_art_image_thumbnail_url,
      language: raw.language ?? undefined,
      provider: this.name,
    };
  }

  private mapSort(
    sort?: ByArtistOptions["sort"]
  ): "popularity" | "release_date" | "title" {
    switch (sort) {
      case "popularity":
        return "popularity";
      case "release_date":
        return "release_date";
      case "title":
        return "title";
      default:
        return "popularity";
    }
  }
}