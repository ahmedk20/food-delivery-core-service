declare namespace Express {
    interface Request {
        correlationId?: string;
        user?:{
            id: string;
            email: string;
            role: string;
        }
    }
}