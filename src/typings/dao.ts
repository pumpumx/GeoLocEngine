
import { Types } from "mongoose"


export interface UserLocationType {
  user_id: Types.ObjectId;

  location: {
    type: "Point";
    coordinates: [number, number]; // [longitude, latitude]
  };

  device_meta?: {
    platform?: string;
    app_version?: string;
    device_model?: string;
    os_version?: string;
    [key: string]: any;
  };

  curr_loc_index: string;
  last_loc_index?: string | null;

  accuracy?: number | null;
  h3_index?:string;
  h3_resolution?:string;
  previous_h3_index?:string

  last_seen_at:Date;

  source?: "gps" | "network" | "manual" | "unknown";

  createdAt?: Date;
  updatedAt?: Date;
}