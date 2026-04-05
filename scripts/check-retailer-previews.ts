/**
 * Run: npx tsx scripts/check-retailer-previews.ts
 * See which retailer product pages return a usable image/title to the resolver.
 */
import { resolveProductPage } from "../lib/resolve-product-page";
import { RETAILER_PREVIEW_TESTS } from "../lib/retailer-preview-tests";

function statusLabel(r: Awaited<ReturnType<typeof resolveProductPage>>): string {
  if (!r.ok) return "✗ fail";
  if (r.imageUrl && r.title) return "✓ good";
  if (r.imageUrl || r.title) return "△ partial";
  return "○ empty";
}

async function main() {
  console.log("Checking retailer product pages (resolver)…\n");

  for (const t of RETAILER_PREVIEW_TESTS) {
    const r = await resolveProductPage(t.productUrl);
    const img = r.imageUrl ? "yes" : "no";
    const title = r.title ? `yes (${r.title.slice(0, 48)}…)` : "no";
    const tag = statusLabel(r);
    console.log(
      `${tag.padEnd(12)} ${t.retailer.padEnd(18)} image:${img.padEnd(4)} title:${title}`,
    );
    if (!r.ok && r.error) console.log(`              └ ${r.error}`);
  }

  console.log(
    "\nTip: Sites that block server fetches may still work via the browser fallback when Playwright is enabled.",
  );
  console.log(
    "○ empty = page loaded but no usable product title/image was found.",
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
