/**
 * Cloudflare D1 Database REST Client
 * Database ID: 808ac1fc-9a58-46c4-8fd1-2bc2b6c85896
 */

interface D1QueryResult<T = unknown> {
  results: T[];
  success: boolean;
  meta: {
    duration: number;
    rows_read: number;
    rows_written: number;
  };
}

export async function executeD1Query<T = unknown>(
  sql: string,
  params: (string | number | boolean | null)[] = []
): Promise<D1QueryResult<T> | null> {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID || '16e6214a95760067e9e4e448ce7048c4';
  const databaseId = process.env.CLOUDFLARE_D1_DATABASE_ID || '808ac1fc-9a58-46c4-8fd1-2bc2b6c85896';
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;

  if (!apiToken) {
    console.warn('[Cloudflare D1] CLOUDFLARE_API_TOKEN is not set. D1 queries will not execute.');
    return null;
  }

  try {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${databaseId}/query`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sql,
          params,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Cloudflare D1] Query error:', response.status, errorText);
      return null;
    }

    const data = await response.json();
    if (data.success && data.result && data.result.length > 0) {
      return data.result[0] as D1QueryResult<T>;
    }
    return null;
  } catch (error) {
    console.error('[Cloudflare D1] Fetch error:', error);
    return null;
  }
}
