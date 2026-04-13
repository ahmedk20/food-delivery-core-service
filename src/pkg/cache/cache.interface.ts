export interface ICacheProvider {
    get(key: string): Promise<string | null>;
    set(key: string, any: string, ttl: number): Promise<void>;
    delete(key: string): Promise<void>;
}