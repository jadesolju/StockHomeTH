/**
 * Cloudflare R2 Storage Client Configuration & Utilities
 * Bucket: stockhometh
 * Endpoint: https://16e6214a95760067e9e4e448ce7048c4.r2.cloudflarestorage.com/stockhometh
 */

export interface R2Config {
  accountId: string;
  bucketName: string;
  endpoint: string;
  publicDomain?: string;
}

export const r2Config: R2Config = {
  accountId: process.env.CLOUDFLARE_ACCOUNT_ID || '16e6214a95760067e9e4e448ce7048c4',
  bucketName: process.env.CLOUDFLARE_R2_BUCKET_NAME || 'stockhometh',
  endpoint: process.env.CLOUDFLARE_R2_ENDPOINT || 'https://16e6214a95760067e9e4e448ce7048c4.r2.cloudflarestorage.com',
  publicDomain: process.env.NEXT_PUBLIC_R2_PUBLIC_DOMAIN,
};

/**
 * Returns the public URL for an asset stored in Cloudflare R2
 */
export function getR2PublicUrl(key: string): string {
  const cleanKey = key.startsWith('/') ? key.slice(1) : key;
  if (r2Config.publicDomain) {
    return `${r2Config.publicDomain.replace(/\/$/, '')}/${cleanKey}`;
  }
  return `${r2Config.endpoint}/${r2Config.bucketName}/${cleanKey}`;
}
