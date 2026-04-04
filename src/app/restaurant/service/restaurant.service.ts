import {RegisterRestaurantDTO} from "../../auth/dto/auth.dto";
import {Knex} from "knex";
import {RestaurantEntity} from "../entity/restaurant.entity";
import {RestaurantStatus} from "../enums";
import {createRestaurant, findAllRestaurants} from "../repository/restaurant.repo";

export class RestaurantService {

    create = async (userId:number,data:RegisterRestaurantDTO,trx:Knex) => {
        const now = new Date();
        const restaurant = new RestaurantEntity({
            ownerId:userId,
            name:data.name,
            logoUrl:data.logoURL,
            primaryCountry:data.primaryCountry,
            status:RestaurantStatus.PENDING,
            createdAt:now,
            updatedAt:now,
            statusUpdatedAt:now,
        })
        const result =  await createRestaurant(restaurant,trx);
        return result;
    }
    findAll = async ()=>{
        const result = await findAllRestaurants();
        return result;
    }

}

export const restaurantService = new RestaurantService();