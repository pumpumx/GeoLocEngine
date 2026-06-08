
import { Router } from "express"
import UserLocationController from "../controllers/v1/userLocation.contoller"
import Singleton from "../utils/Singleton"
import AuthMiddleware from "../middlewares/auth.middleware"
import { asyncHandler } from "../utils/asyncHandler"

class ExternalRoutes {
    public path ='/api/v1/platform'
    public router = Router()

    public auth = Singleton.instance<AuthMiddleware>(AuthMiddleware)
    public UserLocationController = Singleton.instance<UserLocationController>(UserLocationController) 

    constructor(){
        this.initializeUserLocationRoutes(`${this.path}/user-location`)
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
    }
}

export default ExternalRoutes