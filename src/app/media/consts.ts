// Whitelist of MIME types we sign upload urls for. The DTO validates the
// client-supplied contentType against this list, and the same value is baked
// into the presigned url so S3 rejects a mismatched upload.
export const ALLOWED_CONTENT_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
