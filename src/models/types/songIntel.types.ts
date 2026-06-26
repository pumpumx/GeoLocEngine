export type ScoreConfidence = {
  score: number;
  confidence: number;
};

export type EmotionScore = {
  score: number;
  confidence: number;
  evidence?: string[];
};
export interface EmotionalProfile {
  sadness: EmotionScore;
  happiness: EmotionScore;
  aggression: EmotionScore;
  romance: EmotionScore;
  nostalgia: EmotionScore;
  hope: EmotionScore;
  anxiety: EmotionScore;
  confidence: EmotionScore;
  empowerment: EmotionScore;
  loneliness: EmotionScore;

  dominant_emotion: string;

  emotion_vector: number[];
}

export interface LyricalPersonality {
  storytelling: ScoreConfidence;
  philosophical: ScoreConfidence;
  motivational: ScoreConfidence;
  love_relationships: ScoreConfidence;
  braggadocio: ScoreConfidence;
  dark_depressive: ScoreConfidence;
  introspective: ScoreConfidence;
  rebellious: ScoreConfidence;
  spiritual: ScoreConfidence;

  dominant_trait: string;

  lyrical_complexity_score: number;

  vocabulary_richness: number;

  rhyme_density: number;
}

export interface CulturalAxis {
  score: number;
  label: string;
  confidence: number;
}

export interface CulturalIdentity {
  underground_vs_mainstream: CulturalAxis;

  indie_vs_commercial: CulturalAxis;

  local_vs_global: CulturalAxis;

  oldschool_vs_newschool: CulturalAxis;

  cultural_references: string[];

  subculture_tags: string[];
}

export interface ListeningContext {
  workout: ScoreConfidence;
  study: ScoreConfidence;
  focus: ScoreConfidence;
  party: ScoreConfidence;
  driving: ScoreConfidence;
  late_night: ScoreConfidence;
  relaxation: ScoreConfidence;
  social_gathering: ScoreConfidence;
  heartbreak: ScoreConfidence;
  morning_routine: ScoreConfidence;

  primary_context: string;

  secondary_contexts: string[];

}
export interface AudioCharacter {
  energy_score: ScoreConfidence;

  danceability_score: ScoreConfidence;

  intensity_score: ScoreConfidence;

  complexity_score: ScoreConfidence;

  accessibility_score: ScoreConfidence;

  rawness_score: ScoreConfidence;

  melodic_strength: ScoreConfidence;

  rhythmic_dominance: ScoreConfidence;

  sonic_character: string;
}

export interface MusicDNA {
  primary_moods: string[];

  primary_themes: string[];

  listener_feelings: string[];

  keywords: string[];

  sound_alikes: string[];

  embedding_vector: number[];
}

export interface SentimentScoresType {
    uplifting: number,
    romantic: number,
    melancholic: number,
    motivational: number,
    aggressive: number,
    reflective: number,
    nostalgic: number,
    celebratory: number,
    dark: number,
    chill: number,
    spiritual: number,
    heartbreak: number
}