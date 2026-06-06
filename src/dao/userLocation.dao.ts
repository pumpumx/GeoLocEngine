// dao/userLocation.dao.ts

import UserLocationModel from "../models/user.Locationmodel";

class UserLocationDAO {
  public async findByUserId(userId: string) {
    return UserLocationModel.findOne({
      user_id: userId,
    }).lean();
  }

  public async upsertLocation(payload: {
    user_id: string;
    location: {
      type: "Point";
      coordinates: [number, number];
    };
    h3_index: string;
    h3_resolution: number;
    previous_h3_index?: string;
    accuracy?: number;
    device_meta?: Record<string, unknown>;
    last_seen_at: Date;
  }) {
    return UserLocationModel.findOneAndUpdate(
      {
        user_id: payload.user_id,
      },
      {
        $set: payload,
      },
      {
        upsert: true,
        new: true,
      },
    );
  }

  public async findUsersByCells(h3Indexes: string[]) {
    return UserLocationModel.find({
      h3_index: {
        $in: h3Indexes,
      },
    }).lean();
  }

  public async findUsersByCell(h3Index: string | string[]) {
    return UserLocationModel.find({
      h3_index: h3Index,
    }).lean();
  }

  public async deleteByUserId(userId: string) {
    return UserLocationModel.findOneAndDelete({
      user_id: userId,
    });
  }
}

export default UserLocationDAO;