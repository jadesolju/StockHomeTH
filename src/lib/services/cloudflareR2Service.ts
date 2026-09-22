import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  HeadBucketCommand,
} from '@aws-sdk/client-s3';

const accountId = process.env.CLOUDFLARE_ACCOUNT_ID || '16e6214a95760067e9e4e448ce7048c4';
const bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME || 'stockhometh';
const endpoint = process.env.CLOUDFLARE_R2_ENDPOINT || (accountId ? `https://${accountId}.r2.cloudflarestorage.com` : 'https://16e6214a95760067e9e4e448ce7048c4.r2.cloudflarestorage.com');
const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID || '6b30f689e7171c85e3a7c6d935690345';
const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY || 'a5d647fb464de7432b926a050fec44aeb24a128355bc7f28d5311fefb89b9ac1';
const publicDomain = process.env.NEXT_PUBLIC_R2_PUBLIC_DOMAIN || '/api/upload/r2?key=';

export function getR2Client(): S3Client | null {
  if (!accessKeyId || !secretAccessKey) {
    console.warn('[R2 Service] Access key or secret is missing.');
    return null;
  }
  return new S3Client({
    region: 'auto',
    endpoint,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
}

export function getR2BucketName(): string {
  return bucketName;
}

/**
 * Upload raw binary/image to Cloudflare R2
 */
export async function uploadToR2(
  fileBuffer: Buffer,
  fileName: string,
  contentType: string
): Promise<{ url: string; key: string } | null> {
  const client = getR2Client();
  const safeName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  const key = `avatars/${Date.now()}-${safeName}`;

  if (client) {
    try {
      const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: fileBuffer,
        ContentType: contentType,
      });
      await client.send(command);

      const url = publicDomain.startsWith('/')
        ? `${publicDomain}${encodeURIComponent(key)}`
        : `${publicDomain.replace(/\/$/, '')}/${key}`;

      return { url, key };
    } catch (err) {
      console.error('[R2 Service] PutObject error:', err);
    }
  }

  // Fallback data URI if direct connection has issues
  const base64 = fileBuffer.toString('base64');
  const dataUrl = `data:${contentType};base64,${base64}`;
  return { url: dataUrl, key };
}

/**
 * Get raw object from Cloudflare R2
 */
export async function getObjectFromR2(key: string): Promise<{ buffer: Buffer; contentType: string } | null> {
  const client = getR2Client();
  if (!client) return null;

  try {
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
    });
    const response = await client.send(command);
    if (!response.Body) return null;

    const byteArray = await response.Body.transformToByteArray();
    const buffer = Buffer.from(byteArray);
    const contentType = response.ContentType || 'image/png';

    return { buffer, contentType };
  } catch (err) {
    console.error('[R2 Service] GetObject error:', err);
    return null;
  }
}

/**
 * Store structured JSON data into Cloudflare R2 (Zero Egress storage)
 */
export async function putJsonToR2<T>(
  key: string,
  data: T,
  options?: { maxAge?: number }
): Promise<{ success: boolean; key: string; url: string; sizeBytes: number } | null> {
  const client = getR2Client();
  if (!client) {
    console.warn('[R2 Service] Cannot put JSON: S3Client not initialized');
    return null;
  }

  try {
    const jsonString = JSON.stringify(data, null, 2);
    const buffer = Buffer.from(jsonString, 'utf-8');
    const maxAge = options?.maxAge ?? 300; // default 5 minutes cache

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: buffer,
      ContentType: 'application/json; charset=utf-8',
      CacheControl: `public, max-age=${maxAge}, s-maxage=${maxAge}, stale-while-revalidate=60`,
    });

    await client.send(command);

    const url = publicDomain.startsWith('/')
      ? `${publicDomain}${encodeURIComponent(key)}`
      : `${publicDomain.replace(/\/$/, '')}/${key}`;

    return {
      success: true,
      key,
      url,
      sizeBytes: buffer.length,
    };
  } catch (err) {
    console.error(`[R2 Service] Error writing JSON to key "${key}":`, err);
    return null;
  }
}

/**
 * Retrieve and parse JSON data from Cloudflare R2
 */
export async function getJsonFromR2<T>(key: string): Promise<T | null> {
  const client = getR2Client();
  if (!client) return null;

  try {
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
    });
    const response = await client.send(command);
    if (!response.Body) return null;

    const text = await response.Body.transformToString('utf-8');
    return JSON.parse(text) as T;
  } catch (err: any) {
    // If not found or NoSuchKey, return null quietly
    if (err?.name === 'NoSuchKey' || err?.$metadata?.httpStatusCode === 404) {
      return null;
    }
    console.warn(`[R2 Service] Error reading JSON from key "${key}":`, err.message || err);
    return null;
  }
}

/**
 * Delete an object from Cloudflare R2
 */
export async function deleteObjectFromR2(key: string): Promise<boolean> {
  const client = getR2Client();
  if (!client) return false;

  try {
    const command = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: key,
    });
    await client.send(command);
    return true;
  } catch (err) {
    console.error(`[R2 Service] Error deleting object "${key}":`, err);
    return false;
  }
}

export interface R2ObjectInfo {
  key: string;
  size: number;
  lastModified?: Date;
  etag?: string;
}

/**
 * List objects in Cloudflare R2 matching optional prefix
 */
export async function listObjectsFromR2(prefix?: string): Promise<R2ObjectInfo[]> {
  const client = getR2Client();
  if (!client) return [];

  try {
    const command = new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: prefix || '',
      MaxKeys: 100,
    });
    const response = await client.send(command);

    if (!response.Contents) return [];

    return response.Contents.map((item) => ({
      key: item.Key || '',
      size: item.Size || 0,
      lastModified: item.LastModified,
      etag: item.ETag,
    }));
  } catch (err) {
    console.error(`[R2 Service] Error listing objects with prefix "${prefix}":`, err);
    return [];
  }
}

/**
 * Health check & latency test for Cloudflare R2
 */
export async function checkR2Health(): Promise<{
  connected: boolean;
  bucket: string;
  endpoint: string;
  latencyMs: number;
  error?: string;
}> {
  const tStart = Date.now();
  const client = getR2Client();

  if (!client) {
    return {
      connected: false,
      bucket: bucketName,
      endpoint,
      latencyMs: 0,
      error: 'R2 credentials not configured in environment',
    };
  }

  try {
    const command = new HeadBucketCommand({
      Bucket: bucketName,
    });
    await client.send(command);
    const latencyMs = Date.now() - tStart;

    return {
      connected: true,
      bucket: bucketName,
      endpoint,
      latencyMs,
    };
  } catch (err: any) {
    const latencyMs = Date.now() - tStart;
    return {
      connected: false,
      bucket: bucketName,
      endpoint,
      latencyMs,
      error: err?.message || 'HeadBucket check failed',
    };
  }
}
