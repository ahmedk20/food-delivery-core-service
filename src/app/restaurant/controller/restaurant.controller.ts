import { Request, Response, NextFunction } from "express";
import { RestaurantService,restaurantService } from "../service/restaurant.service";

export class RestaurantController {
    constructor(private readonly restaurantService: RestaurantService) {}

   getAll=async(req:Request,res:Response,next:NextFunction)=>{
    try {
        const restaurants = await this.restaurantService.findAll();
        res.status(200).json(restaurants);
    } catch (error) {
        next(error);
    }
   }
}

export const restaurantController = new RestaurantController(restaurantService);