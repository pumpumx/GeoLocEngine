export type songDetails = {
  title: string;
  artist: string;
  external_ids: {
    isrc_id?: string;
    spotify_id?: string;
    yt_id?: string;
    fuzzy_id: string;
  };
  primary_genre: string;
  duration: string;
  audio_details?: {
    tempo: number;
    energy: number;
    valence: number;
    acousticness: number;
    danceability: number;
  };
  lyrics_details?: {
    lyrics: string ;
    lyricsSource: string ;
    lyricsFetchedAt: Date;
  };
  image_url: string;
};
export type listen_event_metadata = {
  song_details: songDetails;
  played_at: string;
  duration_ms: string;
  completed: boolean; //can be calculated
  session_id?: string;
  source?:
    | "organic"
    | "playlist"
    | "radio"
    | "search"
    | "recommendation"
    | "share"
    | "other";
};
