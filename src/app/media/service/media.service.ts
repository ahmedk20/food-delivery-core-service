import {inject, injectable} from "tsyringe";
import {v4 as uuid} from "uuid";
import {TOKENS} from "../../../lib/di/tokens";
import {UnAuthorisedError} from "../../../lib/auth/errors";
import {requireSystemRole} from "../../../lib/auth/rbac";
import type {IStorageProvider} from "../../../pkg/storage/storage.interface";
import {SystemRole} from "../../user/enums";
import {RestaurantNotFoundError} from "../../restaurant/errors";
import {findRestaurantById} from "../../restaurant/repository/restaurant.repo";
import {MediaStatus} from "../enums";
import {MediaNotFoundError} from "../errors";
import {CreateUploadUrlDTO} from "../dto/media.dto";
import {createMedia, findMediaById, updateMediaStatus} from "../repository/media.repository";

@injectable()
export class MediaService {
    constructor(@inject(TOKENS.StorageProvider) private readonly storageProvider: IStorageProvider) {
    }

    /**
     * Creates a pending media record and returns a presigned PUT url. The
     * frontend uploads the file directly to S3 with `uploadUrl`, then passes
     * `mediaUrl` as-is to the create-product / restaurant-logo endpoints.
     * Only system admins and restaurant users may upload.
     */
    createUploadUrl = async (userId: number, userRole: SystemRole, actorRestaurantId: number | undefined, data: CreateUploadUrlDTO) => {
        requireSystemRole(userRole, [SystemRole.SYSTEM_ADMIN, SystemRole.RESTAURANT_USER]);

        // media.restaurant_id reflects whose resource the file belongs to
        // (product image, logo, ...), NOT who is taking the action. Restaurant
        // users can only upload for their own restaurant; admins pass
        // data.restaurantId explicitly (omit it for platform-level assets).
        let targetRestaurantId: number | null;
        if (userRole === SystemRole.RESTAURANT_USER) {
            if (data.restaurantId && Number(data.restaurantId) !== Number(actorRestaurantId)) {
                throw UnAuthorisedError;
            }
            targetRestaurantId = Number(actorRestaurantId);
        } else {
            targetRestaurantId = data.restaurantId ?? null;
            if (targetRestaurantId) {
                const restaurant = await findRestaurantById(targetRestaurantId);
                if (!restaurant) throw RestaurantNotFoundError();
            }
        }

        // Key layout groups a restaurant's assets under one prefix; the uuid
        // guarantees uniqueness so two files with the same name never collide.
        const prefix = targetRestaurantId ? `restaurants/${targetRestaurantId}` : 'restaurants/admin';
        const safeName = data.fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
        const key = `${prefix}/${uuid()}-${safeName}`;

        const presigned = await this.storageProvider.getPresignedUploadUrl(key, data.contentType);

        const media = await createMedia({
            restaurantId: targetRestaurantId,
            uploadedBy: userId,
            status: MediaStatus.PENDING,
            mediaUrl: presigned.publicUrl,
            createdAt: new Date(),
        });

        return {
            mediaId: media.id,
            uploadUrl: presigned.uploadUrl,
            mediaUrl: presigned.publicUrl,
        };
    }

    /**
     * Marks a pending media record as uploaded. Called by the frontend after
     * the PUT to S3 succeeds. Only the uploader (or a system admin) may confirm.
     */
    confirmUpload = async (mediaId: number, userId: number, userRole: SystemRole) => {
        const media = await findMediaById(mediaId);
        if (!media) throw MediaNotFoundError;

        if (userRole !== SystemRole.SYSTEM_ADMIN && Number(media.uploadedBy) !== Number(userId)) {
            throw UnAuthorisedError;
        }

        if (media.status === MediaStatus.UPLOADED) return media;

        return await updateMediaStatus(mediaId, MediaStatus.UPLOADED);
    }
}
