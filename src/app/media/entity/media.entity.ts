import {MediaStatus} from "../enums";

export class Media {
    id: number;
    restaurantId: number | null; // null for platform-level (system admin) uploads
    uploadedBy: number;
    status: MediaStatus;
    mediaUrl: string;
    createdAt: Date;

    constructor(data: Partial<Media>) {
        this.id = data.id!;
        this.restaurantId = data.restaurantId ?? null;
        this.uploadedBy = data.uploadedBy!;
        this.status = data.status ?? MediaStatus.PENDING;
        this.mediaUrl = data.mediaUrl!;
        this.createdAt = data.createdAt ?? new Date();
    }
}
