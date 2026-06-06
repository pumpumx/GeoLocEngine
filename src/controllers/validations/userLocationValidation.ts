import { z } from "zod";

export const updateLocationSchema = z.object({
  lat: z
    .number()
    .min(-90, "Latitude must be between -90 and 90")
    .max(90, "Latitude must be between -90 and 90"),

  lng: z
    .number()
    .min(-180, "Longitude must be between -180 and 180")
    .max(180, "Longitude must be between -180 and 180"),

  accuracy: z
    .number()
    .nonnegative()
    .optional(),

  device_meta: z
    .object({})
    .catchall(z.unknown())
    .optional(),
});

export type UpdateLocationDto = z.infer<
  typeof updateLocationSchema
>;