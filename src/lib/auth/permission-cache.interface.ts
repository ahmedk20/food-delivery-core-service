export interface IPermissionCacheService {
    getPermissions(roleName: string): Promise<string[]>;
    hasPermission(permissions: string[], resource: string, action: string): boolean;
}
