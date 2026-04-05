import { renderProductPageInBrowser } from "@/lib/browser-render-product-page";
import {
  getPersistedPreviewCache,
  setPersistedPreviewCache,
} from "@/lib/persisted-preview-cache";
import { getCachedValue, setCachedValue } from "@/lib/preview-cache";
import { getRetailerPreviewStrategy } from "@/lib/retailer-preview-strategies";

/**
 * Fetch a product page and infer a product title/image from several page signals.
 * Retailers often block bots or hydrate data client-side; callers should handle nulls.
 */
export type ResolveProductPageResult = {
  ok: boolean;
  title: string | null;
  imageUrl: string | null;
  /** HTTP status when the fetch returned a non-OK response */
  status?: number;
  error?: string;
};

export async function resolveProductPage(
  targetUrl: string,
): Promise<ResolveProductPageResult> {
  const target = targetUrl.trim();
  if (!target) {
    return { ok: false, title: null, imageUrl: null, error: "Empty URL" };
  }

  let parsed: URL;
  try {
    parsed = new URL(target);
  } catch {
    return { ok: false, title: null, imageUrl: null, error: "Invalid URL" };
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    return { ok: false, title: null, imageUrl: null, error: "Only http(s)" };
  }

  const normalizedUrl = parsed.toString();
  const cacheKey = `product-preview:${normalizedUrl}`;
  const cached = getCachedValue<ResolveProductPageResult>(cacheKey);
  if (cached) return cached;

  const persisted = await getSafePersistedCache(normalizedUrl);
  if (persisted) {
    const result: ResolveProductPageResult = {
      ok: persisted.ok,
      title: persisted.title,
      imageUrl: persisted.imageUrl,
      status: persisted.status,
      error: persisted.error,
    };
    setCachedValue(cacheKey, result, Math.max(1_000, persisted.expiresAt.getTime() - Date.now()));
    return result;
  }

  const strategy = getRetailerPreviewStrategy(parsed.hostname);

  try {
    const res = await fetch(normalizedUrl, {
      redirect: "follow",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "en-US,en;q=0.9",
      },
      signal: AbortSignal.timeout(15_000),
    });

    if (!res.ok) {
      const result = {
        ok: false,
        title: null,
        imageUrl: null,
        status: res.status,
        error: `HTTP ${res.status}`,
      };
      if (shouldUseBrowserFallback(result, strategy)) {
        const fallback = await resolveViaBrowser(normalizedUrl, parsed, strategy);
        if (fallback) {
          await cacheResolvedResult(cacheKey, normalizedUrl, fallback);
          return fallback;
        }
      }
      await cacheResolvedResult(cacheKey, normalizedUrl, result);
      return result;
    }

    const html = await res.text();
    let result = resolveProductPageFromHtml(html, parsed);
    if (shouldUseBrowserFallback(result, strategy)) {
      const fallback = await resolveViaBrowser(normalizedUrl, parsed, strategy);
      if (fallback) result = fallback;
    }
    await cacheResolvedResult(cacheKey, normalizedUrl, result);
    return result;
  } catch (e) {
    const message = e instanceof Error ? e.message : "Resolve failed";
    const fallback = await resolveViaBrowser(normalizedUrl, parsed, strategy);
    if (fallback) {
      await cacheResolvedResult(cacheKey, normalizedUrl, fallback);
      return fallback;
    }
    const result = { ok: false, title: null, imageUrl: null, error: message };
    await cacheResolvedResult(cacheKey, normalizedUrl, result);
    return result;
  }
}

async function getSafePersistedCache(
  url: string,
) {
  try {
    return await getPersistedPreviewCache(url);
  } catch {
    return null;
  }
}

async function cacheResolvedResult(
  memoryCacheKey: string,
  url: string,
  result: ResolveProductPageResult,
): Promise<void> {
  const ttlMs = getCacheTtlMs(result);
  setCachedValue(memoryCacheKey, result, ttlMs);
  try {
    await setPersistedPreviewCache(url, result, ttlMs);
  } catch {
    /* Allow the resolver to work before the DB migration is applied. */
  }
}

function resolveProductPageFromHtml(
  html: string,
  base: URL,
  hintedImageUrls: string[] = [],
): ResolveProductPageResult {
  const title =
    matchMeta(html, "property", "og:title") ??
    matchMeta(html, "name", "twitter:title") ??
    matchItemPropValue(html, "name") ??
    matchHeading(html, "h1") ??
    matchTag(html, "title");

  const imageCandidates = collectImageCandidates(html, base, hintedImageUrls);
  const absoluteImage = chooseBestImage(imageCandidates);

  return {
    ok: true,
    title: title?.trim() || null,
    imageUrl: absoluteImage,
  };
}

