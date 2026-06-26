#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────
// cli/index.ts
//
// CLI entrypoint.
//
// Usage:
//
//   Mode 1 — all songs by artist:
//     lyrics-tool by-artist --artist "Brodha V" [--page 1] [--per-page 20] [--sort popularity]
//
//   Mode 2 — song + lyrics:
//     lyrics-tool by-song --song "Hengaithe Maige" --artist "Brodha V" [--no-lyrics]
//
//   Global flags:
//     --provider genius|lrclib       Primary provider (default: genius)
//     --fallback lrclib              Fallback provider
//     --api-key <key>                Provider API key (or set GENIUS_API_KEY env var)
//     --json                         Output raw JSON instead of formatted text
//     --verbose                      Log provider attempts to stderr
//     --help                         Show this help
// ─────────────────────────────────────────────────────────────

import { LyricsTool } from "./LyricsTool";
import { ProviderName } from "./types/index";
import {
  formatArtistSongs,
  formatLyricsResult,
  formatError,
  formatJson,
} from "./formatter";

// ── Argument parser (no dependencies — keeps the tool lean) ──

interface ParsedArgs {
  mode?: "by-artist" | "by-song";
  artist?: string;
  song?: string;
  page: number;
  perPage: number;
  sort?: "popularity" | "release_date" | "title";
  provider: ProviderName;
  fallback?: ProviderName;
  apiKey?: string;
  fetchLyrics: boolean;
  json: boolean;
  verbose: boolean;
  help: boolean;
}

function parseArgs(argv: string[]): ParsedArgs {
  const args = argv.slice(2); // strip "node" and script path
  const result: ParsedArgs = {
    provider: "genius",
    page: 1,
    perPage: 20,
    fetchLyrics: true,
    json: false,
    verbose: false,
    help: false,
  };

  // First positional arg is the mode
  if (args[0] === "by-artist" || args[0] === "by-song") {
    result.mode = args[0];
    args.shift();
  }

  let i = 0;
  while (i < args.length) {
    const flag = args[i];

    switch (flag) {
      case "--artist":
      case "-a":
        result.artist = args[++i];
        break;

      case "--song":
      case "-s":
        result.song = args[++i];
        break;

      case "--page":
        result.page = parseInt(args[++i], 10);
        break;

      case "--per-page":
        result.perPage = parseInt(args[++i], 10);
        break;

      case "--sort":
        result.sort = args[++i] as ParsedArgs["sort"];
        break;

      case "--provider":
      case "-p":
        result.provider = args[++i] as ProviderName;
        break;

      case "--fallback":
        result.fallback = args[++i] as ProviderName;
        break;

      case "--api-key":
      case "-k":
        result.apiKey = args[++i];
        break;

      case "--no-lyrics":
        result.fetchLyrics = false;
        break;

      case "--json":
        result.json = true;
        break;

      case "--verbose":
      case "-v":
        result.verbose = true;
        break;

      case "--help":
      case "-h":
        result.help = true;
        break;

      default:
        // Allow bare artist/song names without flags as positional args
        if (!result.artist && result.mode === "by-artist") {
          result.artist = flag;
        } else if (!result.song && result.mode === "by-song") {
          result.song = flag;
        }
    }

    i++;
  }

  return result;
}

// ── Help text ─────────────────────────────────────────────────

function printHelp(): void {
  console.log(`
lyrics-tool — fetch song lyrics and artist catalogues

USAGE
  lyrics-tool <mode> [options]

MODES
  by-artist   List all songs by an artist
  by-song     Fetch a specific song (with lyrics by default)

OPTIONS (by-artist)
  --artist, -a <name>       Artist name (required)
  --page <n>                Page number (default: 1)
  --per-page <n>            Results per page (default: 20)
  --sort <key>              Sort: popularity | release_date | title

OPTIONS (by-song)
  --song, -s <title>        Song title (required)
  --artist, -a <name>       Artist name (required)
  --no-lyrics               Skip fetching full lyrics

GLOBAL OPTIONS
  --provider, -p <name>     Primary provider: genius | lrclib (default: genius)
  --fallback <name>         Fallback provider if primary fails
  --api-key, -k <key>       API key (or set GENIUS_API_KEY env var)
  --json                    Output raw JSON
  --verbose, -v             Log provider attempts to stderr
  --help, -h                Show this help

EXAMPLES
  lyrics-tool by-artist --artist "Brodha V"
  lyrics-tool by-artist --artist "Arijit Singh" --page 2 --sort release_date
  lyrics-tool by-song --song "Hengaithe Maige" --artist "Brodha V"
  lyrics-tool by-song --song "Tum Hi Ho" --artist "Arijit Singh" --provider lrclib
  lyrics-tool by-song --song "Blinding Lights" --artist "The Weeknd" --fallback lrclib --json

ENVIRONMENT VARIABLES
  GENIUS_API_KEY    Genius API key (alternative to --api-key)
`);
}

// ── Main ──────────────────────────────────────────────────────

async function main(): Promise<void> {
  const args = parseArgs(process.argv);

  if (args.help || !args.mode) {
    printHelp();
    process.exit(0);
  }

  // Resolve API key: flag > env var
  const apiKey = args.apiKey ?? process.env.GENIUS_API_KEY;

  const tool = new LyricsTool({
    provider: args.provider,
    fallbackProviders: args.fallback ? [args.fallback] : [],
    apiKey,
    verbose: args.verbose,
  });

  if (args.mode === "by-artist") {
    if (!args.artist) {
      console.error(formatError("--artist is required for by-artist mode"));
      process.exit(1);
    }

    const result = await tool.getSongsByArtist(args.artist, {
      page: args.page,
      perPage: args.perPage,
      sort: args.sort,
    });

    if (!result.ok) {
      console.error(formatError(result.error.message));
      process.exit(1);
    }

    if (args.json) {
      console.log(formatJson(result.data));
    } else {
      console.log(formatArtistSongs(result.data));
    }
  } else if (args.mode === "by-song") {
    if (!args.song || !args.artist) {
      console.error(
        formatError("--song and --artist are both required for by-song mode")
      );
      process.exit(1);
    }

    const result = await tool.getSongWithLyrics(args.song, args.artist, {
      fetchLyrics: args.fetchLyrics,
    });

    if (!result.ok) {
      console.error(formatError(result.error.message));
      process.exit(1);
    }

    if (args.json) {
      console.log(formatJson(result.data));
    } else {
      console.log(formatLyricsResult(result.data));
    }
  }
}

main().catch((err) => {
  console.error(formatError(err instanceof Error ? err.message : String(err)));
  process.exit(1);
});