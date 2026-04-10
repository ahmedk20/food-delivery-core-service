import { db } from "../../../lib/knex/knex";
import { Address } from "../entity/address.entity";

const ADDRESS_COLUMNS = [
    'id', 'user_id', 'label', 'country', 'city', 'street',
    'building', 'apartment_number', 'type', 'lat', 'lng', 'is_default',
];

function toEntity(row: any): Address {
    return new Address({
        id: Number(row.id),
        userId: Number(row.user_id),
        label: row.label,
        country: row.country,
        city: row.city,
        street: row.street,
        building: row.building,
        apartmentNumber: row.apartment_number,
        type: row.type,
        lat: Number(row.lat),
        lng: Number(row.lng),
        isDefault: row.is_default,
    });
}

export async function findAddressesByUserId(userId: number): Promise<Address[]> {
    const rows = await db('customer_addresses')
        .select(ADDRESS_COLUMNS)
        .where('user_id', userId);
    return rows.map(toEntity);
}

export async function findAddressById(id: number): Promise<Address | undefined> {
    const row = await db('customer_addresses')
        .select(ADDRESS_COLUMNS)
        .where('id', id)
        .first();
    return row ? toEntity(row) : undefined;
}

export async function createAddress(data: Partial<Address>): Promise<Address> {
    const [row] = await db('customer_addresses')
        .insert({
            user_id: data.userId,
            label: data.label,
            country: data.country,
            city: data.city,
            street: data.street,
            building: data.building ?? null,
            apartment_number: data.apartmentNumber ?? null,
            type: data.type,
            lat: data.lat,
            lng: data.lng,
            is_default: data.isDefault,
        })
        .returning(ADDRESS_COLUMNS);
    return toEntity(row);
}

export async function clearDefaultAddresses(userId: number): Promise<void> {
    await db('customer_addresses')
        .where('user_id', userId)
        .update({ is_default: false });
}

export async function updateAddressById(id: number, data: Partial<Address>): Promise<Address | undefined> {
    const [row] = await db('customer_addresses')
        .where('id', id)
        .update({
            ...(data.label !== undefined && { label: data.label }),
            ...(data.country !== undefined && { country: data.country }),
            ...(data.city !== undefined && { city: data.city }),
            ...(data.street !== undefined && { street: data.street }),
            ...(data.building !== undefined && { building: data.building }),
            ...(data.apartmentNumber !== undefined && { apartment_number: data.apartmentNumber }),
            ...(data.type !== undefined && { type: data.type }),
            ...(data.lat !== undefined && { lat: data.lat }),
            ...(data.lng !== undefined && { lng: data.lng }),
            ...(data.isDefault !== undefined && { is_default: data.isDefault }),
        })
        .returning(ADDRESS_COLUMNS);
    return row ? toEntity(row) : undefined;
}

export async function deleteAddressById(id: number): Promise<void> {
    await db('customer_addresses').where('id', id).delete();
}
