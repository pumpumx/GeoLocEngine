import {
  getEmotionVectorBySongId,
  saveEnrichedMusicEventToLedger,
} from "../dao/song_intel.dao";
import { listen_event_metadata } from "../controllers/typings/userEmotionProfile.typings";
import { MusicDNA } from "../dao/types";
import { AppError } from "../middlewares/appError.middleware";
import { Emotion } from "../models/types/shared_types";
import { EmotionalProfile, EmotionScore } from "../models/types/songIntel.types";
import { EMOTIONS, EmotionVector } from "../models/userEmotionProfile.model";
import { deriveEmotionMetrics , FilteredEmotionVector} from "../helpers/enrichSongs";
import { unknown } from "zod";

class UserEmotionProfileService {
  MusicRejectionThreshold: number = 30;

  saveListeningEvent = async (
    userId: string,
    listen_event_metadata: listen_event_metadata,
  ) => {
    const { song_id, completed, played_at, duration_ms, session_id } =
      listen_event_metadata;

    //Reject bad signals
    //If duration_ms < 30s || This condition can be implemented in the rate limiter itself
    if (Number(duration_ms) < this.MusicRejectionThreshold) {
      throw new AppError("Low Signal Event", 400);
    }

    //fetch song details by song_id and embed the necessary factors determining emotional scores directly with listening events
    //intel includes -> emotional_vectors,primary_context,primary_mood,music_dna
    const song_intel_details = await getEmotionVectorBySongId(song_id); //This returns the song_intel of this particular song

    //extract music DNA
    const musicDNA: MusicDNA = {
      mood: song_intel_details?.music_dna?.primary_moods ?? [],
      theme: song_intel_details?.music_dna?.primary_themes ?? [],
      feelings: song_intel_details?.music_dna?.listener_feelings ?? [],
    };

    const emotionVector= Object.entries(
      song_intel_details.emotional_profile as EmotionalProfile,
    )
      .filter(([emotion]) => EMOTIONS.includes(emotion as Emotion))
      .map(([emotion, emotionScore]) => ({
        emotion,
        ...emotionScore,
      })) as FilteredEmotionVector;

    const dominantEmotions = [...emotionVector]
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    const songIntel = {
      dominant_emotions: dominantEmotions,
      emotion_vectors: emotionVector,
      music_dna: musicDNA,
    };

    console.log("Song intel", dominantEmotions, emotionVector);
    const emotion_metrices = deriveEmotionMetrics(emotionVector)

    //save the event in the db -> Immutable Event Ledger
    const saveEvent = await saveEnrichedMusicEventToLedger(
      userId,
      listen_event_metadata,
      songIntel,
      emotion_metrices
    );

    if (!saveEvent) {
      throw new AppError("Failed To Save SongEvent", 500);
    }
    return saveEvent;
  };
}

export default UserEmotionProfileService;
