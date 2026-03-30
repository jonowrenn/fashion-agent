import { NextResponse } from "next/server";

/**
 * Best-effort Open Graph / page title extraction for product links.
 * Many retailer sites block bots; callers should allow manual image URL entry.
 */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { url?: string };
    const target = (body.url ?? "").trim();
    if (!target) {
      return NextResponse.json({ error: "url is required" }, { status: 400 });
    }

    let parsed: URL;
    try {
      parsed = new URL(target);
    } catch {
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
    }

    if (!["http:", "https:"].includes(parsed.protocol)) {
      return NextResponse.json({ error: "Only http(s) URLs" }, { status: 400 });
    }

    const res = await fetch(parsed.toString(), {
      redirect: "follow",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; FashionAgent/1.0; +https://example.local)",
        Accept: "text/html,application/xhtml+xml",
      },
      signal: AbortSignal.timeout(12_000),
    });

    if (!res.ok) {
      return NextResponse.json(
        {
          ok: false,
          title: null,
          imageUrl: null,
          status: res.status,
          hint: "Could not fetch page; paste an image URL or upload a photo.",
        },
        { status: 200 },
      );
    }

    const html = await res.text();
    const title =
      matchMeta(html, "property", "og:title") ??
      matchMeta(html, "name", "twitter:title") ??
      matchTag(html, "title");

    const imageUrl =
      matchMeta(html, "property", "og:image") ??
      matchMeta(html, "name", "twitter:image") ??
      null;

    const absoluteImage = imageUrl ? toAbsoluteUrl(parsed, imageUrl) : null;

    return NextResponse.json({
      ok: true,
      title: title?.trim() || null,
      imageUrl: absoluteImage,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Resolve failed";
    return NextResponse.json(
      { ok: false, title: null, imageUrl: null, error: message },
      { status: 200 },
    );
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
