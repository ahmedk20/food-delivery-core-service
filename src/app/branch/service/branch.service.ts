import {UnAuthorisedError} from "../../../common/auth/errors";
import {findRestaurantById} from "../../restaurant/repository/restaurant.repo";
import {SystemRole} from "../../user/enums";
import {CreateBranchDTO} from "../dto/branch.dto";
import {findNearbyBranches, createBranch} from "../repository/branch.repository";

export class BranchService {

    findNearby = async (lat:number, lng:number) => {
        const rows = await findNearbyBranches(lat, lng);
        return rows;
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
}

export const branchService = new BranchService();