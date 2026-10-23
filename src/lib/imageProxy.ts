/**
 * Shared image proxy utility.
 *
 * Wraps ANY card image source URL through /api/card-image so it is
 * fetched once, compressed, and then served forever from Vercel Blob CDN.
 *
 * On localhost the original URL is returned directly (no proxy / no
 * BLOB_READ_WRITE_TOKEN required for local development).
 */

function isLocalDev(): boolean {
  return (
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1')
  );
}

/**
 * Returns a proxy URL for any card image source.
 * - Production : `/api/card-image?src=<encoded>`  → served from Vercel Blob
 * - Localhost  : original `sourceUrl` unchanged
 */
export function buildProxyImageUrl(sourceUrl: string): string {
  if (!sourceUrl) return sourceUrl;
  if (isLocalDev()) return sourceUrl;
  return `/api/card-image?src=${encodeURIComponent(sourceUrl)}`;
}
