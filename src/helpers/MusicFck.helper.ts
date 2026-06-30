import { MusicFck } from "../config";
import { songDetails } from "../controllers/typings/userEmotionProfile.typings";
import type { SongIntelType } from "../models/songIntel.model";
import { IMusicFck } from "../typings/config";
import axios from "axios";
import { listenEventMetaData } from "../controllers/typings/userEmotionProfile.typings";
import { SongAnalysisRequest } from "./types";




class MusicFckService {
  MusicFck: IMusicFck = MusicFck;

  formatSongAnalysisRequest(event: listenEventMetaData , internalSongId:string): SongAnalysisRequest {
    const { song_details } = event;

    return {
      song_name: song_details.title,
      artist_name: song_details.artist,
      genre_primary: song_details.primary_genre,

      // Prefer ISRC, otherwise Spotify, otherwise fuzzy ID
      song_id:internalSongId,
      audio_features: song_details.audio_details
        ? {
            bpm: song_details.audio_details.tempo ,
            energy: song_details.audio_details.energy,
            danceability: song_details.audio_details.danceability,
            acousticness: song_details.audio_details.acousticness,
            // Not available in frontend model
            instrumentalness: 0,
            valence: song_details.audio_details.valence,
            // Backend requires this field
            loudness_db: 0,
            duration_ms: Number(event.duration_ms),
            liveness: 0,
            speechiness: 0,
            source: "client",
          }
        : undefined,

      lyrics: song_details.lyrics_details
        ? {
            full_text: song_details.lyrics_details.lyrics,
            excerpt: song_details.lyrics_details.lyrics.substring(0, 300),
            source: song_details.lyrics_details.lyricsSource,
          }
        : undefined,
      source: {
        system: "GeoLoc",
        version: "1.0",
        extra: {
          session_id: event.session_id || "",
          played_at: event.played_at || "",
          completed: event.completed || "",
          source: event.source,
          image_url: song_details.image_url,
        },
      },

      options: {
        analysis_depth: "standard",
        include_embedding: true,
        force_refresh: false,
      },
    };
  }

  async analyzeSongRequest(SongEvent: listenEventMetaData , internalSongId:string) {
    const formattedSong = this.formatSongAnalysisRequest(SongEvent,internalSongId)
    const response = await axios.post(`${MusicFck.BaseUrl}/api/v1/analyze/song-request`,  formattedSong);
    return response.data.profile;
  }
}

export default MusicFckService;
