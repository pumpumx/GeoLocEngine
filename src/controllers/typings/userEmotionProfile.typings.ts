export type listen_event_metadata = {
    song_id:string,
    played_at: string,
    duration_ms: string,
    completed: boolean, //can be calculated
    session_id? : string,
    source?: "organic" | "playlist" | "radio" | "search" | "recommendation" | "share" | "other";
}

export interface storeEmotionSnapShot {
}