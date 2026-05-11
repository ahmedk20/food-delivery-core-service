import {db} from "../../../lib/knex/knex";
import {User} from "../entity/user.entity";
import knex, {Knex} from "knex";

const USER_COLUMNS = [
    "id","email","phone","name","password_hash","system_role","created_at","updated_at","deleted_at"
]


function toEntity(row:any):User{
return new User({
    id: row.id,
    email: row.email,
    phone: row.phone,
    name: row.name,
    passwordHash: row.password_hash,
    systemRole: row.system_role,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
})

}
export async function findUserByEmail(email: string): Promise<User|undefined> {
const row = await db("users").select(USER_COLUMNS).where("email", email).whereNull("deleted_at").first();
console.log(row);
return row ? toEntity(row) : undefined;

}

export async function findUserExistsByEmailOrPhone(email: string , phone:string): Promise<boolean> {
    const result = await db.raw(`SELECT EXISTS (SELECT 1 FROM USERS WHERE email=? OR phone=? ) AS "exists"`,[email, phone]);
    return result.rows[0].exists;
}

export async function findUserById(id:number): Promise<User|undefined> {
    const row = await db("users").select(USER_COLUMNS).where("id", id).whereNull("deleted_at").first();
    console.log(row);
    return row ? toEntity(row) : undefined;
}

// @ts-ignore
export async function createUser(user:Partial<User>,conn:Knex=db): Promise<User> {
    const [row] = await conn("users").insert({
        email: user.email,
        phone: user.phone,
        name: user.name,
        password_hash: user.passwordHash,
        system_role:user.systemRole,
        created_at: new Date(),
        updated_at: new Date(),
    }).returning(USER_COLUMNS);
return toEntity(row);
}

export async function updateUserPassword(id: number, password: string) {
    await db("users").where("id", id).
    update({password_hash: password});
}

export async function updateUser(user: Partial<User>): Promise<User | undefined> {
    const [row] = await db("users")
        .where("id", user.id)
        .whereNull("deleted_at")
        .update({
            ...(user.phone !== undefined && { phone: user.phone }),
            ...(user.name !== undefined && { name: user.name }),
            updated_at: new Date(),
        })
        .returning(USER_COLUMNS);
    return row ? toEntity(row) : undefined;
}
