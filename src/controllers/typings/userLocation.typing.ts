

export type getUserLocation = {
    UUID:string,
    lat:string,
    long:string,
    area:string,
    lastLoc:string,
}

export type UpdateUserCurLoc = {
    lat:number,
    long:number,
}

//Getting an array of location to increase accuracy
export type IUpdateUserLocationReqBody = {
      coords:UpdateUserCurLoc,
      accuracy?: number;
      device_meta?: Record<string, unknown>;
      userId?:string
}