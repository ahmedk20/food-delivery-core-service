import {UnAuthorisedError} from "../../../lib/auth/errors";
import {findRestaurantById} from "../../restaurant/repository/restaurant.repo";
import {SystemRole} from "../../user/enums";
import {CreateBranchDTO, UpdateBranchDTO, UpdateBranchStatusDTO} from "../dto/branch.dto";
import {
    findNearbyBranches,
    createBranch,
    findBranchesByRestaurant,
    findBranchById,
    updateBranch,
    updateBranchStatus,
    BranchSortField,
    BranchFilterField,
} from "../repository/branch.repository";
import {BranchNotFoundError} from "../errors";
import {injectable} from "tsyringe";
import {parsePaginationQuery, parseFilters} from "../../../lib/http/pagination/parse-query";
import {db} from "../../../lib/knex/knex";
import {writeOutboxEvent} from "../../../lib/outbox/writer";

@injectable()

export class BranchService {

    findNearby = async (lat:number, lng:number) => {
        const rows = await findNearbyBranches(lat, lng);
        return rows;
    }

    findByRestaurant = async (restaurantId: number, query: Record<string, any>) => {
        const pagination = parsePaginationQuery<Record<string, any>, BranchSortField>(
            query, ['id', 'label'], 'id'
        );
        const filters = parseFilters<Record<string, any>, BranchFilterField>(
            query, ['label', 'is_active']
        );
        return await findBranchesByRestaurant(restaurantId, pagination, filters);
    }

    create = async (restaurantId: number, userId: number, userRole: SystemRole, data: CreateBranchDTO) => {
        const restaurant = await findRestaurantById(restaurantId);

        // if the logged in user is nto system admin and not the owner of restaurant then throw unauthorised err
        if(userRole != SystemRole.SYSTEM_ADMIN && (Number(restaurant?.ownerId) !== Number(userId)) ){
            throw UnAuthorisedError
        }

        const now = new Date();
        const branch = await createBranch({
            restaurantId: restaurantId,
            label: data.label,
            countryCode: data.countryCode,
            lat: data.lat,
            lng: data.lng,
            addressText: data.addressText,
            isActive: false,
            opensAt: data.opensAt,
            closesAt: data.closesAt,
            currency: data.currency,
            deliveryRadius: data.deliveryRadius,
            commission: 0,
            createdAt: now,
            updatedAt: now,
            acceptOrders: true,
        });

        return branch;
    }

    update = async (
        branchId: number,
        userId: number,
        userRole: SystemRole,
        data: UpdateBranchDTO
    ) => {
        // Find branch
        const branch = await findBranchById(branchId);
        if (!branch) {
            throw BranchNotFoundError();
        }

        // Find restaurant to check ownership
        const restaurant = await findRestaurantById(branch.restaurantId);

        // Check authorization: owner or admin
        if (
            userRole !== SystemRole.SYSTEM_ADMIN &&
            Number(restaurant?.ownerId) !== Number(userId)
        ) {
            throw UnAuthorisedError;
        }

        // Update branch + emit event atomically.
        const trx = await db.transaction();
        try {
            const updated = await updateBranch(branchId, data, trx);
            if (!updated) {
                throw BranchNotFoundError();
            }
            await writeOutboxEvent(trx, "branch.updated", String(branchId), { branchId });
            await trx.commit();
            return updated;
        } catch (e) {
            await trx.rollback();
            throw e;
        }
    }

    updateStatus = async (
        branchId: number,
        userRole: SystemRole,
        data: UpdateBranchStatusDTO
    ) => {
        // Check if user is system_admin
        if (userRole !== SystemRole.SYSTEM_ADMIN) {
            throw UnAuthorisedError;
        }

        // Find branch (404 check)
        const branch = await findBranchById(branchId);
        if (!branch) {
            throw BranchNotFoundError();
        }

        // Update status + emit event atomically.
        const trx = await db.transaction();
        try {
            const updated = await updateBranchStatus(branchId, data, trx);
            if (!updated) {
                throw BranchNotFoundError();
            }

            // Any status change invalidates the consumer's cached branch metadata.
            // Deactivation is its own event; every other transition (including
            // reactivation and commission changes) emits branch.updated so a
            // reactivated branch isn't left cached as inactive until the TTL.
            if (updated.isActive === false) {
                await writeOutboxEvent(trx, "branch.deactivated", String(branchId), { branchId });
            } else {
                await writeOutboxEvent(trx, "branch.updated", String(branchId), { branchId });
            }

            await trx.commit();
            return {
                id: updated.id,
                isActive: updated.isActive,
                acceptOrders: updated.acceptOrders,
                commission: updated.commission,
            };
        } catch (e) {
            await trx.rollback();
            throw e;
        }
    }
}

