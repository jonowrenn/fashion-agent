import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOpenAI, getOpenAIModel } from "@/lib/openai";

const responseSchema = {
  name: "wardrobe_advice",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    required: ["outfit_suggestions", "wardrobe_gaps", "notes"],
    properties: {
      outfit_suggestions: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["title", "item_ids", "rationale"],
          properties: {
            title: { type: "string" },
            item_ids: {
              type: "array",
              items: { type: "string" },
            },
            rationale: { type: "string" },
          },
        },
      },
      wardrobe_gaps: {
        type: "array",
        items: { type: "string" },
      },
      notes: { type: "string" },
    },
  },
} as const;

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      occasion?: string;
      weather?: string;
      extra?: string;
    };

    const occasion = (body.occasion ?? "").trim();
    if (!occasion) {
      return NextResponse.json(
        { error: "occasion is required (e.g. dinner, work, travel)" },
        { status: 400 },
      );
    }

    const items = await prisma.item.findMany({ orderBy: { name: "asc" } });
    if (items.length === 0) {
      return NextResponse.json(
        {
          error: "Add at least one item to your wardrobe first.",
        },
        { status: 400 },
      );
    }

    const wardrobe = items.map((i) => ({
      id: i.id,
      name: i.name,
      category: i.category,
      colors: i.colors,
      seasons: i.seasons,
      formality: i.formality,
      notes: i.notes,
      tags: i.tags,
      productUrl: i.productUrl,
      hasImage: Boolean(i.imageUrl),
    }));

    const openai = getOpenAI();
    const model = getOpenAIModel();

    const completion = await openai.chat.completions.create({
      model,
      messages: [
        {
          role: "system",
          content: `You are an expert personal stylist. The user has a clothing inventory identified by stable IDs.
Rules:
- Only reference item IDs from the provided wardrobe JSON. Never invent IDs.
- Suggest 2–4 distinct outfits when possible; fewer if the wardrobe is tiny.
- wardrobe_gaps should name missing categories or versatile pieces (specific but concise).
- Be practical about weather when provided.`,
        },
        {
          role: "user",
          content: JSON.stringify(
            {
              occasion,
              weather: body.weather?.trim() || null,
              extraNotes: body.extra?.trim() || null,
              wardrobe,
            },
            null,
            2,
          ),
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: responseSchema,
      },
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) {
      return NextResponse.json(
        { error: "No response from model" },
        { status: 502 },
      );
    }

    const parsed = JSON.parse(raw) as {
      outfit_suggestions: {
        title: string;
        item_ids: string[];
        rationale: string;
      }[];
      wardrobe_gaps: string[];
      notes: string;
    };

    const validIds = new Set(items.map((i) => i.id));
    for (const outfit of parsed.outfit_suggestions) {
      for (const id of outfit.item_ids) {
        if (!validIds.has(id)) {
          return NextResponse.json(
            { error: `Model returned unknown item id: ${id}` },
            { status: 502 },
          );
        }
      }
    }

    const itemsById = Object.fromEntries(items.map((i) => [i.id, i]));

    const outfitsWithItems = parsed.outfit_suggestions.map((o) => ({
      title: o.title,
      rationale: o.rationale,
      item_ids: o.item_ids,
      items: o.item_ids.map((id) => itemsById[id]),
    }));

    return NextResponse.json({
      wardrobe_gaps: parsed.wardrobe_gaps,
      notes: parsed.notes,
      outfits: outfitsWithItems,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Suggestion failed";
    const status = message.includes("OPENAI_API_KEY") ? 503 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
