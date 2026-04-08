import {db} from "../../../common/knex/knex";
import {RestaurantEntity} from "../entity/restaurant.entity";
import {Knex} from "knex";

const RESTAURANT_COLUMNS = ['id','owner_id','name', 'logo_url','status','primary_country'
    ,'created_at','updated_at','status_updated_at'];

function toEntity(row:any):RestaurantEntity{
    return new RestaurantEntity({
        id: row.id,
        ownerId: row.owner_id,
        name: row.name,
        logoUrl: row.logo_url,
        status: row.status,
        primaryCountry: row.primary_country,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        statusUpdatedAt: row.status_updated_at
    })
}

export async function findAllRestaurants():Promise<RestaurantEntity[]> {
    const rows = await db("restaurants").select(RESTAURANT_COLUMNS);
    return rows.map(toEntity);
}

export async function findRestaurantById(id:number):Promise<RestaurantEntity|undefined> {
    const row = await db("restaurants").select(RESTAURANT_COLUMNS).where("id", id).first().
    whereNull("deleted_at");
    return row ? toEntity(row) : undefined;
}

export async function findRestaurantByOwnerId(ownerId:number):Promise<RestaurantEntity|undefined> {
    const row = await db("restaurants").select(RESTAURANT_COLUMNS).where("owner_id", ownerId).first();
    return row ? toEntity(row) : undefined;
}

export async function createRestaurant(restaurant:Partial<RestaurantEntity>,conn:Knex= db):Promise<RestaurantEntity> {
    const [row] = await conn("restaurants").insert({
        owner_id: restaurant.ownerId,
        name: restaurant.name,
        logo_url: restaurant.logoUrl,
        status: restaurant.status,
        primary_country: restaurant.primaryCountry,
        created_at: restaurant.createdAt,
        updated_at: restaurant.updatedAt,
        status_updated_at: restaurant.statusUpdatedAt,
    }).returning(RESTAURANT_COLUMNS);
    return toEntity(row);
}

export async function updateRestaurant(
    id: number,
    updates: Partial<Pick<RestaurantEntity, 'name' | 'logoUrl' | 'primaryCountry'>>,
    conn: Knex = db
): Promise<RestaurantEntity | undefined> {
    const updateData: Record<string, any> = {
        updated_at: new Date(),
    };

    if (updates.name !== undefined) {
        updateData.name = updates.name;
    }
    if (updates.logoUrl !== undefined) {
        updateData.logo_url = updates.logoUrl;
    }
    if (updates.primaryCountry !== undefined) {
        updateData.primary_country = updates.primaryCountry;
    }

    const [row] = await conn("restaurants")
        .where("id", id)
        .whereNull("deleted_at")
        .update(updateData)
        .returning(RESTAURANT_COLUMNS);

    return row ? toEntity(row) : undefined;
}

export async function updateRestaurantStatus(
    id: number,
    status: string,
    conn: Knex = db
): Promise<RestaurantEntity | undefined> {
    const now = new Date();
    const [row] = await conn("restaurants")
        .where("id", id)
        .whereNull("deleted_at")
        .update({
            status,
            status_updated_at: now,
            updated_at: now,
        })
        .returning(RESTAURANT_COLUMNS);

    return row ? toEntity(row) : undefined;
}
