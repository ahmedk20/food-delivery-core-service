import {S3StorageProvider} from "../../pkg/storage/s3";
import {env} from "../config/env";

// Single shared storage provider instance, wired from validated env config.
// Registered into the DI container as TOKENS.StorageProvider (see di/container.ts).
export const storageProvider = new S3StorageProvider({
    region: env.aws.region,
    bucket: env.aws.s3Bucket,
    accessKeyId: env.aws.accessKeyId,
    secretAccessKey: env.aws.secretAccessKey,
    cdnUrl: env.aws.cdnUrl,
});
