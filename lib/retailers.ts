/** Retailers shown on Discover (“Shop more brands”). */

export type Retailer = {
  id: string;
  name: string;
  /** One line for the list UI */
  tagline: string;
  url: string;
};

export const RETAILERS: Retailer[] = [
  {
    id: "uniqlo",
    name: "UNIQLO",
    tagline:
      "Japanese basics and technical layers—Heattech, AIRism, and seasonal essentials.",
    url: "https://www.uniqlo.com/us/en/",
  },
  {
    id: "jcrew",
    name: "J.Crew",
    tagline: "American prep: Oxford shirts, chinos, and tailored casual staples.",
    url: "https://www.jcrew.com/",
  },
  {
    id: "banana-republic",
    name: "Banana Republic",
    tagline: "Work-ready separates and elevated casual from the Gap family.",
    url: "https://bananarepublic.gap.com/",
  },
  {
    id: "gap",
    name: "Gap",
    tagline: "Denim, tees, and khakis—classic American casual at approachable prices.",
    url: "https://www.gap.com/",
  },
  {
    id: "old-navy",
    name: "Old Navy",
    tagline: "Affordable everyday basics for the whole family.",
    url: "https://oldnavy.gap.com/",
  },
  {
    id: "cos",
    name: "COS",
    tagline: "Modern minimal silhouettes with a quiet, architectural edge.",
    url: "https://www.cos.com/en_usd/men",
  },
  {
    id: "everlane",
    name: "Everlane",
    tagline: "Radical transparency and modern essentials with a clean aesthetic.",
    url: "https://www.everlane.com/",
  },
  {
    id: "hm",
    name: "H&M",
    tagline: "Trend-led fast fashion with a huge range of seasonal drops.",
    url: "https://www2.hm.com/en_us/men.html",
  },
  {
    id: "muji",
    name: "MUJI",
    tagline: "No-logo Japanese housewares and wardrobe basics in natural fibers.",
    url: "https://www.muji.us/",
  },
  {
    id: "nordstrom",
    name: "Nordstrom",
    tagline: "Department-store edit of brands across price points and occasions.",
    url: "https://www.nordstrom.com/",
  },
  {
    id: "target",
    name: "Target",
    tagline: "Mass-market fashion, private labels, and everyday value.",
    url: "https://www.target.com/",
  },
  {
    id: "zara",
    name: "Zara",
    tagline: "European trend cycles with frequent new-in drops.",
    url: "https://www.zara.com/us/",
  },
];
