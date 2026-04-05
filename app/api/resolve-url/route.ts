import { NextResponse } from "next/server";
import { resolveProductPage } from "@/lib/resolve-product-page";

/**
 * Best-effort product title/image extraction for retailer links.
 * Many retailer sites block bots; callers should allow manual image URL entry.
 */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { url?: string };
    const target = (body.url ?? "").trim();
    if (!target) {
      return NextResponse.json({ error: "url is required" }, { status: 400 });
    }

    const resolved = await resolveProductPage(target);

    if (!resolved.ok && resolved.status) {
      return NextResponse.json(
        {
          ok: false,
          title: null,
          imageUrl: null,
          status: resolved.status,
          hint: "Could not fetch page; paste an image URL or upload a photo.",
        },
        { status: 200 },
      );
    }

    if (!resolved.ok) {
      return NextResponse.json(
        {
          ok: false,
          title: null,
          imageUrl: null,
          error: resolved.error,
          hint: "Could not fetch page; paste an image URL or upload a photo.",
        },
        { status: 200 },
      );
    }

    return NextResponse.json({
      ok: true,
      title: resolved.title,
      imageUrl: resolved.imageUrl,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Resolve failed";
    return NextResponse.json(
      { ok: false, title: null, imageUrl: null, error: message },
      { status: 200 },
    );
  }
}
