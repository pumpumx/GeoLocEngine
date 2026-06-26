import { SongIntel } from "../models/songIntel.model"
import { listen_event_metadata } from "../controllers/typings/userEmotionProfile.typings"
import { SongEventLedger } from "../models/userEmotionProfile.model"
import { getEmotionVectorBySongIdResponse } from "./types"
import { EmotionDerivedMetrics } from "../helpers/types"

export const getEmotionVectorBySongId = async (song_id:string)=>{
    const song_intel_details = await SongIntel.findOne({song_id : song_id}).lean()

    if(!song_intel_details){ //TODO: If not found -> Make the AI CALL TO save the intel
        throw new Error("Song Intel Not Found")
    }
    return song_intel_details;
}

//Create 
export const saveEnrichedMusicEventToLedger = async(userId:string, EventMetaData:listen_event_metadata,emotionalProfile:getEmotionVectorBySongIdResponse,emotionMetrices:EmotionDerivedMetrics)=>{
    return await SongEventLedger.create({
        userId,
        songId:EventMetaData.song_id,
        playedAt:EventMetaData.played_at,
        durationMs:Number(EventMetaData.duration_ms),
        emotional_profile:emotionalProfile,
        emotion_metrices:emotionMetrices,
        completed:Number(EventMetaData.duration_ms) > 30 ? true : false,
        source:EventMetaData.source || "organic",
    })
}

