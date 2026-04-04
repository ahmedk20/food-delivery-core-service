import { RefreshToken } from "../entity/refresh-token.entity";
import { db } from "../../../common/knex/knex";

const REFRESH_TOKEN_COLUMNS = ['id', 'user_id', 'token_hash', 'expires_at', 'created_at', 'revoked_at'];

function toEntity(row: any): RefreshToken {
    return new RefreshToken({
        id: row.id,
        userId: Number(row.user_id),
        tokenHash: row.token_hash,
        expiresAt: row.expires_at,
        createdAt: row.created_at,
        revokedAt: row.revoked_at,
    });
}

export async function createRefreshTokenRecord(data: Partial<RefreshToken>
): Promise<number> {
    const [row] = await db("refresh_tokens")
        .insert({
            user_id: data.userId,
            token_hash: data.tokenHash,
            expires_at: data.expiresAt,
            created_at: data.createdAt,
        })
        .returning('id');
    return row.id;
}

export async function findRefreshTokenByHash(tokenHash: string): Promise<RefreshToken | undefined> {
    const row = await db("refresh_tokens")
        .select(REFRESH_TOKEN_COLUMNS)
        .where("token_hash", tokenHash)
        .whereNull("revoked_at")
        .first();
    return row ? toEntity(row) : undefined;
}

export async function revokeRefreshTokenById(id: number): Promise<void> {
    await db("refresh_tokens").where('id', id).update({ revoked_at: new Date() });
}

export async function revokeRefreshTokenByHash(tokenHash: string): Promise<void> {
    await db("refresh_tokens").where('token_hash', tokenHash).update({ revoked_at: new Date() });
}
