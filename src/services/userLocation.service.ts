// services/userLocation.service.ts

import { latLngToCell, gridDisk, H3IndexInput } from "h3-js";
import { AppError } from "../middlewares/appError.middleware";
import Singleton from "../utils/Singleton";
import UserLocationDAO from "../dao/userLocation.dao";
import { IUpdateUserLocationReqBody } from "../controllers/typings/userLocation.typing";

class UserLocationService {
  private readonly H3_RESOLUTION = 8;

  public UserLocationDAO = Singleton.instance<UserLocationDAO>(UserLocationDAO);

  public async getUserLocation(userId: string) {

    const location = await this.UserLocationDAO.findByUserId(userId);

    if (!location) {
      throw new AppError("Location not found", 404);
    }

    return location;
  }

  public async updateLocation(
    userId: string,
    payload: IUpdateUserLocationReqBody,
   
  ) {
    const existingLocation = await this.UserLocationDAO.findByUserId(userId);

    //get closest point

    const h3Index = latLngToCell(payload.coords.lat, payload.coords.long, this.H3_RESOLUTION);

    return this.UserLocationDAO.upsertLocation({
      user_id: userId,

      location: {
        type: "Point",
        coordinates: [payload.coords.long, payload.coords.lat],
      },

      h3_index: h3Index,

      previous_h3_index: existingLocation?.h3_index,

      h3_resolution: this.H3_RESOLUTION,

      //Need to improve this accuracy part
      accuracy: payload.accuracy,

      device_meta: payload.device_meta,

      last_seen_at: new Date(),
    });
  }

  public async getNearbyUsers(userId: string, ringSize: number = 1) {
    const currentLocation = await this.UserLocationDAO.findByUserId(userId);

    if (!currentLocation) {
      throw new AppError("User location not found", 404);
    }

    const nearbyCells = gridDisk(currentLocation?.h3_index as H3IndexInput, ringSize);

    const users = await this.UserLocationDAO.findUsersByCells(nearbyCells);

    return users.filter((user) => String(user.user_id) !== userId);
  }

  public async getUsersByCell(h3Index:string | string[]) {
    return this.UserLocationDAO.findUsersByCell(h3Index);
  }

  public async deleteLocation(userId: string) {
    const deleted = await this.UserLocationDAO.deleteByUserId(userId);

    if (!deleted) {
      throw new AppError("Location not found", 404);
    }

    return true;
  }
}

export default new UserLocationService();
