export class RefreshToken {
    id: number;
    userId: number;
    tokenHash: string;
    expiresAt: Date;
    createdAt: Date;
    revokedAt: Date | null;

    constructor(data: Partial<RefreshToken>) {
        this.id = data.id!;
        this.userId = data.userId!;
        this.tokenHash = data.tokenHash!;
        this.expiresAt = data.expiresAt!;
        this.createdAt = data.createdAt!;
        this.revokedAt = data.revokedAt ?? null;
    }

    isExpired(): boolean {
        return this.expiresAt < new Date();
    }

    isRevoked(): boolean {
        return this.revokedAt !== null;
    }
}
