import { Request, Response, NextFunction } from "express";
import { RestaurantService,restaurantService } from "../service/restaurant.service";
import { validateBody } from "../../../common/validation/validate";
import {
    CreateRestaurantDTO,
    UpdateRestaurantDTO,
    UpdateRestaurantStatusDTO,
} from "../dto/restaurant.dto";
import { SystemRole } from "../../user/enums";

export class RestaurantController {
    constructor(private readonly restaurantService: RestaurantService) {}

    create = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const data = await validateBody(CreateRestaurantDTO, req.body);
            const result = await this.restaurantService.createWithOwner(
                req.user?.role as SystemRole,
                data
            );
            res.status(201).json({
                message: "Restaurant and owner created successfully",
                restaurant: result.restaurant,
                owner: result.owner,
            });
        } catch (error) {
            next(error);
        }
    };

    update = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const data = await validateBody(UpdateRestaurantDTO, req.body);
            const restaurant = await this.restaurantService.update(
                Number(req.params.id),
                req.user?.userId!,
                req.user?.role as SystemRole,
                data
            );
            res.status(200).json({
                message: "Restaurant updated successfully",
                restaurant,
            });
        } catch (error) {
            next(error);
        }
    };

    updateStatus = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const data = await validateBody(UpdateRestaurantStatusDTO, req.body);
            const restaurant = await this.restaurantService.updateStatus(
                Number(req.params.id),
                req.user?.role as SystemRole,
                data
            );
            res.status(200).json({
                message: "Restaurant status updated successfully",
                restaurant,
            });
        } catch (error) {
            next(error);
        }
    };

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