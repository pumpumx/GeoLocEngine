import { listenEventMetaData } from "../../controllers/typings/userEmotionProfile.typings"
import { FilteredEmotionVector } from "../../helpers/enrichSongs"
import { EmotionDerivedMetrics } from "../../helpers/types"
import { Emotion} from "../../models/types/shared_types"
import { EmotionalProfile, EmotionScore } from "../../models/types/songIntel.types"
import { TopEmotion } from "../../models/userEmotionProfile.model"

export type MusicDNA = {
    mood : string[],
    theme: string[],
    feelings: string[],
}


//Normal Music event
export type saveNormalMusicEventToLedgerPayload = {
    userId:string,
    songId:string,
    EventMetaData:listenEventMetaData
}
//Enriched Music Event
export type saveEnrichedMusicEventToLedgerPayload = {
    userId:string,
    songId:string,
    EventMetaData:listenEventMetaData,
    emotionalProfile:songIntelType,
    emotionMetrices:EmotionDerivedMetrics
}
export type songIntelType =  {
    dominant_emotions: {
        emotion: Emotion;
        score: number;
        confidence: number;
    }[];
    emotion_vectors: FilteredEmotionVector;
    music_dna: MusicDNA;
}