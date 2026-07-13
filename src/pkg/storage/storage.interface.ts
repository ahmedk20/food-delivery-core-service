// Provider-agnostic contract for object storage. The app depends only on this
// interface (via DI) so the concrete backend (S3 today, GCS/MinIO tomorrow)
// can be swapped without touching any business code.
export interface PresignedUpload {
    uploadUrl: string;  // presigned PUT url the client uploads the raw file bytes to
    publicUrl: string;  // final url the object is served from once uploaded
    key: string;        // object key (path) inside the bucket
}

export interface IStorageProvider {
    // Returns a short-lived signed url the client PUTs the file to directly.
    getPresignedUploadUrl(key: string, contentType: string, expiresInSeconds?: number): Promise<PresignedUpload>;
    // Builds the permanent, servable url for an already-uploaded object.
    getPublicUrl(key: string): string;
    deleteObject(key: string): Promise<void>;
}
