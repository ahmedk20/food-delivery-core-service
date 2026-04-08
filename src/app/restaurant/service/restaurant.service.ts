import {RegisterRestaurantDTO} from "../../auth/dto/auth.dto";
import {Knex} from "knex";
import {RestaurantEntity} from "../entity/restaurant.entity";
import {RestaurantStatus} from "../enums";
import {
    createRestaurant,
    findAllRestaurants,
    findRestaurantById,
    updateRestaurant,
    updateRestaurantStatus,
} from "../repository/restaurant.repo";
import {
    CreateRestaurantDTO,
    UpdateRestaurantDTO,
    UpdateRestaurantStatusDTO,
} from "../dto/restaurant.dto";
import {
    RestaurantNotFoundError,
    UserAlreadyExistsError,
} from "../errors";
import {findUserExistsByEmailOrPhone, createUser} from "../../user/repository/users.repo";
import {hashPassword} from "../../auth/utils/password.util";
import {SystemRole} from "../../user/enums";
import {db} from "../../../common/knex/knex";
import {UnAuthorisedError} from "../../../common/auth/errors";

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

    createWithOwner = async (userRole: SystemRole, data: CreateRestaurantDTO) => {
        // Check if user is system_admin
        if (userRole !== SystemRole.SYSTEM_ADMIN) {
            throw UnAuthorisedError;
        }

        // Check if user already exists
        const userExists = await findUserExistsByEmailOrPhone(
            data.owner.email,
            data.owner.phone
        );
        if (userExists) {
            throw UserAlreadyExistsError;
        }

        // Hash password
        const hashedPassword = await hashPassword(data.owner.password);

        // Start transaction
        const trx = await db.transaction();
        let owner;
        let restaurant;

        try {
            // Create owner user
            owner = await createUser(
                {
                    email: data.owner.email,
                    phone: data.owner.phone,
                    name: data.owner.name,
                    passwordHash: hashedPassword,
                    systemRole: SystemRole.RESTAURANT_OWNER,
                },
                trx
            );

            // Create restaurant
            const now = new Date();
            restaurant = await createRestaurant(
                {
                    ownerId: owner.id,
                    name: data.name,
                    logoUrl: data.logoUrl || "",
                    primaryCountry: data.primaryCountry,
                    status: RestaurantStatus.PENDING,
                    createdAt: now,
                    updatedAt: now,
                    statusUpdatedAt: now,
                },
                trx
            );

            await trx.commit();
        } catch (e) {
            await trx.rollback();
            throw e;
        }

        return {
            restaurant: {
                id: restaurant.id,
                ownerId: restaurant.ownerId,
                name: restaurant.name,
                logoURL: restaurant.logoUrl,
                primaryCountry: restaurant.primaryCountry,
                status: restaurant.status,
                createdAt: restaurant.createdAt.toISOString(),
            },
            owner: {
                id: owner.id,
                email: owner.email,
                phone: owner.phone,
                name: owner.name,
                systemRole: owner.systemRole,
            },
        };
    }

    update = async (
        restaurantId: number,
        userId: number,
        userRole: SystemRole,
        data: UpdateRestaurantDTO
    ) => {
        // Find restaurant
        const restaurant = await findRestaurantById(restaurantId);
        if (!restaurant) {
            throw RestaurantNotFoundError;
        }

        // Check authorization: owner or admin
        if (
            userRole !== SystemRole.SYSTEM_ADMIN &&
            restaurant.ownerId !== userId
        ) {
            throw UnAuthorisedError;
        }

        // Update restaurant
        const updated = await updateRestaurant(restaurantId, data);
        if (!updated) {
            throw RestaurantNotFoundError;
        }

        return {
            id: updated.id,
            name: updated.name,
            logoURL: updated.logoUrl,
            primaryCountry: updated.primaryCountry,
            status: updated.status,
            updatedAt: updated.updatedAt.toISOString(),
        };
    }

    updateStatus = async (
        restaurantId: number,
        userRole: SystemRole,
        data: UpdateRestaurantStatusDTO
    ) => {
        // Check if user is system_admin
        if (userRole !== SystemRole.SYSTEM_ADMIN) {
            throw UnAuthorisedError;
        }

        // Find restaurant (404 check)
        const restaurant = await findRestaurantById(restaurantId);
        if (!restaurant) {
            throw RestaurantNotFoundError;
        }

        // Update status
        const updated = await updateRestaurantStatus(restaurantId, data.status);
        if (!updated) {
            throw RestaurantNotFoundError;
        }

        return {
            id: updated.id,
            status: updated.status,
        };
    }

    findAll = async ()=>{
        const result = await findAllRestaurants();
        return result;
    }

}

export const restaurantService = new RestaurantService();