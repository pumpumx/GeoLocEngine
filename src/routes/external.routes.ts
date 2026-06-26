
import { Router } from "express"
import UserLocationController from "../controllers/v1/userLocation.contoller"
import Singleton from "../utils/Singleton"
import AuthMiddleware from "../middlewares/auth.middleware"
import { asyncHandler } from "../utils/asyncHandler"
import { UserEmotionProfile } from "../models/userEmotionProfile.model"
import UserEmotionProfileController from "../controllers/v1/userEmotionProfile.controller"

class ExternalRoutes {
    public path ='/api/v1/platform'
    public router = Router()

    public auth = Singleton.instance<AuthMiddleware>(AuthMiddleware)
    public UserLocationController = Singleton.instance<UserLocationController>(UserLocationController) 
    public userEmotionProfileController = Singleton.instance<UserEmotionProfileController>(UserEmotionProfileController)

    constructor(){
        this.initializeUserLocationRoutes(`${this.path}/user-location`)
        this.initializeUserEmotionController(`${this.path}/emotion-profile`)
    }

    public initializeUserLocationRoutes(prefix:string){

        //Get -> Gets User location
        this.router.get(
            `${prefix}/get-location`,
             asyncHandler(this.UserLocationController.getUserLocation)
        )

        //Post -> Frequent polling to update user location consistently , Can Rate limit this in future
        this.router.post(
            `${prefix}/update-location`,
            asyncHandler(this.UserLocationController.updateLocation)
        )

        /* GET -> Fetches nearby user location 
            -> GEO Spatial quries
        */
        this.router.get(
            `${prefix}/nearby-users`,
            asyncHandler(this.UserLocationController.getNearbyUsers)
        )
        
        //Get -> Get nearby user according to the cell they are in
        this.router.get(
            `${prefix}/get-cell-users`,
            asyncHandler(this.UserLocationController.getUsersByCell)
        )

        //Delete -> Will keep this off for the time being
        this.router.delete(
            `${prefix}/delete-location`,
            asyncHandler(this.UserLocationController.deleteLocation)
        )
    }

    public initializeUserEmotionController(prefix:string){
        this.router.post(
            `${prefix}/save-event`,
            // this.auth.authenticate,
            this.userEmotionProfileController.storeSongListeningEvent
        )
    }


}

export default ExternalRoutes