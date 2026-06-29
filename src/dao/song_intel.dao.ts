import { SongIntel } from "../models/songIntel.model"
import { listen_event_metadata } from "../controllers/typings/userEmotionProfile.typings"
import { SongEventLedger } from "../models/userEmotionProfile.model"
import { getEmotionVectorBySongIdResponse } from "./types"
import { EmotionDerivedMetrics } from "../helpers/types"
import { ObjectId, Types } from "mongoose"

export const getEmotionVectorBySongId = async (song_id:string)=>{
    const song_intel_details = await SongIntel.findOne({song_id : song_id}).lean()

    if(!song_intel_details){ //TODO: If not found -> Make the AI CALL TO save the intel
        throw new Error("Song Intel Not Found")
    }
    return song_intel_details;
}

//Create 
export type saveEnrichedMusicEventToLedgerPayload = {
    userId:string,
    songId:string,
    EventMetaData:listen_event_metadata,
    emotionalProfile:getEmotionVectorBySongIdResponse,
    emotionMetrices:EmotionDerivedMetrics
}
export const saveEnrichedMusicEventToLedger = async(payload:saveEnrichedMusicEventToLedgerPayload)=>{
    return await SongEventLedger.create({
        userId:payload.userId,
        songId:payload.songId, //This is the ref to the internal DB id
        playedAt:payload.EventMetaData.played_at,
        durationMs:Number(payload.EventMetaData.duration_ms),
        emotional_profile:payload.emotionalProfile,
        emotion_metrices:payload.emotionMetrices,
        completed:Number(payload.EventMetaData.duration_ms) > 30 ? true : false,
        source:payload.EventMetaData.source || "organic",
    })
}

