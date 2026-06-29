
import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import Singleton from "../../utils/Singleton";
import UserEmotionProfileService from "../../services/UserEmotionProfile.service";
import { ApiResponse } from "../../utils/ApiResponse";
import { listen_event_metadata } from "../typings/userEmotionProfile.typings";



class UserEmotionProfileController{

    private userEmotionalProfileService = Singleton.instance<UserEmotionProfileService>(UserEmotionProfileService)
    /*
    POST: /api/v1/platform/emotion-profile
    */

   public storeSongListeningEvent = asyncHandler(async(req:Request,res:Response)=>{

    const user_id = req.user?._id || "609d8a39a2b9a4c1f2d3e456" 
    const listen_event_metadata:listen_event_metadata = req.body

    //[TODO] validate listen_event_metadata using zod
    const data = await this.userEmotionalProfileService.saveListeningEvent(user_id,listen_event_metadata) 
    return res.json(
        ApiResponse.success(data,"Event Saved")
    )
   })
}

export default UserEmotionProfileController