import {
  DEFAULT_IMAGE_SELECTORS,
  type RetailerPreviewStrategy,
} from "@/lib/retailer-preview-strategies";

type BrowserPageLike = {
  goto(url: string, options?: Record<string, unknown>): Promise<unknown>;
  waitForSelector(selector: string, options?: Record<string, unknown>): Promise<unknown>;
  waitForTimeout(timeout: number): Promise<void>;
  content(): Promise<string>;
  url(): string;
  $$eval?<T>(
    selector: string,
    pageFunction: (nodes: Element[]) => T,
  ): Promise<T>;
};

type BrowserContextLike = {
  newPage(): Promise<BrowserPageLike>;
  close(): Promise<void>;
};

type BrowserLike = {
  newContext(options?: Record<string, unknown>): Promise<BrowserContextLike>;
  close(): Promise<void>;
};

type PlaywrightModule = {
  chromium: {
    launch(options?: Record<string, unknown>): Promise<BrowserLike>;
  };
};

export type BrowserRenderResult = {
  html: string;
  finalUrl: string;
  hintedImageUrls: string[];
};

function getDynamicImporter(): (specifier: string) => Promise<unknown> {
  return new Function("specifier", "return import(specifier);") as (
    specifier: string,
  ) => Promise<unknown>;
}

async function loadPlaywright(): Promise<PlaywrightModule | null> {
  try {
    const importer = getDynamicImporter();
    return (await importer("playwright")) as PlaywrightModule;
  } catch {
    return null;
  }
}

export async function renderProductPageInBrowser(
  targetUrl: string,
  strategy: RetailerPreviewStrategy | null,
): Promise<BrowserRenderResult | null> {
  const playwright = await loadPlaywright();
  if (!playwright) return null;

  const browser = await playwright.chromium.launch({
    headless: true,
  });

  try {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 2200 },
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      locale: "en-US",
    });
    try {
      const page = await context.newPage();
      await page.goto(targetUrl, {
        waitUntil: "domcontentloaded",
        timeout: 20_000,
      });

      const selectors = strategy?.waitForSelectors ?? [];
      for (const selector of selectors) {
        try {
          await page.waitForSelector(selector, { timeout: 2_500 });
          break;
        } catch {
          /* try the next selector */
        }
      }

      await page.waitForTimeout(strategy?.renderDelayMs ?? 900);

      const hintedImageUrls = page.$$eval
        ? await collectImageHints(page, strategy?.imageSelectors ?? DEFAULT_IMAGE_SELECTORS)
        : [];

      return {
        html: await page.content(),
        finalUrl: page.url(),
        hintedImageUrls,
      };
    } finally {
      await context.close();
    }
  } finally {
    await browser.close();
  }
}

async function collectImageHints(
  page: BrowserPageLike,
  selectors: string[],
): Promise<string[]> {
  if (!page.$$eval) return [];

  const evaluate = page.$$eval.bind(page);
  const seen = new Set<string>();
  for (const selector of selectors) {
    try {
      const urls = await evaluate(selector, (nodes) =>
        nodes
          .map((node) => {
            if (!(node instanceof HTMLImageElement)) return null;
            return (
              node.currentSrc ||
              node.src ||
              node.getAttribute("data-src") ||
              node.getAttribute("srcset")?.split(",")[0]?.trim().split(/\s+/)[0] ||
              null
            );
          })
          .filter((value): value is string => Boolean(value)),
      );
      for (const url of urls) {
        seen.add(url);
      }
      if (seen.size > 0) break;
    } catch {
      /* selector may be invalid for the current page */
    }
  }
  return [...seen];
}
