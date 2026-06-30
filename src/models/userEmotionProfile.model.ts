import mongoose, { Schema, Types,} from "mongoose";
import { SongLedgerEmotionVectorType } from "./types/shared_types";
import { EmotionDerivedMetrics } from "../helpers/types";

/* ---------------------------------------------
 * Shared Types
 * ------------------------------------------- */

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
  "loneliness",
  "introspection"
] as const;

export type Emotion = (typeof EMOTIONS)[number];

export type EmotionVector = Record<Emotion, number>;

export interface TopEmotion {
  emotion: Emotion;
  score: number;
  confidence?: number;
}

export interface RecipeScore {
  recipeId: string;
  score: number;
}

export interface MoodDelta {
  sadness?: number;
  happiness?: number;
  aggression?: number;
  romance?: number;
  nostalgia?: number;
  hope?: number;
  anxiety?: number;
  confidence?: number;
  empowerment?: number;
  loneliness?: number;
  introspection?: number;
}

/* ---------------------------------------------
 * Shared Subschemas
 * ------------------------------------------- */

const EmotionVectorSchema = new Schema<EmotionVector>(
  {
    sadness: { type: Number, default: 0, min: 0, max: 100 },
    happiness: { type: Number, default: 0, min: 0, max: 100 },
    aggression: { type: Number, default: 0, min: 0, max: 100 },
    romance: { type: Number, default: 0, min: 0, max: 100 },
    nostalgia: { type: Number, default: 0, min: 0, max: 100 },
    hope: { type: Number, default: 0, min: 0, max: 100 },
    anxiety: { type: Number, default: 0, min: 0, max: 100 },
    confidence: { type: Number, default: 0, min: 0, max: 100 },
    empowerment: { type: Number, default: 0, min: 0, max: 100 },
    loneliness: { type: Number, default: 0, min: 0, max: 100 },
    introspection: { type: Number, default: 0, min: 0, max: 100 },

  },
  { _id: false }
);

const TopEmotionSchema = new Schema<TopEmotion>(
  {
    emotion: {
      type: String,
      enum: EMOTIONS,
      required: true,
    },
    score: { type: Number, required: true, min: 0, max: 100 },
    confidence: { type: Number, default: 1, min: 0, max: 1 },
  },
  { _id: false }
);

const RecipeScoreSchema = new Schema<RecipeScore>(
  {
    recipeId: { type: String, required: true },
    score: { type: Number, required: true, min: 0, max: 1 },
  },
  { _id: false }
);

/* ---------------------------------------------
 * 1) Raw Listening Event Ledger
 * ------------------------------------------- */

export interface ListeningEvent {
  userId: Types.ObjectId;
  songId: Types.ObjectId;
  playedAt: Date;
  durationMs: number;
  completed: boolean;
  skipped: boolean;
  sessionId?: string | null;
  source?: "organic" | "playlist" | "radio" | "search" | "recommendation" | "share" | "other";
  emotional_profile?:SongLedgerEmotionVectorType
  emotion_metrices:EmotionDerivedMetrics,
  meta?: Record<string, unknown>;
}
const SingleEmotionVectorSchema = new Schema(
  {
    emotion:String,
    score:Number,
    confidence:Number
  },
  {
    _id:false
  }
)
const SongEventLedgerEmotionSchema = new Schema(
  {
    emotion_vectors:{
      type: [SingleEmotionVectorSchema],
    },
    dominant_emotions:{
      type:[TopEmotionSchema],
    },
    music_dna:{
        mood: [String],
        theme: [String],
        feelings: [String],
    }
  },{
    _id:false
  }
)

const EmotionDerivedMetricSchema = new Schema<EmotionDerivedMetrics>(
  {
  magnitude: Number,
  entropy: Number,
  activeEmotionCount: Number,
  dominantScore: Number,
  secondScore: Number,
  dominanceRatio: Number,
  emotionalContrast: Number,
  positiveScore: Number,
  negativeScore: Number,
  emotionalBalance: Number,
  conflictScore: Number,
  averageConfidence:Number,
  weightedConfidence:Number,
  purity: Number,
  },
  {
    _id:false
  }
)


const SongEventLedgerSchema = new Schema<ListeningEvent>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    songId: {
      type: Schema.Types.ObjectId,
      ref:"SongEvent",
      required:true,
      index:true
    },
    playedAt: { type: Date, required: true, index: true },
    durationMs: { type: Number, default: 0 },
    completed: { type: Boolean, default: false },
    skipped: { type: Boolean, default: false },

    sessionId: { type: String, default: null },
    source: {
      type: String,
      enum: ["organic", "playlist", "radio", "search", "recommendation", "share", "other"],
      default: "organic",
    },
    emotional_profile:SongEventLedgerEmotionSchema,
    emotion_metrices: EmotionDerivedMetricSchema,
    meta: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

SongEventLedgerSchema.index({ userId: 1, playedAt: -1 });
SongEventLedgerSchema.index({ userId: 1, sessionId: 1, playedAt: 1 });

export const SongEventLedger = mongoose.model<ListeningEvent>(
  "SongEventLedger",
  SongEventLedgerSchema
);

/* ---------------------------------------------
 * 2) Current Rolling User Emotion Profile
 * ------------------------------------------- */

export interface UserEmotionProfile {
  userId: Types.ObjectId;
  currentState: EmotionVector;
  top3: TopEmotion[];
  dominantEmotion?: Emotion | null;
  dominantRecipe?: string | null;
  recipes: RecipeScore[];

  moodIntensity: number;
  moodDrift: number;
  emotionalStability: number;
  contradictionScore: number;
  discoveryScore: number;
  comfortScore: number;

  totalStreamsAnalyzed: number;
  lastSongId?: string | null;
  lastPlayedAt?: Date | null;

