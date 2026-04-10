import {Knex} from "knex";
import {db} from "../../../lib/knex/knex";
import {ProductCategory} from "../entity/product-category.entity";

const CATEGORY_COLUMNS = ['id', 'restaurant_id', 'name', 'created_at', 'updated_at'];

function toEntity(row: any): ProductCategory {
    return new ProductCategory({
        id: row.id,
        restaurantId: row.restaurant_id,
        name: row.name,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    });
}

export async function findCategoriesByRestaurant(restaurantId: number): Promise<ProductCategory[]> {
    const rows = await db("product_categories")
        .select(CATEGORY_COLUMNS)
        .where("restaurant_id", restaurantId);
    return rows.map(toEntity);
}

/**
 * Atomically finds or creates a category by name for a restaurant.
 * Uses INSERT ... ON CONFLICT DO NOTHING to avoid race conditions.
 */
export async function findOrCreateCategory(restaurantId: number, name: string, conn: Knex = db): Promise<ProductCategory> {
    const now = new Date();
    const [row] = await conn("product_categories")
        .insert({ restaurant_id: restaurantId, name, created_at: now, updated_at: now })
        .onConflict(['restaurant_id', 'name'])
        .ignore()
        .returning(CATEGORY_COLUMNS);
    if (row) return toEntity(row);
    // Conflict: another request created it first — fetch the existing one
    const existing = await conn("product_categories")
        .select(CATEGORY_COLUMNS)
        .where("restaurant_id", restaurantId)
        .where("name", name)
        .first();
    return toEntity(existing);
}
