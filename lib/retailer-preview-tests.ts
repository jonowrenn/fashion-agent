/**
 * Sample product URLs for `npm run check:retailers` (server fetch → og:image / og:title).
 * Last full run: UNIQLO + J.Crew ✓ good; Gap / Old Navy / Banana Republic / COS △ partial;
 * Zara ○ empty; H&M 403; Target 404; Nordstrom weak. Update stale URLs when listings move.
 */
export type RetailerPreviewTest = {
  retailer: string;
  productUrl: string;
};

export const RETAILER_PREVIEW_TESTS: RetailerPreviewTest[] = [
  {
    retailer: "UNIQLO US",
    productUrl:
      "https://www.uniqlo.com/us/en/products/E467134-000/00?colorDisplayCode=00",
  },
  {
    retailer: "J.Crew",
    productUrl:
      "https://www.jcrew.com/p/mens/categories/clothing/shirts/broken-in-oxford/brokenin-organic-cotton-oxford-shirt/BE996?color_name=white&display=standard",
  },
  {
    retailer: "Gap",
    productUrl:
      "https://www.gap.com/browse/product.do?pid=670373002&cid=6998&pcid=6998&vid=1",
  },
  {
    retailer: "Old Navy",
    productUrl: "https://oldnavy.gap.com/browse/product.do?pid=449656022",
  },
  {
    retailer: "Banana Republic",
    productUrl: "https://bananarepublic.gap.com/browse/product.do?pid=793345002",
  },
  {
    retailer: "COS",
    productUrl:
      "https://www.cos.com/en_usd/men/tops/product.relaxed-fit-t-shirt-white.0971643001.html",
  },
  {
    retailer: "H&M US",
    productUrl:
      "https://www2.hm.com/en_us/productpage.1216875001.html",
  },
  {
    retailer: "Zara US",
    productUrl:
      "https://www.zara.com/us/en/basic-relaxed-fit-t-shirt-p04424300.html",
  },
  {
    retailer: "Target",
    productUrl:
      "https://www.target.com/p/men-s-short-sleeve-crewneck-t-shirt-goodfellow-co/-/A-54107645",
  },
  {
    retailer: "Nordstrom",
    productUrl:
      "https://www.nordstrom.com/s/bp-twist-front-t-shirt/7220526",
  },
];
