import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { itemToDTO } from "@/lib/types";
import { requireUserId } from "@/lib/require-user";
import { saveUploadedImage } from "@/lib/upload";
import { resolveProductPage } from "@/lib/resolve-product-page";
import { assertCategory, parseListField } from "@/lib/validate-item";

type RouteCtx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: RouteCtx) {
  const auth = await requireUserId();
  if ("response" in auth) return auth.response;

  const { id } = await ctx.params;
  const item = await prisma.item.findFirst({
    where: { id, userId: auth.userId },
  });
  if (!item) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ item: itemToDTO(item) });
}

export async function PATCH(req: Request, ctx: RouteCtx) {
  const auth = await requireUserId();
  if ("response" in auth) return auth.response;

  try {
    const { id } = await ctx.params;
    const existing = await prisma.item.findFirst({
      where: { id, userId: auth.userId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const contentType = req.headers.get("content-type") ?? "";

    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      const name = String(form.get("name") ?? "").trim() || existing.name;
      const category = String(form.get("category") ?? "").trim() || existing.category;
      assertCategory(category);

      const colors = parseListField(String(form.get("colors") ?? ""));
      const seasons = parseListField(String(form.get("seasons") ?? ""));
      const tags = parseListField(String(form.get("tags") ?? ""));
      const formalityRaw = String(form.get("formality") ?? "").trim();
      const formality = formalityRaw || null;
      const notes = String(form.get("notes") ?? "").trim() || null;
      const brand = String(form.get("brand") ?? "").trim() || null;
      const productUrl = String(form.get("productUrl") ?? "").trim() || null;

      const externalImageUrl = String(form.get("imageUrl") ?? "").trim();
      const image = form.get("image");
      let imageUrl = existing.imageUrl;
      if (image instanceof File && image.size > 0) {
        imageUrl = await saveUploadedImage(image);
      } else if (externalImageUrl) {
        imageUrl = externalImageUrl;
      } else if (
        productUrl &&
        (!existing.imageUrl || productUrl !== (existing.productUrl ?? ""))
      ) {
        const resolved = await resolveProductPage(productUrl);
        imageUrl = resolved.imageUrl ?? existing.imageUrl;
      }

      const item = await prisma.item.update({
        where: { id },
        data: {
          name,
          brand,
          category,
          colors,
          seasons,
          formality,
          notes,
          productUrl,
          imageUrl,
          tags,
        },
      });
      return NextResponse.json({ item: itemToDTO(item) });
    }

    const body = (await req.json()) as Partial<{
      name: string;
      brand: string | null;
      category: string;
      colors: string;
      seasons: string;
      formality: string | null;
      notes: string | null;
      productUrl: string | null;
      imageUrl: string | null;
      tags: string;
    }>;

    if (body.category !== undefined) {
      assertCategory(body.category);
    }

    const item = await prisma.item.update({
      where: { id },
      data: {
        ...(body.name !== undefined ? { name: body.name.trim() } : {}),
        ...(body.brand !== undefined ? { brand: body.brand } : {}),
        ...(body.category !== undefined ? { category: body.category } : {}),
        ...(body.colors !== undefined ? { colors: body.colors } : {}),
        ...(body.seasons !== undefined ? { seasons: body.seasons } : {}),
        ...(body.formality !== undefined ? { formality: body.formality } : {}),
        ...(body.notes !== undefined ? { notes: body.notes } : {}),
        ...(body.productUrl !== undefined ? { productUrl: body.productUrl } : {}),
        ...(body.imageUrl !== undefined ? { imageUrl: body.imageUrl } : {}),
        ...(body.tags !== undefined ? { tags: body.tags } : {}),
      },
    });
    return NextResponse.json({ item: itemToDTO(item) });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to update item";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(_req: Request, ctx: RouteCtx) {
  const auth = await requireUserId();
  if ("response" in auth) return auth.response;

  const { id } = await ctx.params;
  try {
    const result = await prisma.item.deleteMany({
      where: { id, userId: auth.userId },
    });
    if (result.count === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
