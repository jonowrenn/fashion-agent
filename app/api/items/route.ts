import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { itemToDTO } from "@/lib/types";
import { saveUploadedImage } from "@/lib/upload";
import { assertCategory, parseListField } from "@/lib/validate-item";

export async function GET() {
  const items = await prisma.item.findMany({ orderBy: { updatedAt: "desc" } });
  return NextResponse.json({ items: items.map(itemToDTO) });
}

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get("content-type") ?? "";
    if (!contentType.includes("multipart/form-data")) {
      return NextResponse.json(
        { error: "Expected multipart/form-data" },
        { status: 400 },
      );
    }

    const form = await req.formData();
    const name = String(form.get("name") ?? "").trim();
    const category = String(form.get("category") ?? "").trim();
    if (!name || !category) {
      return NextResponse.json(
        { error: "name and category are required" },
        { status: 400 },
      );
    }
    assertCategory(category);

    const colors = parseListField(String(form.get("colors") ?? ""));
    const seasons = parseListField(String(form.get("seasons") ?? ""));
    const tags = parseListField(String(form.get("tags") ?? ""));
    const formalityRaw = String(form.get("formality") ?? "").trim();
    const formality = formalityRaw || null;
    const notes = String(form.get("notes") ?? "").trim() || null;
    const productUrl = String(form.get("productUrl") ?? "").trim() || null;
    const externalImageUrl = String(form.get("imageUrl") ?? "").trim() || null;

    const image = form.get("image");
    let imageUrl: string | null = null;
    if (image instanceof File && image.size > 0) {
      imageUrl = await saveUploadedImage(image);
    } else if (externalImageUrl) {
      imageUrl = externalImageUrl;
    }

    const item = await prisma.item.create({
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

    return NextResponse.json({ item: itemToDTO(item) }, { status: 201 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to create item";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
