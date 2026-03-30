import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const ALLOWED_EXT = new Set([".jpg", ".jpeg", ".png", ".gif", ".webp", ".avif"]);

export async function saveUploadedImage(file: File): Promise<string> {
  const original = file.name ? path.extname(file.name).toLowerCase() : "";
  const ext = ALLOWED_EXT.has(original) ? original : ".jpg";
  const name = `${randomUUID()}${ext}`;
  const dir = path.join(process.cwd(), "public", "uploads");
  await mkdir(dir, { recursive: true });
  const full = path.join(dir, name);
  const buf = Buffer.from(await file.arrayBuffer());
  await writeFile(full, buf);
  return `/uploads/${name}`;
}
