import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { itemToDTO } from "@/lib/types";
import { saveUploadedImage } from "@/lib/upload";
import { assertCategory, parseListField } from "@/lib/validate-item";

type RouteCtx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: RouteCtx) {
  const { id } = await ctx.params;
  const item = await prisma.item.findUnique({ where: { id } });
  if (!item) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ item: itemToDTO(item) });
}

export async function PATCH(req: Request, ctx: RouteCtx) {
  try {
    const { id } = await ctx.params;
    const existing = await prisma.item.findUnique({ where: { id } });
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
      const productUrl = String(form.get("productUrl") ?? "").trim() || null;

      const externalImageUrl = String(form.get("imageUrl") ?? "").trim();
      const image = form.get("image");
      let imageUrl = existing.imageUrl;
      if (image instanceof File && image.size > 0) {
        imageUrl = await saveUploadedImage(image);
      } else if (externalImageUrl) {
        imageUrl = externalImageUrl;
      }

      const item = await prisma.item.update({
        where: { id },
        data: {
          name,
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
  const { id } = await ctx.params;
  try {
    await prisma.item.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
