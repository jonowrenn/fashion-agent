import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/require-user";
import { resolveProductPage } from "@/lib/resolve-product-page";
import { getStarterById, starterFallbackName } from "@/lib/starter-catalog";
import { itemToDTO } from "@/lib/types";
import { assertCategory } from "@/lib/validate-item";

export async function POST(req: Request) {
  const auth = await requireUserId();
  if ("response" in auth) return auth.response;

  try {
    const body = (await req.json()) as { starterId?: string };
    const starterId = (body.starterId ?? "").trim();
    if (!starterId) {
      return NextResponse.json({ error: "starterId is required" }, { status: 400 });
    }

    const starter = getStarterById(starterId);
    if (!starter) {
      return NextResponse.json({ error: "Unknown starter item" }, { status: 404 });
    }

    assertCategory(starter.category);

    const resolved = await resolveProductPage(starter.productUrl);

    const name =
      resolved.title && resolved.title.length > 0
        ? resolved.title
        : starterFallbackName(starter);

    const imageUrl = resolved.imageUrl;

    let notes = starter.notes ?? "";
    if (!resolved.ok) {
      const hint =
        "Product page could not be loaded automatically; name and image may be incomplete—open the retailer link to confirm.";
      notes = notes ? `${notes}\n\n${hint}` : hint;
    } else if (!imageUrl) {
      const hint =
        "No product image was returned by the retailer page; open the link or upload your own photo.";
      notes = notes ? `${notes}\n\n${hint}` : hint;
    }

    const item = await prisma.item.create({
      data: {
        userId: auth.userId,
        name,
        brand: starter.brand,
        category: starter.category,
        colors: starter.colors,
        seasons: starter.seasons,
        formality: starter.formality,
        notes: notes || null,
        productUrl: starter.productUrl,
        imageUrl,
        tags: starter.tags,
      },
    });

    return NextResponse.json({ item: itemToDTO(item) }, { status: 201 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Could not add item";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
