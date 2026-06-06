// controllers/UserLocationController.ts

import { Request, Response } from "express";
import userLocationService from "../../services/userLocation.service";

class UserLocationController {
  /**
   * GET /location
   */
  public getUserLocation = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    const location = await userLocationService.getUserLocation(req.user._id);

    res.status(200).json({
      success: true,
      data: location,
    });
  };

  /**
   * POST /location
   */
  public updateLocation = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    const location = await userLocationService.updateLocation(
      req.user._id,
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

    const users = await userLocationService.getNearbyUsers(
      req.user!._id,
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
    await userLocationService.deleteLocation(req.user!._id);

    res.status(200).json({
      success: true,
      message: "Location deleted successfully",
    });
  };
}

export default UserLocationController;
