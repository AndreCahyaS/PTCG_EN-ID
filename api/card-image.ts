import type { VercelRequest, VercelResponse } from '@vercel/node';
import { head, put } from '@vercel/blob';
import sharp from 'sharp';

/**
 * GET /api/card-image?src=<encoded_image_url>
 *
 * Universal card image proxy + Vercel Blob cache.
 * Works for ANY image source — TCGdex AND asia.pokemon-card.com.
 *
 * Flow:
 *   1. Derive a stable blob key from the source URL
 *   2. Check Vercel Blob — cache hit → 302 to Blob CDN (immutable)
 *   3. Cache miss  → fetch from source → compress with sharp → store → 302
 *
 * Each unique card image is fetched from its origin exactly once.
 */

const WEBP_QUALITY = 82;

/**
 * Derives a deterministic, filesystem-safe blob key from any image URL.
 *
 * Examples:
 *   https://asia.pokemon-card.com/id/card-img/id00013749.png
 *     → asia.pokemon-card.com/id/card-img/id00013749
 *
 *   https://assets.tcgdex.net/id/SV/SV5s/103/high.webp
 *     → assets.tcgdex.net/id/SV/SV5s/103
 */
function blobKeyFromUrl(url: string): string {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/[^a-zA-Z0-9.-]/g, '_');
    const path = parsed.pathname
      .replace(/\.(png|jpg|jpeg|webp|gif)$/i, '') // strip extension
      .replace(/\/high$/, '')                       // strip TCGdex trailing /high
      .replace(/[^a-zA-Z0-9/_-]/g, '_')            // sanitize remaining chars
      .replace(/^\/+/, '');                          // strip leading slashes
    return `${host}/${path}`;
  } catch {
    // Fallback for malformed URLs
    return url.replace(/[^a-zA-Z0-9/_-]/g, '_').substring(0, 200);
  }
}

async function compressToWebP(input: Buffer): Promise<{ buffer: Buffer; compressed: boolean }> {
  try {
    const buffer = await sharp(input)
      .webp({ quality: WEBP_QUALITY, effort: 4 })
      .toBuffer();
    return { buffer, compressed: true };
  } catch (err) {
    console.warn('[card-image] sharp compression failed, using original:', err);
    return { buffer: input, compressed: false };
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { src } = req.query;

  if (!src || typeof src !== 'string') {
    return res.status(400).json({
      error: 'Missing required ?src= parameter (full encoded image URL)',
    });
  }

  // Decode and validate the source URL
  let sourceUrl: string;
  try {
    sourceUrl = decodeURIComponent(src);
    new URL(sourceUrl); // throws if invalid
  } catch {
    return res.status(400).json({
      error: 'Invalid ?src= value — must be a valid, encoded URL',
    });
  }

  const blobKey  = blobKeyFromUrl(sourceUrl);
  const blobPath = `card-images/${blobKey}.webp`;

  try {
    // --- 1. Blob cache check ---
    const existing = await head(blobPath).catch(() => null);
    if (existing?.url) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      return res.redirect(302, existing.url);
    }

    // --- 2. Fetch from origin ---
    const upstream = await fetch(sourceUrl);
    if (!upstream.ok) {
      return res.status(404).json({
        error: `Source returned ${upstream.status}`,
        sourceUrl,
      });
    }

    const originalBuffer = Buffer.from(await upstream.arrayBuffer());

    // --- 3. Compress to WebP ---
    const { buffer: finalBuffer, compressed } = await compressToWebP(originalBuffer);

    const originalKB   = (originalBuffer.byteLength / 1024).toFixed(1);
    const compressedKB = (finalBuffer.byteLength    / 1024).toFixed(1);
    console.log(
      `[card-image] ${blobKey} | ${originalKB} KB → ${compressedKB} KB` +
      (compressed
        ? ` (saved ${((1 - finalBuffer.byteLength / originalBuffer.byteLength) * 100).toFixed(0)}%)`
        : ' (compression skipped)')
    );

    // --- 4. Store in Vercel Blob ---
    const blob = await put(blobPath, finalBuffer, {
      access: 'public',
      contentType: 'image/webp',
      addRandomSuffix: false, // deterministic path → head() works next time
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
