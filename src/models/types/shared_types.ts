import { MusicDNA } from "../../dao/types";
import { EmotionScore } from "./songIntel.types";

export const EMOTIONS = [
  "sadness",
  "happiness",
  "aggression",
  "romance",
  "nostalgia",
  "hope",
  "anxiety",
  "confidence",
  "empowerment",
  "loneliness"
] as const;

export type Emotion = typeof EMOTIONS[number];

export type EmotionVector = Record<Emotion, number>;

export interface TopEmotion {
  emotion: Emotion;
  score: number;
}

export interface RecipeScore {
  recipeId: string;
  score: number;
}

export type SongLedgerEmotionVectorType = {
    dominant_emotions: Record<string,EmotionScore>[],
    emotion_vectors: Record<string,EmotionScore>[]
    music_dna: MusicDNA
}