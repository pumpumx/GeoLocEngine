// ─────────────────────────────────────────────────────────────
// utils/http.ts
// Thin wrapper around axios with retry, timeout, and
// structured error normalisation.
// All providers import from here — zero direct axios usage elsewhere.
// ─────────────────────────────────────────────────────────────

import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  AxiosError,
} from "axios";
import { LyricsError, LyricsErrorCode, ProviderName } from "../types/index.js";

export interface HttpClientOptions {
  baseURL?: string;
  timeoutMs?: number;
  maxRetries?: number;
  headers?: Record<string, string>;
}

/** Delays for ms milliseconds */
const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

/** Exponential backoff: 300ms, 600ms, 1200ms… */
const backoff = (attempt: number): number => 300 * Math.pow(2, attempt);

function classifyAxiosError(
  err: AxiosError,
  provider: ProviderName
): LyricsError {
  const status = err.response?.status;

  if (status === 401 || status === 403) {
    return new LyricsError(
      "AUTH_FAILED",
      `Authentication failed (HTTP ${status})`,
      provider,
      err
    );
  }
  if (status === 429) {
    return new LyricsError(
      "RATE_LIMITED",
      "Rate limited by provider",
      provider,
      err
    );
  }
  if (status === 404) {
    return new LyricsError(
      "NOT_FOUND",
      "Resource not found",
      provider,
      err
    );
  }
  if (!err.response) {
    return new LyricsError(
      "NETWORK_ERROR",
      `Network error: ${err.message}`,
      provider,
      err
    );
  }
  return new LyricsError(
    "PROVIDER_ERROR",
    `Provider returned HTTP ${status}`,
    provider,
    err
  );
}

export class HttpClient {
  private readonly client: AxiosInstance;
  private readonly maxRetries: number;

  constructor(provider: ProviderName, options: HttpClientOptions = {}) {
    this.maxRetries = options.maxRetries ?? 2;

    this.client = axios.create({
      baseURL: options.baseURL,
      timeout: options.timeoutMs ?? 10_000,
      headers: {
        "User-Agent":
          options.headers?.["User-Agent"] ??
          "LyricsTool/1.0 (github.com/yourorg/lyrics-tool)",
        ...options.headers,
      },
    });

    // Attach provider name to all errors thrown from this instance
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        throw classifyAxiosError(error, provider);
      }
    );
  }

  /**
   * GET with automatic retry on transient failures.
   * 429 and 5xx trigger retries; 4xx client errors do not.
   */
  async get<T>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> {
    let attempt = 0;

    while (true) {
      try {
        return await this.client.get<T>(url, config);
      } catch (err) {
        if (!(err instanceof LyricsError)) throw err;

        const retryable =
          err.code === "RATE_LIMITED" || err.code === "NETWORK_ERROR";

        if (!retryable || attempt >= this.maxRetries) throw err;

        await sleep(backoff(attempt));
        attempt++;
      }
    }
  }

  /**
   * Fetch raw HTML for scraping.
   * Returns the response text; caller handles parsing.
   */
  async getHtml(url: string, config?: AxiosRequestConfig): Promise<string> {
    const response = await this.get<string>(url, {
      ...config,
      responseType: "text",
    });
    return response.data;
  }
}