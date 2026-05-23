# v0-ai-study-app

AI study app built with Next.js App Router.

## Local Development

1. Install dependencies:

```bash
pnpm install
```

2. Create a local env file:

```bash
cp .env.example .env.local
```

3. Add your Gemini key to `.env.local`:

```bash
GEMINI_API_KEY=your_key_here
```

4. Start the app:

```bash
pnpm dev
```

5. Open [http://localhost:3000](http://localhost:3000).

## Checks

Run these before deploying:

```bash
pnpm lint
pnpm build
```

## Deploy To Vercel

1. Push this repository to GitHub, GitLab, or Bitbucket.
2. In Vercel, click **Add New** -> **Project**.
3. Import the repository.
4. Confirm the framework is detected as **Next.js**.
5. Set the environment variable in Vercel:

```bash
GEMINI_API_KEY=your_key_here
```

6. Keep the default Next.js settings, or verify:
   - Install Command: `pnpm install --frozen-lockfile`
   - Build Command: `pnpm build`
   - Output Directory: `.next`
   - A `vercel.json` file is included for consistent function settings.
7. Deploy the project.
8. After deployment, test:
   - `/`
   - `/api/tutor`
   - `/api/generate-cards`
   - `/api/parse-document`

## Production Notes

- `GEMINI_API_KEY` is required for the AI routes.
- The document parser now enforces a `10 MB` upload limit to stay within common Vercel serverless request limits.
- Current rate limiting is in-memory, which is acceptable for simple protection but not fully reliable across multiple serverless instances. For stronger production protection, move rate limiting to a shared store like Redis or Upstash.
- The API routes explicitly run on the Node.js runtime for compatibility with file parsing libraries.

## Tech Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- Gemini API
