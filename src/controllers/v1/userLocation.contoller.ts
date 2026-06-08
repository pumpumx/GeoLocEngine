// controllers/UserLocationController.ts

import { Request, Response } from "express";
import userLocationService from "../../services/userLocation.service";
import { IUpdateUserLocationReqBody } from "../typings/userLocation.typing";

class UserLocationController {
  /**
   * GET /location
   */
  public getUserLocation = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    const userId = req.body.userId || req.user._id
    const location = await userLocationService.getUserLocation(userId);

    res.status(200).json({
      success: true,
      data: location,
    });
  };

  /**
   * POST /location
   */
  public updateLocation = async (
    req: Request<{},{},IUpdateUserLocationReqBody,{}>,
    res: Response,
  ): Promise<void> => {

    console.log("Have a check",req.body)
    const userId = req.body?.userId || ""
    const location = await userLocationService.updateLocation(
      userId,
      req.body,
    );

    res.status(200).json({
      success: true,
      message: "Location updated successfully",
      data: location,
    });
  };

  /**
   * GET /location/nearby
   */
  public getNearbyUsers = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    const ringSize = req.query.ringSize ? Number(req.query.ringSize) : 1;

    const userId = req.body.userId || req.user._id

    const users = await userLocationService.getNearbyUsers(
       userId,
      ringSize,
    );

    res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  };

  /**
   * GET /location/cell/:h3Index
   */
  public getUsersByCell = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    const users = await userLocationService.getUsersByCell(req.params.h3Index);

    res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  };

  /**
   * DELETE /location
   */
  public deleteLocation = async (
    req: Request,
    res: Response,
  ): Promise<void> => {

    const userId = req.body.userId || req.user._id
    await userLocationService.deleteLocation(userId);

    res.status(200).json({
      success: true,
      message: "Location deleted successfully",
    });
  };
}

export default UserLocationController;
