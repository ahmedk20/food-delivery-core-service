import {Knex} from "knex";
import {db} from "../../../common/knex/knex";
import {RestaurantMember} from "../entity/restaurant-member.entity";
import {MemberStatus} from "../enums";

const MEMBER_COLUMNS = ['id','restaurant_id','user_id','role_id','status','created_at','updated_at'];

function toEntity(row:any) {
    return new RestaurantMember({
        id: row.id,
        restaurantId: row.restaurant_id,
        userId: row.user_id,
        roleId: row.role_id,
        status: row.status,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    })
}

export async function createRestaurantMember(data: Partial<RestaurantMember>, conn: Knex = db): Promise<RestaurantMember> {
    const query = conn || db;
    const [row] = await query("restaurant_members").insert({
        restaurant_id: data.restaurantId,
        user_id: data.userId,
        role_id: data.roleId,
        status: data.status,
        created_at: data.createdAt,
        updated_at: data.updatedAt,
    }).returning(MEMBER_COLUMNS);
    return toEntity(row);
}

export async function activateMemberByUserId(userId:number, conn: Knex = db): Promise<void> {
    const query = conn || db;
    await query("restaurant_members").where("user_id", userId).update(
        {status: MemberStatus.ACTIVE,
        updated_at: new Date()}
    )
}

export async function findMembersByRestaurantId(restaurantId: number) {
    return db("restaurant_members as rm")
        .select(
            "rm.id",
            "rm.user_id as userId",
            "u.email",
            "u.name",
            "u.phone",
            "r.name as role",
            "r.display_name as roleDisplayName",
            "rm.status"
        )
        .join("users as u", "rm.user_id", "u.id")
        .join("roles as r", "rm.role_id", "r.id")
        .where("rm.restaurant_id", restaurantId);
}

export async function findMemberWithRoleName(memberId: number): Promise<{member: RestaurantMember; roleName: string} | null> {
    const row = await db("restaurant_members as rm")
        .select("rm.*", "r.name as role_name")
        .join("roles as r", "rm.role_id", "r.id")
        .where("rm.id", memberId)
        .first();

    if (!row) return null;

    return {
        member: toEntity(row),
        roleName: row.role_name,
    };
}

export async function updateMember(memberId: number, data: {roleId?: number; status?: string}, trx?: Knex): Promise<void> {
    const query = trx || db;
    await query("restaurant_members").where("id", memberId).update({
        ...(data.roleId !== undefined && { role_id: data.roleId }),
        ...(data.status !== undefined && { status: data.status }),
        updated_at: new Date(),
    });
}

export async function deleteMember(memberId: number, trx?: Knex): Promise<void> {
    const query = trx || db;
    await query("member_branches").where("member_id", memberId).delete();
    await query("restaurant_members").where("id", memberId).delete();
}

export async function findRestaurantMemberWithRole(userId: number): Promise<{member: RestaurantMember; roleName:string;}> {
    const row = await db("restaurant_members as rm").select(
        "rm.restaurant_id",
        "rm.id",
        "r.name as roleName"
    ).leftJoin("roles as r","rm.role_id","r.id")
        .where("rm.user_id", userId)
        .andWhere("rm.status",MemberStatus.ACTIVE).first();
    return {
        member: toEntity(row),
        roleName: row.roleName,
    };
}