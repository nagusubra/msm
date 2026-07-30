# MSM

A minimal Next.js + React starter with TypeScript and Tailwind CSS — structured so you can start building features immediately.

## Stack

- **Next.js 16** (App Router)
- **React 19**
- **TypeScript**
- **Tailwind CSS 4**

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project structure

```
src/
├── app/                  # Routes, layouts, and API handlers
│   ├── api/health/       # Sample GET /api/health endpoint
│   ├── layout.tsx        # Root layout (header + footer)
│   ├── page.tsx          # Home page
│   └── globals.css       # Global styles & design tokens
├── components/
│   ├── layout/           # Header, Footer
│   └── ui/               # Button, Container, etc.
└── lib/
    └── utils.ts          # cn() helper for Tailwind classes
```

## Scripts

| Command        | Description              |
| -------------- | ------------------------ |
| `npm run dev`  | Start development server |
| `npm run build`| Production build         |
| `npm run start`| Run production server    |
| `npm run lint` | Run ESLint               |

## Where to go next

- Add pages under `src/app/` (e.g. `src/app/about/page.tsx` → `/about`)
- Add components under `src/components/`
- Add API routes under `src/app/api/`
- Extend design tokens in `src/app/globals.css`

## Deploy

Deploy on [Vercel](https://vercel.com/new) or any platform that supports Next.js.
