This is a Next.js wardrobe app for saving clothing items, resolving retailer product thumbnails, and generating outfit suggestions.

## Getting Started

Set environment variables first:

```bash
cp .env.example .env
```

This app now expects a Postgres `DATABASE_URL`.

Then run the app:

```bash
npm install
npm run db:push
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Deploying On Vercel

Use Vercel with a managed Postgres database, not SQLite.

Recommended setup:

```bash
vercel
```

Set these env vars in Vercel:

```bash
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=...
NEXTAUTH_URL=https://your-project.vercel.app
OPENAI_API_KEY=...
OPENAI_MODEL=gpt-4o-mini
PLAYWRIGHT_PREVIEW_FALLBACK=0
```

For a simple demo deploy:

1. Create or attach a Postgres database in Vercel.
2. Set the environment variables above.
3. Run `npm run db:push` against that database once.
4. Deploy the app.

`PLAYWRIGHT_PREVIEW_FALLBACK` should stay `0` on Vercel for now. The fast server-fetch resolver still works, and the heavier browser fallback should be moved to a separate compatible worker/function setup later.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy is the [Vercel Platform](https://vercel.com/new).

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
