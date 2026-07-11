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
import {db} from "../../../lib/knex/knex";
import {writeOutboxEvent} from "../../../lib/outbox/writer";
import {findBranchIdsByRestaurant} from "../../branch/repository/branch.repository";
import {UnAuthorisedError} from "../../../lib/auth/errors";
import {UserService} from "../../user/service/user.service";
import {MemberService} from "../../member/service/member.service";
import {inject, injectable} from "tsyringe";
import {TOKENS} from "../../../lib/di/tokens";

@injectable()

export class RestaurantService {
    constructor(
       @inject(TOKENS.UserService) private readonly userService: UserService,
       @inject(TOKENS.MemberService) private readonly memberService: MemberService,
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
                systemRole: SystemRole.RESTAURANT_USER,
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
            throw RestaurantNotFoundError();
        }

        if (
            userRole !== SystemRole.SYSTEM_ADMIN &&
            Number(restaurant.ownerId) !== Number(userId)
        ) {
            throw UnAuthorisedError;
        }

        const updated = await updateRestaurant(restaurantId, data);
        if (!updated) {
            throw RestaurantNotFoundError();
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
            throw RestaurantNotFoundError();
        }

        const trx = await db.transaction();
        try {
            const updated = await updateRestaurantStatus(restaurantId, data.status, trx);
            if (!updated) {
                throw RestaurantNotFoundError();
            }

            // A restaurant suspension invalidates EVERY one of its branches in the
            // consumer's cache. Core owns the branch list, so the fan-out happens
            // here: one event per branch, each carrying the branchId the consumer
            // keys on (the consumer cannot derive this list itself).
            if (data.status === RestaurantStatus.SUSPENDED) {
                const branchIds = await findBranchIdsByRestaurant(restaurantId, trx);
                for (const branchId of branchIds) {
                    await writeOutboxEvent(trx, "restaurant.suspended", String(restaurantId), { branchId });
                }
            }

            await trx.commit();
            return {
                id: updated.id,
                status: updated.status,
            };
        } catch (e) {
            await trx.rollback();
            throw e;
        }
    }

    findAll = async () => {
        const result = await findAllRestaurants();
        return result;
    }
}

