import {Knex} from "knex";
import {db} from "../../../lib/knex/knex";
import {Product} from "../entity/product.entity";
import {applyCursorPagination, applyFilters, buildPaginationResult, FilterParams, PaginationParams} from "../../../lib/http/pagination/cursor-pagination";

const PRODUCT_COLUMNS = ['id', 'name', 'description', 'image_url', 'restaurant_id', 'category_id', 'created_at', 'updated_at', 'deleted_at'];

function toEntity(row: any): Product {
    return new Product({
        id: row.id,
        name: row.name,
        description: row.description,
        imageUrl: row.image_url,
        restaurantId: row.restaurant_id,
        categoryId: row.category_id,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        deletedAt: row.deleted_at,
    });
}

export async function createProduct(data: Partial<Product>, conn: Knex = db): Promise<Product> {
    const now = new Date();
    const [row] = await conn("products").insert({
        name: data.name,
        description: data.description,
        image_url: data.imageUrl,
        restaurant_id: data.restaurantId,
        category_id: data.categoryId,
        created_at: now,
        updated_at: now,
    }).returning(PRODUCT_COLUMNS);
    return toEntity(row);
}

export async function findProductById(id: number): Promise<Product | undefined> {
    const row = await db("products")
        .select(PRODUCT_COLUMNS)
        .where("id", id)
        .whereNull("deleted_at")
        .first();
    return row ? toEntity(row) : undefined;
}

export async function findProductByIdWithBranch(id: number, branchId: number) {
    const row = await db("products as p")
        .join("product_branch_details as pbd", function () {
            this.on("p.id", "=", "pbd.product_id").andOnVal("pbd.branch_id", branchId);
        })
        .leftJoin("product_categories as pc", "p.category_id", "pc.id")
        .where("p.id", id)
        .whereNull("p.deleted_at")
        .select(
            "p.id", "p.name", "p.description", "p.image_url", "p.restaurant_id", "p.category_id",
            "pc.name as category_name",
            "pbd.price", "pbd.stock", "pbd.is_available",
        )
        .first();
    if (!row) return undefined;
    return {
        id: row.id,
        name: row.name,
        description: row.description,
        imageUrl: row.image_url,
        restaurantId: row.restaurant_id,
        categoryId: row.category_id,
        categoryName: row.category_name,
        price: row.price,
        stock: row.stock,
        isAvailable: row.is_available,
    };
}

export type ProductSortField = 'id' | 'name';
export type ProductFilterField = 'name' | 'category_id';
export type BranchProductFilterField = 'name' | 'category_id' | 'is_available';

export async function findProductsByRestaurant(
    restaurantId: number,
    pagination: PaginationParams<Record<string, any>, ProductSortField>,
    filters: FilterParams<Record<string, any>, ProductFilterField>[]
) {
    let query = db("products")
        .select(PRODUCT_COLUMNS)
        .where("restaurant_id", restaurantId)
        .whereNull("deleted_at");

    query = applyFilters(query, filters);
    query = applyCursorPagination(query, pagination);

    const rawRows = await query;
    const { rows, hasMore, nextCursor } = buildPaginationResult(rawRows, pagination.limit, pagination.sortBy, pagination.sortOrder);
    return { data: rows.map(toEntity), meta: { hasMore, nextCursor } };
}

export async function findProductsByBranch(
    branchId: number,
    pagination: PaginationParams<Record<string, any>, 'id'>,
    filters: FilterParams<Record<string, any>, BranchProductFilterField>[],
    availableOnly = false
) {
    let query = db("products as p")
        .join("product_branch_details as pbd", "p.id", "pbd.product_id")
        .leftJoin("product_categories as pc", "p.category_id", "pc.id")
        .where("pbd.branch_id", branchId)
        .whereNull("p.deleted_at")
        .select(
            "p.id",
            "p.name",
            "p.description",
            "p.image_url",
            "p.restaurant_id",
            "p.category_id",
            "pc.name as category_name",
            "pbd.price",
            "pbd.stock",
            "pbd.is_available",
        );

    if (availableOnly) query = query.where("pbd.is_available", true);
    query = applyFilters(query, filters);

    // Use qualified column p.id to avoid ambiguity in the JOIN (products, pbd, and pc all have id)
    const { cursor, limit, sortOrder } = pagination;
    if (cursor !== undefined && cursor !== null) {
        query = query.where("p.id", sortOrder === "asc" ? ">" : "<", cursor);
    }
    query = query.orderBy("p.id", sortOrder).limit(limit + 1);

    const rawRows = await query;
    const hasMore = rawRows.length > limit;
    const sliced = rawRows.slice(0, limit);
    const nextCursor = hasMore ? sliced[sliced.length - 1].id : null;

    return {
        data: sliced.map((row: any) => ({
            id: row.id,
            name: row.name,
            description: row.description,
            imageUrl: row.image_url,
            restaurantId: row.restaurant_id,
            categoryId: row.category_id,
            categoryName: row.category_name,
            price: row.price,
            stock: row.stock,
            isAvailable: row.is_available,
        })),
        meta: { hasMore, nextCursor },
    };
}

export async function updateProduct(id: number, data: Record<string, any>, conn: Knex = db): Promise<Product> {
    const [row] = await conn("products")
        .where("id", id)
        .whereNull("deleted_at")
        .update({
            name: data.name,
            description: data.description,
            image_url: data.imageUrl,
            category_id: data.categoryId,
            updated_at: new Date(),
        })
        .returning(PRODUCT_COLUMNS);
    return toEntity(row);
}

export async function softDeleteProduct(id: number): Promise<void> {
    await db("products")
        .where("id", id)
        .whereNull("deleted_at")
        .update({ deleted_at: new Date() });
}
