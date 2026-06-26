
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
