// ─────────────────────────────────────────────────────────────
// cli/formatter.ts
// Formats tool output for terminal display.
// Separated from the CLI runner so it can be unit-tested independently.
// ─────────────────────────────────────────────────────────────

import { ArtistSongsResult, LyricsResult, Song } from "./types/index";
import { truncate } from "./utils/strings";

const DIVIDER = "─".repeat(60);
const THIN = "·".repeat(60);

// ── Colour helpers (no dependencies — raw ANSI) ───────────────

const c = {
  bold: (s: string) => `\x1b[1m${s}\x1b[0m`,
  dim: (s: string) => `\x1b[2m${s}\x1b[0m`,
  cyan: (s: string) => `\x1b[36m${s}\x1b[0m`,
  green: (s: string) => `\x1b[32m${s}\x1b[0m`,
  yellow: (s: string) => `\x1b[33m${s}\x1b[0m`,
  red: (s: string) => `\x1b[31m${s}\x1b[0m`,
  reset: (s: string) => `\x1b[0m${s}\x1b[0m`,
};

// ── Artist songs ──────────────────────────────────────────────

export function formatArtistSongs(result: ArtistSongsResult): string {
  const lines: string[] = [];

  lines.push("");
  lines.push(DIVIDER);
  lines.push(
    `${c.bold(c.cyan("Artist:"))} ${c.bold(result.artist.name)}  ${c.dim(`[via ${result.provider}]`)}`
  );
  lines.push(
    `${c.dim("Page")} ${result.page}  •  ${c.dim("Showing")} ${result.songs.length} song${result.songs.length !== 1 ? "s" : ""}${result.total !== undefined ? `  •  ${c.dim("Total")} ${result.total}` : ""}${result.hasMore ? `  •  ${c.yellow("more available")}` : ""}`
  );
  lines.push(DIVIDER);

  if (result.songs.length === 0) {
    lines.push(c.dim("  No songs found."));
  } else {
    result.songs.forEach((song, i) => {
      lines.push(formatSongRow(song, i + 1));
    });
  }

  lines.push(DIVIDER);
  lines.push("");

  return lines.join("\n");
}

function formatSongRow(song: Song, index: number): string {
  const num = c.dim(String(index).padStart(3, " ") + ".");
  const title = c.bold(truncate(song.title, 40));
  const album = song.albumName ? c.dim(` · ${truncate(song.albumName, 30)}`) : "";
  const year = song.releaseDate ? c.dim(` (${song.releaseDate})`) : "";
  const lang = song.language ? c.dim(` [${song.language}]`) : "";
  return `  ${num} ${title}${album}${year}${lang}`;
}

// ── Song + lyrics ─────────────────────────────────────────────

export function formatLyricsResult(result: LyricsResult): string {
  const lines: string[] = [];
  const { song, lyrics, source } = result;

  lines.push("");
  lines.push(DIVIDER);
  lines.push(`${c.bold(c.cyan(song.title))}`);
  lines.push(`${c.dim("by")} ${c.bold(song.artistName)}${song.albumName ? `  ${c.dim("·")}  ${c.dim(song.albumName)}` : ""}`);

  const meta: string[] = [];
  if (song.releaseDate) meta.push(`Released: ${song.releaseDate}`);
  if (song.language) meta.push(`Language: ${song.language}`);
  meta.push(`Provider: ${song.provider}`);
  meta.push(`Source: ${source}`);

  lines.push(c.dim(meta.join("  ·  ")));
  lines.push(DIVIDER);

  if (!lyrics) {
    lines.push(c.dim("  (no lyrics returned — use --lyrics flag or set fetchLyrics: true)"));
  } else {
    lines.push("");
    // Indent lyrics slightly for readability
    lines.push(
      lyrics
        .split("\n")
        .map((line) => (line.startsWith("[") ? c.yellow(line) : line))
        .join("\n")
    );
  }

  lines.push("");
  lines.push(DIVIDER);
  lines.push("");

  return lines.join("\n");
}

// ── Error ─────────────────────────────────────────────────────

export function formatError(message: string): string {
  return `\n${c.red("✗")} ${c.bold("Error:")} ${message}\n`;
}

// ── JSON output (for --json flag) ────────────────────────────

export function formatJson(data: unknown): string {
  return JSON.stringify(data, null, 2);
}