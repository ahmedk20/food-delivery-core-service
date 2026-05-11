declare namespace Express {
    interface Request {
        correlationId?: string;
        user?:{
            userId: number;
            email: string;
            role: string;
            restaurantId?: number;
            restaurantRole?: string;
            branchIds?: number[];
            [key: string]: unknown;
        }
    }
}