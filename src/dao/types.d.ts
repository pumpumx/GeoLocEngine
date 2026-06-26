export type MusicDNA = {
    mood : string[],
    theme: string[],
    feelings: string[],
}
export type getEmotionVectorBySongIdResponse = {
    dominant_emotions: Record<string,EmotionScore>[],
    emotion_vectors: Record<string,EmotionScore>[]
    music_dna: MusicDNA
}