  meta: Record<string, unknown>;
}

const UserEmotionProfileSchema = new Schema<UserEmotionProfile>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },

    currentState: { type: EmotionVectorSchema, required: true },
    top3: { type: [TopEmotionSchema], default: [] },

    dominantEmotion: {
      type: String,
      enum: [...EMOTIONS, null],
      default: null,
    },

    dominantRecipe: { type: String, default: null },
    recipes: { type: [RecipeScoreSchema], default: [] },

    moodIntensity: { type: Number, default: 0 },
    moodDrift: { type: Number, default: 0 },
    emotionalStability: { type: Number, default: 0 },
    contradictionScore: { type: Number, default: 0 },
    discoveryScore: { type: Number, default: 0 },
    comfortScore: { type: Number, default: 0 },

    totalStreamsAnalyzed: { type: Number, default: 0 },
    lastSongId: { type: String, default: null },
    lastPlayedAt: { type: Date, default: null },

    meta: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

export const UserEmotionProfileModel = mongoose.model<UserEmotionProfile>(
  "UserEmotionProfile",
  UserEmotionProfileSchema
);

/* ---------------------------------------------
 * 3) Immutable Emotion Snapshots
 * ------------------------------------------- */

export interface UserEmotionSnapshot {
  userId: Types.ObjectId;
  state: EmotionVector;
  top3: TopEmotion[];
  dominantEmotion?: Emotion | null;
  dominantRecipe?: string | null;

  moodIntensity: number;
  moodDrift: number;
  contradictionScore: number;

  streamCount: number;
  streamWindowStart:Date;
  streamWindowEnd:Date;

  createdAt: Date;
  meta: Record<string, unknown>;
}

const UserEmotionSnapshotSchema = new Schema<UserEmotionSnapshot>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    state: { type: EmotionVectorSchema, required: true },
    top3: { type: [TopEmotionSchema], default: [] },

    dominantEmotion: {
      type: String,
      enum: [...EMOTIONS, null],
      default: null,
    },

    dominantRecipe: { type: String, default: null },

    moodIntensity: { type: Number, default: 0 },
    moodDrift: { type: Number, default: 0 },
    contradictionScore: { type: Number, default: 0 },

    streamCount: { type: Number, default: 0 },
    streamWindowStart: { type: Date},
    streamWindowEnd: {type: Date},

    createdAt: { type: Date, default: Date.now },

    meta: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: false }
);

UserEmotionSnapshotSchema.index({ userId: 1, createdAt: -1 });

export const UserEmotionSnapshotModel = mongoose.model<UserEmotionSnapshot>(
  "UserEmotionSnapshot",
  UserEmotionSnapshotSchema
);
/* ---------------------------------------------
 * 4) Weekly Identity / Shareable Product
 * ------------------------------------------- */
export interface UserWeeklyIdentity {
  userId: Types.ObjectId;
  weekKey: string; // e.g. "2026-W25"
  weekStart: Date;
  weekEnd: Date;

  averageState: EmotionVector;
  peakState: EmotionVector;
  endState: EmotionVector;

  top3: TopEmotion[];
  dominantEmotion?: Emotion | null;
  dominantRecipe?: string | null;

  archetype?: string | null;
  skin?: string | null;
  previousArchetype?: string | null;

  movement: MoodDelta;

  moodIntensity: number;
  moodDrift: number;
  emotionalStability: number;
  contradictionScore: number;
  discoveryScore: number;
  comfortScore: number;

  definingSongId?: string | null;
  definingArtistId?: string | null;

  streamCount: number;
  generatedAt: Date;

  shareCardVersion: string;
  meta: Record<string, unknown>;
}

const UserWeeklyIdentitySchema = new Schema<UserWeeklyIdentity>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    weekKey: { type: String, required: true },
    weekStart: { type: Date, required: true },
    weekEnd: { type: Date, required: true },

    averageState: { type: EmotionVectorSchema, required: true },
    peakState: { type: EmotionVectorSchema, required: true },
    endState: { type: EmotionVectorSchema, required: true },

    top3: { type: [TopEmotionSchema], default: [] },

    dominantEmotion: {
      type: String,
      enum: [...EMOTIONS, null],
      default: null,
    },

    dominantRecipe: { type: String, default: null },

    archetype: { type: String, default: null },
    skin: { type: String, default: null },
    previousArchetype: { type: String, default: null },

    movement: {
      sadness: { type: Number, default: 0 },
      happiness: { type: Number, default: 0 },
      aggression: { type: Number, default: 0 },
      romance: { type: Number, default: 0 },
      nostalgia: { type: Number, default: 0 },
      hope: { type: Number, default: 0 },
      anxiety: { type: Number, default: 0 },
      confidence: { type: Number, default: 0 },
      empowerment: { type: Number, default: 0 },
      loneliness: { type: Number, default: 0 },
    },

    moodIntensity: { type: Number, default: 0 },
    moodDrift: { type: Number, default: 0 },
    emotionalStability: { type: Number, default: 0 },
    contradictionScore: { type: Number, default: 0 },
    discoveryScore: { type: Number, default: 0 },
    comfortScore: { type: Number, default: 0 },

    definingSongId: { type: String, default: null },
    definingArtistId: { type: String, default: null },

    streamCount: { type: Number, default: 0 },
    generatedAt: { type: Date, default: Date.now },

    shareCardVersion: { type: String, default: "v1" },
    meta: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

UserWeeklyIdentitySchema.index({ userId: 1, weekKey: 1 }, { unique: true });
UserWeeklyIdentitySchema.index({ userId: 1, weekStart: -1 });

export const UserWeeklyIdentityModel = mongoose.model<UserWeeklyIdentity>(
  "UserWeeklyIdentity",
  UserWeeklyIdentitySchema
);