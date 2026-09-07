import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';

const accountId = process.env.CLOUDFLARE_ACCOUNT_ID || '16e6214a95760067e9e4e448ce7048c4';
const bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME || 'stockhometh';
const endpoint = process.env.CLOUDFLARE_R2_ENDPOINT || `https://${accountId}.r2.cloudflarestorage.com`;
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
