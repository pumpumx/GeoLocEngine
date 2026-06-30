import {
  getEmotionVectorBySongId,
  saveEnrichedMusicEventToLedger,
  saveNormalMusicEventToLedger,
} from "../dao/song_intel.dao";
import type { saveEnrichedMusicEventToLedgerPayload, songIntelType } from "../dao/types/types";
import { listenEventMetaData } from "../controllers/typings/userEmotionProfile.typings";
import { MusicDNA, saveNormalMusicEventToLedgerPayload } from "../dao/types/types";
import { AppError } from "../middlewares/appError.middleware";
import { Emotion } from "../models/types/shared_types";
import { EmotionalProfile } from "../models/types/songIntel.types";
import { EMOTIONS } from "../models/userEmotionProfile.model";
import { deriveEmotionMetrics, FilteredEmotionVector } from "../helpers/enrichSongs";
import { SongEvent } from "../models/songs.model";
import { EXTERNAL_IDS } from "../models/types/songs.types";
import Singleton from "../utils/Singleton";
import SONGS_DAO from "../dao/songs.dao";
import { generateSongId } from "../helpers/generateFuzzyId";
import MusicFckService from "../helpers/MusicFck.helper";

class UserEmotionProfileService {
  public SongEventDao = Singleton.instance<SONGS_DAO>(SONGS_DAO);
  public MuiscFckService = Singleton.instance<MusicFckService>(MusicFckService);
  MusicRejectionThreshold: number = 30; //seconds

  saveListeningEvent = async (userId: string, listen_event_metadata: listenEventMetaData) => {
    const { song_details, completed, played_at, duration_ms, session_id } = listen_event_metadata;

    //Reject bad signals
    //If duration_ms < 30s || This condition can be implemented in the rate limiter itself
    if (Number(duration_ms) < this.MusicRejectionThreshold) {
      throw new AppError("Low Signal Event", 400);
    }

    if (!song_details.external_ids.fuzzy_id) {
      song_details.external_ids.fuzzy_id = generateSongId(song_details.title, song_details.artist);
    }

    //Check whether current song details exists in db or not
    const songExists = await SongEvent.findOne({
      $or: EXTERNAL_IDS.filter((key) => song_details.external_ids[key]).map((key) => ({
        [`external_ids.${key}`]: song_details.external_ids[key],
      })),
    })
      .lean()
      .select("_id");

    //Internal song id -> mongodb !! Lyrics Fetch
    const internalSongId =
      songExists?._id.toString() ??
      (await this.SongEventDao.saveNewSong(song_details))._id.toString();

    //fetch song details by song_id and embed the necessary factors determining emotional scores directly with listening events
    //intel includes -> emotional_vectors,primary_context,primary_mood,music_dna
    const songIntelDetails = await getEmotionVectorBySongId(internalSongId); //This returns the song_intel of this particular song


    if (!songIntelDetails) {
      //No addition of emotion metrices as AI data generation takes time
      const payload:saveNormalMusicEventToLedgerPayload = {
        userId,
        songId:internalSongId,
        EventMetaData:listen_event_metadata,
      }
      const saveEvent = await saveNormalMusicEventToLedger(payload)
      if(!saveEvent){
        throw new AppError("Failed to save Music Event" , 500)
      }
      //if this throws an error it'll be automatically catched by asynchandler
      this.MuiscFckService.analyzeSongRequest(listen_event_metadata, internalSongId)
      .catch((err)=>console.log("MUSICFCK ERROR",err));
      return saveEvent;
    }
    //extract music DNA
    //In Music DNA , we also get embedding_vector -> can play with it in future
    const musicDNA: MusicDNA = {
      mood: songIntelDetails?.music_dna?.primary_moods ?? [],
      theme: songIntelDetails?.music_dna?.primary_themes ?? [],
      feelings: songIntelDetails?.music_dna?.listener_feelings ?? [],
    };

    const emotionVector = Object.entries(songIntelDetails.emotional_profile as EmotionalProfile)
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

    const emotion_metrices = deriveEmotionMetrics(emotionVector);

    //save the event in the db -> Immutable Event Ledger
    const payload:saveEnrichedMusicEventToLedgerPayload= {
      userId: userId,
      songId: internalSongId,
      emotionalProfile: songIntel,
      EventMetaData: listen_event_metadata,
      emotionMetrices: emotion_metrices,
    };

    const saveEvent = await saveEnrichedMusicEventToLedger(payload);

    if (!saveEvent) {
      throw new AppError("Failed To Save SongEvent", 500);
    }
    return saveEvent;
  };
}

export default UserEmotionProfileService;
