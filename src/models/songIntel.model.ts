import mongoose, { Schema , InferSchemaType } from "mongoose";
import { AudioCharacter, CulturalAxis, CulturalIdentity, EmotionalProfile, EmotionScore, ListeningContext, LyricalPersonality, MusicDNA, ScoreConfidence, SentimentScoresType } from "./types/songIntel.types";

export const ScoreConfidenceSchema = new Schema<ScoreConfidence>(
  {
    score: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },

    confidence: {
      type: Number,
      required: true,
      min: 0,
      max: 1
    }
  },
  { _id: false }
);

export const EmotionScoreSchema = new Schema<EmotionScore>(
  {
    score: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },

    confidence: {
      type: Number,
      required: true,
      min: 0,
      max: 1
    },

    evidence: {
      type: [String],
      default: []
    }
  },
  { _id: false }
);

export const ArtistSchema = new Schema(
  {
    name: String,
    id: String,

    aliases: {
      type: [String],
      default: []
    },

    genres: {
      type: [String],
      default: []
    },

    origin_country: String,

    era: String
  },
  { _id: false }
);

export const AlbumSchema = new Schema(
  {
    name: String,
    release_year: Number,
    label: String,
    track_number: Number
  },
  { _id: false }
);

export const GenreSchema = new Schema(
  {
    primary: String,

    secondary: {
      type: [String],
      default: []
    },

    tags: {
      type: [String],
      default: []
    }
  },
  { _id: false }
);

export const SongDetailsSchema = new Schema(
  {
    id: String,
    name: String,

    artist: ArtistSchema,

    album: AlbumSchema,

    genre: GenreSchema,

    language: String,

    explicit: Boolean
  },
  { _id: false }
);

export const LyricsDetailsSchema = new Schema(
  {
    full_text: String,

    excerpt: String,

    source: String,

    language_detected: String
  },
  { _id: false }
);

export const SongSummarySchema = new Schema(
  {
    headline: String,

    tags: {
      type: [String],
      default: []
    },

    song_details: SongDetailsSchema,

    lyrics_details: LyricsDetailsSchema,

    audio_details: Schema.Types.Mixed
  },
  { _id: false }
);
export const EmotionalProfileSchema = new Schema<EmotionalProfile>(
  {
    sadness: EmotionScoreSchema,
    happiness: EmotionScoreSchema,
    aggression: EmotionScoreSchema,
    romance: EmotionScoreSchema,
    nostalgia: EmotionScoreSchema,
    hope: EmotionScoreSchema,
    anxiety: EmotionScoreSchema,
    confidence: EmotionScoreSchema,
    empowerment: EmotionScoreSchema,
    loneliness: EmotionScoreSchema,

    dominant_emotion: String,

    emotion_vector: {
      sadness: Number,
      happiness: Number,
      aggression: Number,
      romance: Number,
      nostalgia: Number,
      hope: Number,
      anxiety: Number,
      confidence: Number,
      empowerment: Number,
      loneliness: Number
    }
  },
  { _id: false }
);
export const LyricalPersonalitySchema = new Schema<LyricalPersonality>(
  {
    storytelling: ScoreConfidenceSchema,

    philosophical: ScoreConfidenceSchema,

    motivational: ScoreConfidenceSchema,

    love_relationships: ScoreConfidenceSchema,

    braggadocio: ScoreConfidenceSchema,

    dark_depressive: ScoreConfidenceSchema,

    introspective: ScoreConfidenceSchema,

    rebellious: ScoreConfidenceSchema,

    spiritual: ScoreConfidenceSchema,

    dominant_trait: String,

    lyrical_complexity_score: Number,

    vocabulary_richness: Number,

    rhyme_density: Number
  },
  { _id: false }
);

export const CulturalAxisSchema = new Schema<CulturalAxis>(
  {
    score: Number,

    label: String,

    confidence: Number
  },
  { _id: false }
);

export const CulturalIdentitySchema = new Schema<CulturalIdentity>(
  {
    underground_vs_mainstream: CulturalAxisSchema,

    indie_vs_commercial: CulturalAxisSchema,

    local_vs_global: CulturalAxisSchema,

    oldschool_vs_newschool: CulturalAxisSchema,

    cultural_references: {
      type: [String],
      default: []
    },

    subculture_tags: {
      type: [String],
      default: []
    }
  },
  { _id: false }
);

