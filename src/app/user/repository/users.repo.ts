import {db} from "../../../common/knex/knex";
import {User} from "../entity/user.entity";

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


export async function createUser(user:Partial<User>): Promise<User> {
    const [row] = await db("users").insert({
        email: user.email,
        phone: user.phone,
        name: user.name,
        password_hash: user.passwordHash,
        system_role:user.systemRole,
        createdAt: new Date(),
        updatedAt: new Date(),
    }).returning(USER_COLUMNS);
return toEntity(row);
}