
import { Router } from "express"
import UserLocationController from "../controllers/v1/userLocation.contoller"
import Singleton from "../utils/Singleton"
import AuthMiddleware from "../middlewares/auth.middleware"

class ExternalRoutes {
    public path ='api/v1/platform'
    public router = Router()

    public auth = Singleton.instance<AuthMiddleware>(AuthMiddleware)
    public UserLocationController = Singleton.instance<UserLocationController>(UserLocationController) 

    constructor(){
        this.initializeUserLocationRoutes(`${this.path}/user-location`)
    }

    public initializeUserLocationRoutes(prefix:string){

        this.router.get(
            `${prefix}/get-user-location`,
            this.auth.authenticate
            
        )

    }


    
}

export default ExternalRoutes