async function resolveViaBrowser(
  targetUrl: string,
  base: URL,
  strategy: ReturnType<typeof getRetailerPreviewStrategy>,
): Promise<ResolveProductPageResult | null> {
  if (!shouldAttemptBrowserRender(strategy)) return null;
  try {
    const rendered = await renderProductPageInBrowser(targetUrl, strategy);
    if (!rendered) return null;
    const finalBase = safeUrl(rendered.finalUrl) ?? base;
    const result = resolveProductPageFromHtml(
      rendered.html,
      finalBase,
      rendered.hintedImageUrls,
    );
    return result.imageUrl || result.title ? result : null;
  } catch {
    return null;
  }
}

function shouldUseBrowserFallback(
  result: ResolveProductPageResult,
  strategy: ReturnType<typeof getRetailerPreviewStrategy>,
): boolean {
  if (!shouldAttemptBrowserRender(strategy)) return false;
  if (!result.ok) return Boolean(strategy?.blockedStatusFallback && result.status);
  return !result.imageUrl;
}

function shouldAttemptBrowserRender(
  strategy: ReturnType<typeof getRetailerPreviewStrategy>,
): boolean {
  const enabled = process.env.PLAYWRIGHT_PREVIEW_FALLBACK;
  if (enabled === "0" || enabled === "false") return false;
  if (enabled === "1" || enabled === "true") return true;
  return Boolean(strategy);
}

function getCacheTtlMs(result: ResolveProductPageResult): number {
  return result.imageUrl ? 1000 * 60 * 60 * 12 : 1000 * 60 * 10;
}

function safeUrl(value: string): URL | null {
  try {
    return new URL(value);
  } catch {
    return null;
  }
}

function matchMeta(
  html: string,
  attr: "property" | "name",
  value: string,
): string | null {
  const re = new RegExp(
    `<meta[^>]+${attr}=["']${escapeRe(value)}["'][^>]+content=["']([^"']+)["']`,
    "i",
  );
  const m = html.match(re);
  if (m?.[1]) return decodeHtmlEntities(m[1]);

  const re2 = new RegExp(
    `<meta[^>]+content=["']([^"']+)["'][^>]+${attr}=["']${escapeRe(value)}["']`,
    "i",
  );
  const m2 = html.match(re2);
  return m2?.[1] ? decodeHtmlEntities(m2[1]) : null;
}

function matchTag(html: string, tag: string): string | null {
  const re = new RegExp(`<${tag}[^>]*>([^<]*)</${tag}>`, "i");
  const m = html.match(re);
  return m?.[1] ? decodeHtmlEntities(m[1].trim()) : null;
}

function matchHeading(html: string, tag: "h1"): string | null {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i");
  const m = html.match(re);
  if (!m?.[1]) return null;
  return decodeHtmlEntities(stripHtml(m[1]).trim()) || null;
}

function matchItemPropValue(html: string, itemprop: string): string | null {
  const patterns = [
    new RegExp(
      `<meta[^>]+itemprop=["']${escapeRe(itemprop)}["'][^>]+content=["']([^"']+)["']`,
      "i",
    ),
    new RegExp(
      `<[^>]+itemprop=["']${escapeRe(itemprop)}["'][^>]+content=["']([^"']+)["']`,
      "i",
    ),
    new RegExp(
      `<[^>]+itemprop=["']${escapeRe(itemprop)}["'][^>]+(?:src|href)=["']([^"']+)["']`,
      "i",
    ),
  ];
  for (const re of patterns) {
    const m = html.match(re);
    if (m?.[1]) return decodeHtmlEntities(m[1].trim());
  }
  return null;
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function decodeHtmlEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}

function toAbsoluteUrl(base: URL, value: string): string {
  try {
    return new URL(value, base).toString();
  } catch {
    return value;
  }
}

