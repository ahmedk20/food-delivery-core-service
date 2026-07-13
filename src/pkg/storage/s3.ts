import {S3Client, PutObjectCommand, DeleteObjectCommand} from "@aws-sdk/client-s3";
import {getSignedUrl} from "@aws-sdk/s3-request-presigner";
import {IStorageProvider, PresignedUpload} from "./storage.interface";

interface S3Config {
    region: string;
    bucket: string;
    accessKeyId: string;
    secretAccessKey: string;
    // CDN domain in front of the bucket (e.g. https://xxx.cloudfront.net).
    // When set, public urls are served through it; uploads still go straight to S3.
    cdnUrl?: string;
}

export class S3StorageProvider implements IStorageProvider {
    private client: S3Client;
    private bucket: string;
    private region: string;
    private cdnUrl?: string;

    constructor(config: S3Config) {
        this.client = new S3Client({
            region: config.region,
            credentials: {
                accessKeyId: config.accessKeyId,
                secretAccessKey: config.secretAccessKey,
            },
        });
        this.bucket = config.bucket;
        this.region = config.region;
        // Normalise: strip a trailing slash so getPublicUrl can always join with `/`.
        this.cdnUrl = config.cdnUrl?.replace(/\/$/, '') || undefined;
    }

    async getPresignedUploadUrl(key: string, contentType: string, expiresInSeconds = 300): Promise<PresignedUpload> {
        // The signed url encodes the bucket, key and content-type; S3 rejects the
        // PUT if the client uploads with a different content-type than signed here.
        const command = new PutObjectCommand({
            Bucket: this.bucket,
            Key: key,
            ContentType: contentType,
        });
        const uploadUrl = await getSignedUrl(this.client, command, {expiresIn: expiresInSeconds});
        return {uploadUrl, publicUrl: this.getPublicUrl(key), key};
    }

    getPublicUrl(key: string): string {
        if (this.cdnUrl) {
            return `${this.cdnUrl}/${key}`;
        }
        return `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`;
    }

    async deleteObject(key: string): Promise<void> {
        await this.client.send(new DeleteObjectCommand({Bucket: this.bucket, Key: key}));
    }
}
