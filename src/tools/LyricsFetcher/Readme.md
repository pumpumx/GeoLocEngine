
# lyrics-tool

CLI and TypeScript library for fetching song lyrics and artist catalogues.

Built with an extensible provider architecture — swap or add lyrics sources without touching the core logic.

---

## Providers

| Provider | Auth | Artist songs | Lyrics | Method |
|---|---|---|---|---|
| **Genius** | API key required | ✅ | ✅ | API search + HTML scrape |
| **LRCLib** | None | ✅ (via search) | ✅ | REST API |
| MusixMatch | *(stub — not yet implemented)* | — | — | — |
| AZLyrics | *(stub — not yet implemented)* | — | — | — |

Get a Genius API key at [genius.com/api-clients](https://genius.com/api-clients).

---

## Install

```bash
npm install
npm run build
```

---

## CLI

### Mode 1 — All songs by artist

```bash
node dist/cli/index.js by-artist --artist "Brodha V"
node dist/cli/index.js by-artist --artist "Arijit Singh" --page 2 --per-page 30 --sort release_date
```

### Mode 2 — Song with lyrics

```bash
node dist/cli/index.js by-song --song "Hengaithe Maige" --artist "Brodha V"
node dist/cli/index.js by-song --song "Tum Hi Ho" --artist "Arijit Singh"

# Use LRCLib instead (no API key needed)
node dist/cli/index.js by-song --song "Blinding Lights" --artist "The Weeknd" --provider lrclib

# Try Genius first, fall back to LRCLib if it fails
node dist/cli/index.js by-song --song "Blinding Lights" --artist "The Weeknd" --fallback lrclib

# JSON output (pipe to jq, save to file, etc.)
node dist/cli/index.js by-song --song "Hengaithe Maige" --artist "Brodha V" --json
```

### Global flags

```
--provider, -p <name>     Primary provider: genius | lrclib  (default: genius)
--fallback <name>         Fallback provider if primary fails
--api-key, -k <key>       API key (or set GENIUS_API_KEY env var)
--json                    Output raw JSON instead of formatted text
--verbose, -v             Log provider attempts and errors to stderr
--help, -h                Show help
```

### Environment variables

```bash
export GENIUS_API_KEY="your_key_here"
# now --api-key flag is optional
node dist/cli/index.js by-artist --artist "Brodha V"
```

---

## Library

```typescript
import { LyricsTool } from "./dist/index.js";

const tool = new LyricsTool({
  provider: "genius",
  apiKey: process.env.GENIUS_API_KEY,
  fallbackProviders: ["lrclib"],   // try LRCLib if Genius fails
  verbose: true,
});

// Mode 1: artist songs
const artistResult = await tool.getSongsByArtist("Brodha V", {
  page: 1,
  perPage: 20,
  sort: "popularity",
});

if (artistResult.ok) {
  console.log(artistResult.data.songs);
} else {
  console.error(artistResult.error.message);
}

// Mode 2: song + lyrics
const lyricsResult = await tool.getSongWithLyrics(
  "Hengaithe Maige",
  "Brodha V"
);

if (lyricsResult.ok) {
  console.log(lyricsResult.data.lyrics);
}
```

---

## Adding a new provider

Three steps. Nothing else changes.

### 1. Create the provider class

```typescript
// src/providers/musixmatch.ts

import {
  LyricsProvider,
  ProviderConfig,
  ProviderName,
  ArtistSongsResult,
  LyricsResult,
  ByArtistOptions,
  BySongOptions,
} from "../types/index.js";

export class MusixMatchProvider implements LyricsProvider {
  readonly name: ProviderName = "musixmatch";

  constructor(config: ProviderConfig) {
    // your init
  }

  async getSongsByArtist(options: ByArtistOptions): Promise<ArtistSongsResult> {
    // your implementation
  }

  async getSongWithLyrics(options: BySongOptions): Promise<LyricsResult> {
    // your implementation
  }
}
```

### 2. Add the name to the ProviderName union

```typescript
// src/types/index.ts
export type ProviderName = "genius" | "musixmatch" | "azlyrics" | "lrclib";
//                                    ^^^^^^^^^^^^ add here
```

### 3. Register in the registry

```typescript
// src/providers/registry.ts
import { MusixMatchProvider } from "./musixmatch.js";

export const PROVIDER_REGISTRY: Record<ProviderName, ProviderFactory> = {
  genius:     (config) => new GeniusProvider(config),
  lrclib:     (config) => new LRCLibProvider(config),
  musixmatch: (config) => new MusixMatchProvider(config),  // ← add
  azlyrics:   (_config) => { throw new Error("not yet"); },
};
```

Done. The CLI `--provider musixmatch` flag now works automatically.

---

## Project structure

```
src/
├── index.ts                  # Public library exports
├── LyricsTool.ts             # Main class — provider orchestration
├── types/
│   └── index.ts              # All types and interfaces
├── providers/
│   ├── registry.ts           # Provider factory registry
│   ├── genius.ts             # Genius: API search + HTML scrape
│   └── lrclib.ts             # LRCLib: free REST API
├── cli/
│   ├── index.ts              # CLI entrypoint + argument parsing
│   └── formatter.ts          # Terminal output formatting
└── utils/
    ├── http.ts               # Axios wrapper with retry + error classification
    └── strings.ts            # Shared string helpers
```

---

## Error handling

All tool methods return a typed `ToolResult<T>`:

```typescript
type ToolResult<T> =
  | { ok: true;  data: T;           provider: ProviderName }
  | { ok: false; error: LyricsError }
```

`LyricsError` carries a code:

| Code | Meaning |
|---|---|
| `NOT_FOUND` | Song or artist not found |
| `AUTH_FAILED` | Bad or missing API key |
| `RATE_LIMITED` | Provider rate limit hit (auto-retried) |
| `SCRAPE_FAILED` | HTML structure changed (Genius) |
| `NETWORK_ERROR` | Connection failure (auto-retried) |
| `PARSE_ERROR` | Unexpected response shape |
| `PROVIDER_ERROR` | Generic provider-level error |