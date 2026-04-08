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
import {RestaurantNotFoundError} from "../errors";
import {SystemRole} from "../../user/enums";
import {db} from "../../../common/knex/knex";
import {UnAuthorisedError} from "../../../common/auth/errors";
import {userService, UserService} from "../../user/service/user.service";
import {memberService, MemberService} from "../../rbac/service/member.service";

export class RestaurantService {
    constructor(
        private readonly userService: UserService,
        private readonly memberService: MemberService,
    ) {}

    create = async (userId: number, data: RegisterRestaurantDTO, trx: Knex) => {
        const now = new Date();
        const restaurant = new RestaurantEntity({
            ownerId: userId,
            name: data.name,
            logoUrl: data.logoURL,
            primaryCountry: data.primaryCountry,
            status: RestaurantStatus.PENDING,
            createdAt: now,
            updatedAt: now,
            statusUpdatedAt: now,
        });
        const result = await createRestaurant(restaurant, trx);
        return result;
    }

    createWithOwner = async (userRole: SystemRole, data: CreateRestaurantDTO) => {
        if (userRole !== SystemRole.SYSTEM_ADMIN) {
            throw UnAuthorisedError;
        }

        const trx = await db.transaction();
        let owner;
        let restaurant;

        try {
            owner = await this.userService.create({
                email: data.owner.email,
                phone: data.owner.phone,
                name: data.owner.name,
                password: data.owner.password,
                systemRole: SystemRole.RESTAURANT_OWNER,
            }, trx);

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

            await this.memberService.createOwnerMember(restaurant.id, owner.id, trx);

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
        const restaurant = await findRestaurantById(restaurantId);
        if (!restaurant) {
            throw RestaurantNotFoundError;
        }

        if (
            userRole !== SystemRole.SYSTEM_ADMIN &&
            restaurant.ownerId !== userId
        ) {
            throw UnAuthorisedError;
        }

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
        if (userRole !== SystemRole.SYSTEM_ADMIN) {
            throw UnAuthorisedError;
        }

        const restaurant = await findRestaurantById(restaurantId);
        if (!restaurant) {
            throw RestaurantNotFoundError;
        }

        const updated = await updateRestaurantStatus(restaurantId, data.status);
        if (!updated) {
            throw RestaurantNotFoundError;
        }

        return {
            id: updated.id,
            status: updated.status,
        };
    }

    findAll = async () => {
        const result = await findAllRestaurants();
        return result;
    }
}

export const restaurantService = new RestaurantService(userService, memberService);
