
import { Emotion} from "../models/types/shared_types";

export interface EmotionDerivedMetrics {
  magnitude: number;
  entropy: number;
  activeEmotionCount: number;
  dominantEmotion?: Emotion;
  dominantScore: number;
  secondEmotion?: Emotion;
  secondScore: number;
  dominanceRatio: number;
  emotionalContrast: number;
  positiveScore: number;
  negativeScore: number;
  emotionalBalance: number;
  conflictScore: number;
  averageConfidence:number;
  weightedConfidence:number;
  purity: number;
}
export const OPPOSING_PAIRS: [Emotion, Emotion][] = [
  ["happiness", "sadness"],
  ["confidence", "anxiety"],
  ["empowerment", "loneliness"],
  ["romance", "aggression"],
  ["hope", "nostalgia"],
];

export const POSITIVE: Emotion[] = ["happiness", "hope", "confidence", "empowerment"];
export const NEGATIVE: Emotion[] = ["sadness", "anxiety", "loneliness", "aggression"];
export const ActiveThreshold=0.25

export interface SongAnalysisRequest {
  song_name: string;
  artist_name: string;
  genre_primary: string;

  song_id?: string;
  language?: string;
  explicit?: boolean;

  lyrics?: {
    full_text?: string;
    excerpt?: string;
    source?: string;
    language_detected?: string;
  };

  audio_features?: {
    bpm: number;
    energy: number;
    danceability: number;
    acousticness: number;
    instrumentalness: number;
    valence: number;
    loudness_db: number;

    key?: number;
    mode?: number;
    time_signature?: number;
    duration_ms?: number;

    liveness?: number;
    speechiness?: number;

    spectral_centroid?: number;
    spectral_rolloff?: number;
    zero_crossing_rate?: number;

    mfcc?: number[];
    source?: string;
  };

  source?: {
    system?: string;
    version?: string;
    trace_id?: string;
    extra?: Record<string, unknown>;
  };

  options?: {
    analysis_depth?: "basic" | "standard" | "deep";
    include_embedding?: boolean;
    language_override?: string;
    model_version?: string;
    force_refresh?: boolean;
  };
}