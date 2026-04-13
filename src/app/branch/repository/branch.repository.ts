import {Knex} from "knex";
import {db} from "../../../lib/knex/knex";
import {Branch} from "../entity/branch.entity";
import {applyCursorPagination, applyFilters, buildPaginationResult, FilterParams, PaginationParams} from "../../../lib/http/pagination/cursor-pagination";

const BRANCH_COLUMNS = ['id','restaurant_id','country_code','address_text','label','lat','lng',
    'is_active','opens_at','closes_at','accept_orders','created_at','updated_at',
    'delivery_radius','currency','commission','location'];

function toEntity(row: any) {
    return new Branch({
        id: row.id,
        restaurantId: row.restaurant_id,
        countryCode: row.country_code,
        addressText: row.address_text,
        label: row.label,
        lat: row.lat,
        lng: row.lng,
        isActive: row.is_active,
        opensAt: row.opens_at,
        closesAt: row.closes_at,
        acceptOrders: row.accept_orders,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        deliveryRadius: row.delivery_radius,
        currency: row.currency,
        commission: row.commission,
        location: row.location
    });
}

export async function createBranch (data: Partial <Branch>, conn: Knex = db): Promise<Branch> {
    const [row] = await conn("restaurant_branches").insert({
        restaurant_id: data.restaurantId,
        country_code: data.countryCode,
        address_text: data.addressText,
        label: data.label,
        lat: data.lat,
        lng: data.lng,
        is_active: data.isActive,
        opens_at: data.opensAt,
        closes_at: data.closesAt,
        accept_orders: data.acceptOrders,
        created_at: data.createdAt,
        updated_at: data.updatedAt,
        delivery_radius: data.deliveryRadius,
        currency: data.currency,
        commission: data.commission
    }).returning(BRANCH_COLUMNS);

    return toEntity(row);
}

export async function findNearbyBranches(lat: number, lng: number): Promise<Branch[]> {
    const result = await db.raw(`
       SELECT
       b.id,
       b.restaurant_id,
       b.address_text,
       b.label,
       b.lat,
       b.lng,
       b.is_active,
       b.accept_orders,
       b.currency,
       r.name,
       r.logo_url
       FROM restaurant_branches b JOIN restaurants r ON  b.restaurant_id = r.id
       WHERE b.is_active = true AND r.status ='active'
       AND ST_DWithin(b.location, ST_MakePoint(?, ?)::geography, b.delivery_radius*1000)
    `,[lng, lat]);

    return result.rows;
}

export type BranchSortField = 'id' | 'label';
export type BranchFilterField = 'label' | 'is_active';

export async function findBranchesByRestaurant(
    restaurantId: number,
    pagination: PaginationParams<Record<string, any>, BranchSortField>,
    filters: FilterParams<Record<string, any>, BranchFilterField>[]
) {
    let query = db("restaurant_branches")
        .select(BRANCH_COLUMNS)
        .where("restaurant_id", restaurantId);

    query = applyFilters(query, filters);
    query = applyCursorPagination(query, pagination);

    const rawRows = await query;
    const { rows, hasMore, nextCursor } = buildPaginationResult(rawRows, pagination.limit, pagination.sortBy, pagination.sortOrder);
    return { data: rows.map(toEntity), meta: { hasMore, nextCursor } };
}

export async function findBranchById(id: number): Promise<Branch | undefined> {
    const row = await db("restaurant_branches")
        .select(BRANCH_COLUMNS)
        .where("id", id)
        .first();
    return row ? toEntity(row) : undefined;
}

export async function updateBranch(
    id: number,
    updates: Partial<Pick<Branch, 'label' | 'addressText' | 'lat' | 'lng' | 'opensAt' | 'closesAt' | 'deliveryRadius' | 'currency' | 'acceptOrders'>>,
    conn: Knex = db
): Promise<Branch | undefined> {
    const updateData: Record<string, any> = {
        updated_at: new Date(),
    };

    if (updates.label !== undefined) {
        updateData.label = updates.label;
    }
    if (updates.addressText !== undefined) {
        updateData.address_text = updates.addressText;
    }
    if (updates.lat !== undefined) {
        updateData.lat = updates.lat;
    }
    if (updates.lng !== undefined) {
        updateData.lng = updates.lng;
    }
    if (updates.opensAt !== undefined) {
        updateData.opens_at = updates.opensAt;
    }
    if (updates.closesAt !== undefined) {
        updateData.closes_at = updates.closesAt;
    }
    if (updates.deliveryRadius !== undefined) {
        updateData.delivery_radius = updates.deliveryRadius;
    }
    if (updates.currency !== undefined) {
        updateData.currency = updates.currency;
    }
    if (updates.acceptOrders !== undefined) {
        updateData.accept_orders = updates.acceptOrders;
    }

    const [row] = await conn("restaurant_branches")
        .where("id", id)
        .update(updateData)
        .returning(BRANCH_COLUMNS);

    return row ? toEntity(row) : undefined;
}

export async function updateBranchStatus(
    id: number,
    updates: Partial<Pick<Branch, 'isActive' | 'commission'>>,
    conn: Knex = db
): Promise<Branch | undefined> {
    const updateData: Record<string, any> = {
        updated_at: new Date(),
    };

    if (updates.isActive !== undefined) {
        updateData.is_active = updates.isActive;
    }
    if (updates.commission !== undefined) {
        updateData.commission = updates.commission;
    }

    const [row] = await conn("restaurant_branches")
        .where("id", id)
        .update(updateData)
        .returning(BRANCH_COLUMNS);

    return row ? toEntity(row) : undefined;
}