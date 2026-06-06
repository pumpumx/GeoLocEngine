import mongoose, { Schema } from "mongoose";
import { UserLocationType } from "../typings/dao";

const UserLocationSchema = new Schema<UserLocationType>(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, // one current location per user
      index: true,
    },

    location: {
      type: {
        type: String,
        enum: ["Point"],
        required: true,
        default: "Point",
      },

      coordinates: {
        type: [Number], // [lng, lat]
        required: true,
        validate: {
          validator(coords: number[]) {
            return (
              coords.length === 2 &&
              coords[0] >= -180 &&
              coords[0] <= 180 &&
              coords[1] >= -90 &&
              coords[1] <= 90
            );
          },
          message: "Invalid longitude/latitude values",
        },
      },
    },

    /**
     * Current H3 cell
     */
    h3_index: {
      type: String,
      required: true,
      index: true,
    },

    /**
     * H3 resolution used to generate h3_index
     */
    h3_resolution: {
      type: Number,
      required: true,
      min: 0,
      max: 15,
    },

    /**
     * Previous H3 cell
     */
    previous_h3_index: {
      type: String,
      default: null,
    },

    accuracy: {
      type: Number,
      default: null,
    },

    source: {
      type: String,
      enum: [
        "gps",
        "network",
        "manual",
        "unknown",
      ],
      default: "unknown",
    },

    device_meta: {
      type: Schema.Types.Mixed,
      default: {},
    },

    /**
     * Last location update timestamp
     */
    last_seen_at: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

/**
 * Geo Queries
 */
UserLocationSchema.index({
  location: "2dsphere",
});

/**
 * H3 Queries
 */
UserLocationSchema.index({
  h3_index: 1,
});

UserLocationSchema.index({
  h3_index: 1,
  last_seen_at: -1,
});

/**
 * User Queries
 */
UserLocationSchema.index({
  user_id: 1,
  updatedAt: -1,
});

const UserLocationModel = mongoose.model(
  "UserLocation",
  UserLocationSchema,
);

export default UserLocationModel