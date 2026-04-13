import {UnAuthorisedError} from "../../../lib/auth/errors";
import {RestaurantNotFoundError} from "../../restaurant/errors";
import {findRestaurantById} from "../../restaurant/repository/restaurant.repo";
import {SystemRole} from "../../user/enums";
import {ProductNotFoundError} from "../errors"
import {CreateProductDTO, UpdateProductDTO} from "../dto/product.dto";
import {
    createProduct,
    findProductById,
    findProductByIdWithBranch,
    findProductsByBranch,
    findProductsByRestaurant,
    softDeleteProduct,
    updateProduct,
    ProductSortField,
    ProductFilterField,
    BranchProductFilterField,
} from "../repository/product.repository";
import {parsePaginationQuery, parseFilters} from "../../../lib/http/pagination/parse-query";
import {findOrCreateCategory, findCategoriesByRestaurant} from "../repository/category.repository";
import {updateBranchDetails} from "../repository/product-branch-details.repository";
import {injectable} from "tsyringe";

@injectable()

export class ProductService {

    create = async (restaurantId: number, userId: number, userRole: SystemRole, data: CreateProductDTO) => {
        const restaurant = await findRestaurantById(restaurantId);
        if (!restaurant) throw RestaurantNotFoundError;
        if (userRole !== SystemRole.SYSTEM_ADMIN && Number(restaurant.ownerId) !== Number(userId)) {
            throw UnAuthorisedError;
        }

        let categoryId: number | null = null;
        if (data.categoryName) {
            const category = await findOrCreateCategory(restaurantId, data.categoryName);
            categoryId = category.id;
        }

        return await createProduct({
            name: data.name,
            description: data.description,
            imageUrl: data.imageUrl,
            restaurantId,
            categoryId,
        });
    }

    findByRestaurant = async (restaurantId: number, userId: number, userRole: SystemRole, query: Record<string, any>) => {
        const restaurant = await findRestaurantById(restaurantId);
        if (!restaurant) throw RestaurantNotFoundError;
        if (userRole !== SystemRole.SYSTEM_ADMIN && Number(restaurant.ownerId) !== Number(userId)) {
            throw UnAuthorisedError;
        }
        const pagination = parsePaginationQuery<Record<string, any>, ProductSortField>(
            query, ['id', 'name'], 'id'
        );
        const filters = parseFilters<Record<string, any>, ProductFilterField>(
            query, ['name', 'category_id']
        );
        return await findProductsByRestaurant(restaurantId, pagination, filters);
    }

    findCategories = async (restaurantId: number) => {
        return await findCategoriesByRestaurant(restaurantId);
    }

    findByBranch = async (branchId: number, query: Record<string, any>) => {
        const availableOnly = query.availableOnly === 'true';
        const pagination = parsePaginationQuery<Record<string, any>, 'id'>(
            query, ['id'], 'id'
        );
        const filters = parseFilters<Record<string, any>, BranchProductFilterField>(
            query, ['name', 'category_id', 'is_available']
        );
        return await findProductsByBranch(branchId, pagination, filters, availableOnly);
    }

    findById = async (id: number, branchId?: number) => {
        if (branchId) {
            const product = await findProductByIdWithBranch(id, branchId);
            if (!product) throw ProductNotFoundError;
            return product;
        }
        const product = await findProductById(id);
        if (!product) throw ProductNotFoundError;
        return product;
    }

    update = async (productId: number, userId: number, userRole: SystemRole, data: UpdateProductDTO, branchId?: number) => {
        const product = await findProductById(productId);
        if (!product) throw ProductNotFoundError;

        const restaurant = await findRestaurantById(product.restaurantId);
        if (!restaurant) throw RestaurantNotFoundError;
        if (userRole !== SystemRole.SYSTEM_ADMIN && Number(restaurant.ownerId) !== Number(userId)) {
            throw UnAuthorisedError;
        }

        let categoryId: number | undefined = undefined;
        if (data.categoryName) {
            const category = await findOrCreateCategory(product.restaurantId, data.categoryName);
            categoryId = category.id;
        }

        const updatedProduct = await updateProduct(productId, {
            name: data.name,
            description: data.description,
            imageUrl: data.imageUrl,
            categoryId,
        });

        let branchDetails;
        if (branchId && (data.price !== undefined || data.stock !== undefined || data.isAvailable !== undefined)) {
            branchDetails = await updateBranchDetails(branchId, productId, {
                price: data.price,
                stock: data.stock,
                isAvailable: data.isAvailable,
            });
        }

        return {product: updatedProduct, branchDetails};
    }

    delete = async (productId: number, userId: number, userRole: SystemRole) => {
        const product = await findProductById(productId);
        if (!product) throw ProductNotFoundError;

        const restaurant = await findRestaurantById(product.restaurantId);
        if (!restaurant) throw RestaurantNotFoundError;
        if (userRole !== SystemRole.SYSTEM_ADMIN && Number(restaurant.ownerId) !== Number(userId)) {
            throw UnAuthorisedError;
        }

        await softDeleteProduct(productId);
    }
}

