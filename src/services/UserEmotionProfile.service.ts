import {
  getEmotionVectorBySongId,
  saveEnrichedMusicEventToLedger,
  saveEnrichedMusicEventToLedgerPayload,
} from "../dao/song_intel.dao";
import { listen_event_metadata } from "../controllers/typings/userEmotionProfile.typings";
import { MusicDNA } from "../dao/types";
import { AppError } from "../middlewares/appError.middleware";
import { Emotion } from "../models/types/shared_types";
import { EmotionalProfile } from "../models/types/songIntel.types";
import { EMOTIONS } from "../models/userEmotionProfile.model";
import { deriveEmotionMetrics, FilteredEmotionVector } from "../helpers/enrichSongs";
import { SongEvent } from "../models/songs.model";
import { EXTERNAL_IDS } from "../models/types/songs.types";
import Singleton from "../utils/Singleton";
import SONGS_DAO from "../dao/songs.dao";

class UserEmotionProfileService {
  public SongEventDao = Singleton.instance<SONGS_DAO>(SONGS_DAO);
  MusicRejectionThreshold: number = 30;

  saveListeningEvent = async (userId: string, listen_event_metadata: listen_event_metadata) => {
    const { song_details, completed, played_at, duration_ms, session_id } = listen_event_metadata;

    //Reject bad signals
    //If duration_ms < 30s || This condition can be implemented in the rate limiter itself
    if (Number(duration_ms) < this.MusicRejectionThreshold) {
      throw new AppError("Low Signal Event", 400);
    }

    //Check whether current song details exists in db or not
    const songExists = await SongEvent.findOne({
      $or: EXTERNAL_IDS.filter((key) => song_details.external_ids[key]).map((key) => ({
        [`external_ids.${key}`]: song_details.external_ids[key],
      })),
    })
      .lean()
      .select("_id");

      const internalSongId = songExists?._id.toString() ?? (await this.SongEventDao.saveNewSong(song_details))._id.toString()

    //fetch song details by song_id and embed the necessary factors determining emotional scores directly with listening events
    //intel includes -> emotional_vectors,primary_context,primary_mood,music_dna
    const song_intel_details = await getEmotionVectorBySongId(
      internalSongId
    ); //This returns the song_intel of this particular song

    //extract music DNA
    const musicDNA: MusicDNA = {
      mood: song_intel_details?.music_dna?.primary_moods ?? [],
      theme: song_intel_details?.music_dna?.primary_themes ?? [],
      feelings: song_intel_details?.music_dna?.listener_feelings ?? [],
    };

    const emotionVector = Object.entries(song_intel_details.emotional_profile as EmotionalProfile)
      .filter(([emotion]) => EMOTIONS.includes(emotion as Emotion))
      .map(([emotion, emotionScore]) => ({
        emotion,
        ...emotionScore,
      })) as FilteredEmotionVector;

    const dominantEmotions = [...emotionVector].sort((a, b) => b.score - a.score).slice(0, 3);

    const songIntel = {
      dominant_emotions: dominantEmotions,
      emotion_vectors: emotionVector,
      music_dna: musicDNA,
    };

    console.log("Song intel", dominantEmotions, emotionVector);
    const emotion_metrices = deriveEmotionMetrics(emotionVector);

    //save the event in the db -> Immutable Event Ledger
    const payload: saveEnrichedMusicEventToLedgerPayload = {
      userId: userId,
      songId: internalSongId ,
      emotionalProfile:songIntel,
      EventMetaData:listen_event_metadata,
      emotionMetrices:emotion_metrices
    };
    const saveEvent = await saveEnrichedMusicEventToLedger(
      payload,

    );

    if (!saveEvent) {
      throw new AppError("Failed To Save SongEvent", 500);
    }
    return saveEvent;
  };
}

export default UserEmotionProfileService;
