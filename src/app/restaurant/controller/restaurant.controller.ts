import { Request, Response, NextFunction } from "express";
import { RestaurantService } from "../service/restaurant.service";
import { validateBody } from "../../../lib/validation/validate";
import {
    CreateRestaurantDTO,
    UpdateRestaurantDTO,
    UpdateRestaurantStatusDTO,
} from "../dto/restaurant.dto";
import { SystemRole } from "../../user/enums";
import {inject, injectable} from "tsyringe";
import {TOKENS} from "../../../lib/di/tokens";
import {sendSuccess} from "../../../lib/http/response";

@injectable()
export class RestaurantController {
    constructor(@inject(TOKENS.RestaurantService) private readonly restaurantService: RestaurantService) {}

    create = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const data = await validateBody(CreateRestaurantDTO, req.body);
            const result = await this.restaurantService.createWithOwner(
                req.user?.role as SystemRole,
                data
            );
            sendSuccess(res, {
                message: "Restaurant and owner created successfully",
                restaurant: result.restaurant,
                owner: result.owner,
            }, 201);
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
            sendSuccess(res, { message: "Restaurant updated successfully", restaurant });
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
            sendSuccess(res, { message: "Restaurant status updated successfully", restaurant });
        } catch (error) {
            next(error);
        }
    };

    getAll = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const restaurants = await this.restaurantService.findAll();
            sendSuccess(res, restaurants);
        } catch (error) {
            next(error);
        }
    }
}