/** Open Graph image is often a site-wide logo or placeholder — prefer JSON-LD Product image when this matches. */
function isGenericBrandOgImage(url: string): boolean {
  try {
    const u = new URL(url);
    const path = u.pathname.toLowerCase();
    const file = path.split("/").pop() ?? "";
    if (
      /jc-default|og-default|og_default|default-product|placeholder/i.test(file)
    ) {
      return true;
    }
    if (/^logo\.(png|jpg|jpeg|webp|svg)$/i.test(file)) return true;
    if (
      /\/logos?\/|brand-assets\/|social-share|site-default|favicon|sprite|icon/i.test(
        path,
      )
    ) {
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

type ImageCandidate = {
  url: string;
  score: number;
  source: string;
};

function collectImageCandidates(
  html: string,
  base: URL,
  hintedImageUrls: string[] = [],
): ImageCandidate[] {
  return dedupeCandidatesByUrl([
    ...hintedImageUrls.map((url) => ({
      url: toAbsoluteUrl(base, url),
      score: 98,
      source: "browser-hint",
    })),
    ...extractMetaImageCandidates(html, base),
    ...extractItemPropImageCandidates(html, base),
    ...extractProductImagesFromLdJson(html, base).map((url) => ({
      url,
      score: 88,
      source: "ld-json",
    })),
    ...extractImagesFromJsonScripts(html, base),
    ...extractPreloadImageCandidates(html, base),
    ...extractImgTagCandidates(html, base),
  ]);
}

function chooseBestImage(candidates: ImageCandidate[]): string | null {
  const sorted = [...candidates].sort((a, b) => b.score - a.score);
  const nonGeneric = sorted.find((candidate) => !isGenericBrandOgImage(candidate.url));
  if (nonGeneric) return nonGeneric.url;
  const fallback = sorted.find((candidate) => looksLikeImageUrl(candidate.url));
  return fallback?.url ?? null;
}

function extractMetaImageCandidates(html: string, base: URL): ImageCandidate[] {
  const values = [
    { raw: matchMeta(html, "property", "og:image:secure_url"), score: 96, source: "og:image:secure_url" },
    { raw: matchMeta(html, "property", "og:image"), score: 94, source: "og:image" },
    { raw: matchMeta(html, "name", "twitter:image"), score: 92, source: "twitter:image" },
    { raw: matchMeta(html, "name", "twitter:image:src"), score: 92, source: "twitter:image:src" },
  ];

  return values
    .map((candidate) => {
      if (!candidate.raw) return null;
      return {
        url: toAbsoluteUrl(base, candidate.raw),
        score: candidate.score,
        source: candidate.source,
      } satisfies ImageCandidate;
    })
    .filter((candidate): candidate is ImageCandidate => Boolean(candidate));
}

function extractItemPropImageCandidates(html: string, base: URL): ImageCandidate[] {
  const raw = matchItemPropValue(html, "image");
  if (!raw) return [];
  return [{ url: toAbsoluteUrl(base, raw), score: 90, source: "itemprop:image" }];
}

function extractProductImagesFromLdJson(html: string, base: URL): string[] {
  const raw: string[] = [];
  const re =
    /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    try {
      walkLdJsonForProductImages(JSON.parse(m[1].trim()), raw);
    } catch {
      /* skip invalid JSON */
    }
  }
  const absolute = raw
    .map((r) => {
      try {
        return new URL(r, base).toString();
      } catch {
        return null;
      }
    })
    .filter((x): x is string => Boolean(x));
  return [...new Set(absolute)];
}

function walkLdJsonForProductImages(node: unknown, out: string[]): void {
  if (node === null || node === undefined) return;
  if (Array.isArray(node)) {
    for (const x of node) walkLdJsonForProductImages(x, out);
    return;
  }
  if (typeof node !== "object") return;
  const o = node as Record<string, unknown>;
  const t = o["@type"];
  const types = Array.isArray(t) ? t : t != null ? [t] : [];
  const isProduct = types.some(
    (x) =>
      typeof x === "string" &&
      (x === "Product" ||
        x === "ProductModel" ||
        x === "IndividualProduct"),
  );
  if (isProduct && o.image != null) {
    addSchemaImageValue(o.image, out);
  }
  for (const v of Object.values(o)) {
    walkLdJsonForProductImages(v, out);
  }
}

function addSchemaImageValue(image: unknown, out: string[]): void {
  if (typeof image === "string") {
    if (looksLikeImageUrl(image)) {
      out.push(image.startsWith("//") ? `https:${image}` : image);
    }
    return;
  }
  if (Array.isArray(image)) {
    for (const x of image) addSchemaImageValue(x, out);
    return;
  }
  if (image && typeof image === "object") {
    const o = image as Record<string, unknown>;
    if (typeof o.url === "string") addSchemaImageValue(o.url, out);
    if (typeof o.contentUrl === "string") addSchemaImageValue(o.contentUrl, out);
  }
}

function extractImagesFromJsonScripts(html: string, base: URL): ImageCandidate[] {
  const results: ImageCandidate[] = [];
  const re = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const attrs = m[1] ?? "";
    const body = m[2]?.trim() ?? "";
    if (!body) continue;

    const context = `${attrs} ${body.slice(0, 400)}`.toLowerCase();
    if (!looksLikeProductScript(context)) continue;

    for (const url of extractImageLikeStrings(body, base)) {
      const score = scoreScriptImage(url, context);
      results.push({ url, score, source: "script-data" });
    }
  }
  return results;
}

function extractPreloadImageCandidates(html: string, base: URL): ImageCandidate[] {
  const results: ImageCandidate[] = [];
  const re = /<link\b([^>]+)>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const attrs = m[1] ?? "";
    if (!/as=["']image["']/i.test(attrs)) continue;
    const href = matchAttribute(attrs, "href");
    if (!href || !looksLikeImageUrl(href)) continue;
    let score = 72;
    if (/preload|preconnect/i.test(attrs)) score += 2;
    results.push({ url: toAbsoluteUrl(base, href), score, source: "preload-image" });
  }
  return results;
}

function extractImgTagCandidates(html: string, base: URL): ImageCandidate[] {
  const results: ImageCandidate[] = [];
  const re = /<img\b([^>]+)>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const attrs = m[1] ?? "";
    const raw =
      matchAttribute(attrs, "src") ??
      matchAttribute(attrs, "data-src") ??
      firstUrlFromSrcset(matchAttribute(attrs, "srcset")) ??
      firstUrlFromSrcset(matchAttribute(attrs, "data-srcset"));
    if (!raw || !looksLikeImageUrl(raw)) continue;

    const context = attrs.toLowerCase();
    let score = 48;
    if (/itemprop=["']image["']/i.test(attrs)) score += 30;
    if (/product|pdp|gallery|hero|primary|main|carousel|media/i.test(context)) score += 20;
    if (/alt=["'][^"']{8,}/i.test(attrs)) score += 8;
    if (/logo|icon|sprite|avatar|badge/i.test(context)) score -= 40;
    results.push({ url: toAbsoluteUrl(base, raw), score, source: "img-tag" });
  }
  return results;
}

function dedupeCandidatesByUrl(candidates: ImageCandidate[]): ImageCandidate[] {
  const byUrl = new Map<string, ImageCandidate>();
  for (const candidate of candidates) {
    if (!looksLikeImageUrl(candidate.url)) continue;
    const url = normalizeImageUrl(candidate.url);
    const existing = byUrl.get(url);
    if (!existing || candidate.score > existing.score) {
      byUrl.set(url, { ...candidate, url });
    }
  }
  return [...byUrl.values()];
}

function normalizeImageUrl(url: string): string {
  try {
    const parsed = new URL(url);
    parsed.hash = "";
    return parsed.toString();
  } catch {
    return url;
  }
}

function extractImageLikeStrings(text: string, base: URL): string[] {
  const urls: string[] = [];
  const re =
    /(["'`])((?:https?:)?\/\/[^"'`<>\s]+|\/[^"'`<>\s]+)\1/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const raw = m[2];
    if (!looksLikeImageUrl(raw)) continue;
    urls.push(toAbsoluteUrl(base, raw.startsWith("//") ? `https:${raw}` : raw));
  }
  return [...new Set(urls)];
}

function looksLikeProductScript(text: string): boolean {
  return /product|sku|variant|colorway|gallery|media|price|pdp|itemprop/.test(text);
}

function scoreScriptImage(url: string, context: string): number {
  let score = 76;
  if (/product|gallery|media|primary|hero|variant|featured/.test(context)) score += 8;
  if (/logo|icon|sprite|placeholder/.test(context)) score -= 28;
  if (/cdn|images|media|product/.test(url)) score += 4;
  return score;
}

function looksLikeImageUrl(value: string): boolean {
  const lowered = value.toLowerCase();
  if (lowered.startsWith("data:image/")) return true;
  if (
    /\.(avif|gif|heic|jpeg|jpg|png|webp)(?:[?#].*)?$/.test(lowered)
  ) {
    return true;
  }
  if (
    /[/?](images?|image|img|media|catalog|cdn-cgi\/image)\b/.test(
      lowered,
    )
  ) {
    return true;
  }
  if (/[?&](image|img|src)=/.test(lowered)) return true;
  return false;
}

function matchAttribute(attrs: string, name: string): string | null {
  const re = new RegExp(`${escapeRe(name)}=["']([^"']+)["']`, "i");
  const m = attrs.match(re);
  return m?.[1] ? decodeHtmlEntities(m[1]) : null;
}

function firstUrlFromSrcset(srcset: string | null): string | null {
  if (!srcset) return null;
  const first = srcset
    .split(",")
    .map((part) => part.trim().split(/\s+/)[0])
    .find(Boolean);
  return first ?? null;
}

function stripHtml(value: string): string {
  return value.replace(/<[^>]+>/g, " ");
}
