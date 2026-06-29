//A Function to calculate all necessary metrices from emotional profile

//A Function to calculate all necessary metrices from emotional profile

import { Emotion, EmotionVector } from "../models/types/shared_types";
import { EmotionDerivedMetrics,NEGATIVE,OPPOSING_PAIRS,POSITIVE,ActiveThreshold } from "./types";

export type FilteredEmotionVector = {
  emotion: Emotion;
  score: number;          // 0-100
  confidence: number;     // 0-1
}[];

export function deriveEmotionMetrics(
  vector: FilteredEmotionVector
): EmotionDerivedMetrics {
  //---------------------------------------
  // Convert to weighted lookup
  //---------------------------------------
  const emotionMap = {} as EmotionVector;
  const entries: [Emotion, number][] = vector.map((e) => {
    const weightedScore = e.score * e.confidence;
    emotionMap[e.emotion] = weightedScore;
    return [e.emotion, weightedScore];
  });
  //---------------------------------------
  // Total
  //---------------------------------------
  const total = entries.reduce(
    (sum, [, value]) => sum + value,
    0
  );
  //---------------------------------------
  // Magnitude (L2 Norm)
  //---------------------------------------
  const magnitude = Math.sqrt(
    entries.reduce(
      (sum, [, value]) => sum + value * value,
      0
    )
  );
  //---------------------------------------
  // Normalized Vector
  //---------------------------------------
  const normalizedVector = {} as EmotionVector;
  for (const [emotion, value] of entries) {
    normalizedVector[emotion] =
      total === 0 ? 0 : value / total;
  }
  //---------------------------------------
  // Entropy
  //---------------------------------------
  const entropy = Object.values(normalizedVector)
    .filter((v) => v > 0)
    .reduce(
      (sum, value) => sum - value * Math.log2(value),
      0
    );

  //---------------------------------------
  // Dominant Emotions
  //---------------------------------------

  const sorted = [...entries].sort(
    (a, b) => b[1] - a[1]
  );
  const [dominantEmotion, dominantScore] =
    sorted[0];
  const [secondEmotion, secondScore] =
    sorted[1] ?? [dominantEmotion, 0];
  //---------------------------------------
  // Contrast -> Higher : Emotionally Mixed Lower : Clear Emotional Identitiy 
  //---------------------------------------
  const emotionalContrast =
    dominantScore - secondScore;
  //---------------------------------------
  // Dominance Ratio
  //---------------------------------------
  const dominanceRatio =
    total === 0 ? 0 : dominantScore / total;
  //---------------------------------------
  // Positive vs Negative
  //---------------------------------------
  const positiveScore = POSITIVE.reduce(
    (sum, emotion) =>
      sum + (emotionMap[emotion] ?? 0),
    0
  );
  const negativeScore = NEGATIVE.reduce(
    (sum, emotion) =>
      sum + (emotionMap[emotion] ?? 0),
    0
  );
  const emotionalBalance =
    positiveScore - negativeScore;
  //---------------------------------------
  // Emotional Conflict : Higher -> Opposing Nature , lower -> clear emotions
  //---------------------------------------
  let conflictScore = 0;
  for (const [a, b] of OPPOSING_PAIRS) {
    conflictScore += Math.min(
      emotionMap[a] ?? 0,
      emotionMap[b] ?? 0
    );
  }
  //---------------------------------------
  // Active Emotion Count
  //---------------------------------------
  const activeEmotionCount = entries.filter(
    ([, value]) => value >= ActiveThreshold
  ).length;
  //---------------------------------------
  // Purity
  //---------------------------------------
  const purity =
    entries.length <= 1
      ? 1
      : 1 - entropy / Math.log2(entries.length);
  //---------------------------------------
 //---------------------------------------
  const averageConfidence =
    vector.reduce(
      (sum, e) => sum + e.confidence,
      0
    ) / vector.length;
  //---------------------------------------
  // Weighted Mean Confidence
  //---------------------------------------
  const weightedConfidence =
    vector.reduce(
      (sum, e) => sum + e.score * e.confidence,
      0
    ) /
    (vector.reduce(
      (sum, e) => sum + e.score,
      0
    ) || 1);

  return {
    magnitude,
    entropy,
    activeEmotionCount,
    dominantScore,
    secondScore,
    dominanceRatio,
    emotionalContrast,
    positiveScore,
    negativeScore,
    emotionalBalance,
    conflictScore,
    purity,
    averageConfidence,
    weightedConfidence,
  };
}