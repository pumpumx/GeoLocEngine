import { songDetails } from "../controllers/typings/userEmotionProfile.typings";
import { AppError } from "../middlewares/appError.middleware";
import { SongDetailsSchema } from "../models/songIntel.model";
import { SongEvent } from "../models/songs.model";

class SONGS_DAO {

  async saveNewSong(song_details: songDetails) {
    const saveSong = await SongEvent.create({
      artist: song_details.artist,
      title: song_details.title,
      genre: song_details.primary_genre,
      duration: song_details.duration,
      external_ids: song_details.external_ids,
      lyrics_detail: song_details.lyrics_details,
      imageUrl: song_details.image_url,
      audio_details: song_details.audio_details,
    });
    if (!saveSong) {
      throw new AppError("Failed Saving New Song", 500);
    }
    return saveSong;
  }
}

export default SONGS_DAO;
