export enum MediaStatus {
    // Row created + presigned url issued, but the client hasn't confirmed the
    // upload yet. A future sweep can delete PENDING rows older than N minutes.
    PENDING = 'pending',
    // Client confirmed the PUT to S3 succeeded — the url is safe to reference.
    UPLOADED = 'uploaded',
}