export const ListeningContextSchema = new Schema<ListeningContext>(
  {
    workout: ScoreConfidenceSchema,

    study: ScoreConfidenceSchema,

    focus: ScoreConfidenceSchema,

    party: ScoreConfidenceSchema,

    driving: ScoreConfidenceSchema,

    late_night: ScoreConfidenceSchema,

    relaxation: ScoreConfidenceSchema,

    social_gathering: ScoreConfidenceSchema,

    heartbreak: ScoreConfidenceSchema,

    morning_routine: ScoreConfidenceSchema,

    primary_context: String,

    secondary_contexts: {
      type: [String],
      default: []
    }
  },
  { _id: false }
);
export const AudioCharacterSchema = new Schema<AudioCharacter>(
  {
    energy_score: ScoreConfidenceSchema,
    danceability_score: ScoreConfidenceSchema,
    intensity_score: ScoreConfidenceSchema,
    complexity_score: ScoreConfidenceSchema,
    accessibility_score: ScoreConfidenceSchema,
    rawness_score: ScoreConfidenceSchema,
    melodic_strength: ScoreConfidenceSchema,
    rhythmic_dominance: ScoreConfidenceSchema,
    sonic_character: String
  },
  { _id: false }
);
export const SentimentScoresSchema = new Schema<SentimentScoresType>(
  {
    uplifting: Number,
    romantic: Number,
    melancholic: Number,
    motivational: Number,
    aggressive: Number,
    reflective: Number,
    nostalgic: Number,
    celebratory: Number,
    dark: Number,
    chill: Number,
    spiritual: Number,
    heartbreak: Number
  },
  { _id: false }
);

export const SentimentBucketsSchema = new Schema(
  {
    active: {
      type: [String],
      default: []
    },

    primary: String,

    scores: SentimentScoresSchema
  },
  { _id: false }
);
export const MusicDNASchema = new Schema<MusicDNA>(
  {
    primary_moods: {
      type: [String],
      default: []
    },

    primary_themes: {
      type: [String],
      default: []
    },

    listener_feelings: {
      type: [String],
      default: []
    },

    keywords: {
      type: [String],
      default: []
    },

    sound_alikes: {
      type: [String],
      default: []
    },

    embedding_vector: {
      type: [Number],
      default: []
    }
  },
  { _id: false }
);
export const MetadataSchema = new Schema(
  {
    lyrics_used: Boolean,

    audio_features_used: Boolean,

    lyric_coverage: String,

    analysis_depth: String,

    model_id: String,

    prompt_tokens: Number,

    completion_tokens: Number,

    total_tokens: Number,

    cache_read: Number,

    reasoning_tokens: Number,

    retry_count: Number,

    warnings: {
      type: [String],
      default: []
    }
  },
  { _id: false }
);
export const ConfidenceSchema = new Schema(
  {
    overall: Number,

    emotional_profile: Number,

    lyrical_personality: Number,

    cultural_identity: Number,

    listening_context: Number,

    audio_character: Number
  },
  { _id: false }
);

const SongProfileSchema = new Schema(
  {
    profile_id: { //System generated
      type: String,
      required: true,
      unique: true
    },
    request_id: {
      type: String,
      required: true
    },
    song_id: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    model_version: {
      type: String,
      required: true
    },
    generated_at: Date,
    processing_ms: Number,
    song_summary: SongSummarySchema,
    emotional_profile: EmotionalProfileSchema,
    lyrical_personality: LyricalPersonalitySchema,
    cultural_identity: CulturalIdentitySchema,
    listening_context: ListeningContextSchema,
    audio_character: AudioCharacterSchema,
    sentiment_buckets: SentimentBucketsSchema,
    music_dna: MusicDNASchema,
    metadata: MetadataSchema,
    confidence: ConfidenceSchema,
    raw_llm_output: Schema.Types.Mixed,
    _updated_at: Date
  },
);


export type SongIntelType = mongoose.InferSchemaType<typeof SongProfileSchema>
export const SongIntel = mongoose.model("getEmotionVectorBySongIdSongIntel" , SongProfileSchema , "song_intel")