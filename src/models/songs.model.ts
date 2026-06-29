import mongoose from "mongoose";
import {Schema} from "mongoose" 


const songSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    artist: {
      type: String,
      required: true,
    },
    external_ids: {
      isrc_id: String,
      spotify_id: String,
      yt_id: String,
      fuzzy_id: {
        //This is my system generated id -> check in helper/genenrateSongID. Last Fallback
        type: String,
        required: true,
      },
    },
    imageUrl: {
      type: String,
      required: true,
    },
    duration: {
      type: Number,
      required: true,
    },
    audio_details: {
      tempo: {
        type: Number,
      },
      energy: {
        type: Number,
      },
      valence: {
        type: Number,
      },
      acousticness: {
        type: Number,
      },
      danceability: {
        type: Number,
      },
    },
    genre: {
      type: String,
      default: "unknown",
    },
    lyrics_detail: {
      lyrics: {
        type: String,
      },
      lyricsSource: {
        type: String,
      },
      lyricsFetchedAt: {
        type: Date,
      },
    },
  },
  { timestamps: true },
);

export type songSchemaType = mongoose.InferSchemaType<typeof songSchema>

export const SongEvent = mongoose.model("SongEvent", songSchema , "SongEvent");
