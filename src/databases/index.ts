import mongoose from "mongoose";
import { mongoURI } from "../config";
import { AppError } from "../middlewares/appError.middleware";

export const connectWithMongo = async () => {
  try {
    await mongoose.connect(mongoURI);
      console.info(`=================================`);
      console.info(`🚀 DB Connected with URI: `, mongoURI);
      console.info(`=================================`);
  } catch (error) {
    throw new AppError("Mongo Connection Failed")
  }
};
