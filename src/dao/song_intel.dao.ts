import { SongIntel } from "../models/songIntel.model"
import { SongEventLedger } from "../models/userEmotionProfile.model"
import { saveEnrichedMusicEventToLedgerPayload, saveNormalMusicEventToLedgerPayload } from "./types/types"

export const getEmotionVectorBySongId = async (song_id:string)=>{
    const songIntelDetails = await SongIntel.findOne({song_id : song_id}).lean()
    return songIntelDetails;
}


export const saveEnrichedMusicEventToLedger = async(payload:saveEnrichedMusicEventToLedgerPayload)=>{
    return await SongEventLedger.create({
        userId:payload.userId,
        songId:payload.songId, //This is the ref to the internal DB id
        playedAt:payload.EventMetaData.played_at,
        durationMs:Number(payload.EventMetaData.duration_ms),
        emotion_metrices:payload.emotionMetrices,
        emotional_profile:payload.emotionalProfile,
        completed:Number(payload.EventMetaData.duration_ms) > 30 ? true : false,
        source:payload.EventMetaData.source || "organic",
    })
}

export const saveNormalMusicEventToLedger = async(payload:saveNormalMusicEventToLedgerPayload)=>{
    return await SongEventLedger.create({
        userId:payload.userId,
        songId:payload.songId, //This is the ref to the internal DB id
        playedAt:payload.EventMetaData.played_at,
        durationMs:Number(payload.EventMetaData.duration_ms),
        completed:Number(payload.EventMetaData.duration_ms) > 30 ? true : false,
        source:payload.EventMetaData.source || "organic",
    })
}

