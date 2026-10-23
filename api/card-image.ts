import type { VercelRequest, VercelResponse } from '@vercel/node';
import { head, put } from '@vercel/blob';
import sharp from 'sharp';

/**
 * GET /api/card-image?key=SV5s/103
 *
 * Checks Vercel Blob for a cached WebP copy of the TCGdex card image.
 * - Hit  → 302 redirect to the Blob CDN URL (immutable, served by Vercel CDN)
 * - Miss → fetch from TCGdex → compress with sharp → store in Blob → 302 redirect
 *
 * Compression goal: reduce ~1.7 MB originals to ~150-300 KB (WebP quality 82).
 * Each unique card is fetched from TCGdex exactly once, minimising their server load.
 */

/** Target WebP quality (0-100). 82 gives a good size/quality balance for card art. */
const WEBP_QUALITY = 82;

/**
 * Compress raw image bytes to WebP using sharp.
 * Returns the compressed buffer, or the original if compression fails.
 */
async function compressToWebP(input: Buffer): Promise<{ buffer: Buffer; compressed: boolean }> {
  try {
    const buffer = await sharp(input)
      .webp({ quality: WEBP_QUALITY, effort: 4 }) // effort 4 = good compression without being too slow
      .toBuffer();
    return { buffer, compressed: true };
  } catch (err) {
    console.warn('[card-image] sharp compression failed, using original:', err);
    return { buffer: input, compressed: false };
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { key } = req.query;

  if (!key || typeof key !== 'string' || !key.includes('/')) {
    return res.status(400).json({
      error: 'Missing or invalid ?key= parameter. Expected format: setId/localId',
    });
  }

  // Sanitize the key so it can safely be used as a blob pathname
  const safeKey = key.replace(/[^a-zA-Z0-9/_-]/g, '_');
  const blobPath = `card-images/${safeKey}.webp`;

  try {
    // --- 1. Check if the image already exists in Vercel Blob ---
    const existing = await head(blobPath).catch(() => null);
    if (existing?.url) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      return res.redirect(302, existing.url);
    }

    // --- 2. Cache miss – fetch from TCGdex ---
    const [setId, localId] = safeKey.split('/');
    const tcgdexUrl = `https://assets.tcgdex.net/id/SV/${setId}/${localId}/high.webp`;

    const upstream = await fetch(tcgdexUrl);

    if (!upstream.ok) {
      return res.status(404).json({
        error: `Image not found on TCGdex (${upstream.status})`,
        tcgdexUrl,
      });
    }

    const originalBuffer = Buffer.from(await upstream.arrayBuffer());

    // --- 3. Compress to WebP before storing ---
    const { buffer: finalBuffer, compressed } = await compressToWebP(originalBuffer);

    const originalKB  = (originalBuffer.byteLength  / 1024).toFixed(1);
    const compressedKB = (finalBuffer.byteLength / 1024).toFixed(1);
    console.log(
      `[card-image] ${safeKey} | original: ${originalKB} KB → stored: ${compressedKB} KB` +
      (compressed ? ` (saved ${((1 - finalBuffer.byteLength / originalBuffer.byteLength) * 100).toFixed(0)}%)` : ' (compression skipped)')
    );

    // --- 4. Store compressed image in Vercel Blob ---
    const blob = await put(blobPath, finalBuffer, {
      access: 'public',
      contentType: 'image/webp',
      addRandomSuffix: false, // deterministic path so head() can find it next time
    });

    // --- 5. Redirect to Blob CDN URL ---
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    return res.redirect(302, blob.url);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[card-image] Unexpected error:', message);
    return res.status(500).json({ error: 'Internal server error', detail: message });
  }
}

