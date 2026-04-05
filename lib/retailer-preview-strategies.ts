export type RetailerPreviewStrategy = {
  id: string;
  domains: string[];
  renderDelayMs?: number;
  waitForSelectors?: string[];
  imageSelectors?: string[];
  blockedStatusFallback?: boolean;
};

export const DEFAULT_IMAGE_SELECTORS = [
  "[itemprop='image']",
  "img[data-testid*='product']",
  "img[alt*='product' i]",
  "img[src*='images' i]",
  "img[src*='media' i]",
  "picture img",
  "img",
];

export const RETAILER_PREVIEW_STRATEGIES: RetailerPreviewStrategy[] = [
  {
    id: "gap-family",
    domains: ["gap.com", "oldnavy.gap.com", "bananarepublic.gap.com"],
    waitForSelectors: ["[data-testid='buy-box']", "img[src*='prod' i]", "main"],
    imageSelectors: ["img[src*='prod' i]", "picture img", "img"],
    renderDelayMs: 1200,
    blockedStatusFallback: true,
  },
  {
    id: "hm",
    domains: ["hm.com", "www2.hm.com"],
    waitForSelectors: ["[data-testid='pdp-main']", "img[src*='hm' i]", "main"],
    imageSelectors: ["img[src*='hm' i]", "picture img", "img"],
    renderDelayMs: 1800,
    blockedStatusFallback: true,
  },
  {
    id: "zara",
    domains: ["zara.com"],
    waitForSelectors: ["img[srcset]", "main"],
    imageSelectors: ["img[srcset]", "picture img", "img"],
    renderDelayMs: 1800,
    blockedStatusFallback: true,
  },
  {
    id: "target",
    domains: ["target.com"],
    waitForSelectors: ["[data-test='product-details']", "img[src*='targetimg' i]", "main"],
    imageSelectors: ["img[src*='targetimg' i]", "picture img", "img"],
    renderDelayMs: 1500,
    blockedStatusFallback: true,
  },
  {
    id: "nordstrom",
    domains: ["nordstrom.com"],
    waitForSelectors: ["img[src*='nordstrommedia' i]", "main"],
    imageSelectors: ["img[src*='nordstrommedia' i]", "picture img", "img"],
    renderDelayMs: 1200,
    blockedStatusFallback: true,
  },
  {
    id: "cos",
    domains: ["cos.com"],
    waitForSelectors: ["img[srcset]", "main"],
    imageSelectors: ["img[srcset]", "picture img", "img"],
    renderDelayMs: 1200,
    blockedStatusFallback: true,
  },
];

export function getRetailerPreviewStrategy(
  hostname: string,
): RetailerPreviewStrategy | null {
  const lowered = hostname.toLowerCase();
  return (
    RETAILER_PREVIEW_STRATEGIES.find((strategy) =>
      strategy.domains.some(
        (domain) => lowered === domain || lowered.endsWith(`.${domain}`),
      ),
    ) ?? null
  );
}
