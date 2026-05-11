declare namespace Express {
    interface Request {
        correlationId?: string;
        region?: string;
        user?: {
            userId: number;
            role: import('../auth/roles.js').SystemRole;
            countryCode: string;
            restaurantId?: number;
            restaurantRole?: string;
            branchIds?: number[];
        };
    }
}
