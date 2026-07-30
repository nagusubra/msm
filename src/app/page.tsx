import { Button } from "@/components/ui/button"
import { Container } from "@/components/ui/container"

const starterSections = [
  {
    title: "Pages",
    description: "Add routes under src/app/. Each folder becomes a URL segment.",
    path: "src/app/",
  },
  {
    title: "Components",
    description: "Reusable UI lives in src/components/. Start with ui/ and layout/.",
    path: "src/components/",
  },
  {
    title: "API routes",
    description: "Server endpoints go in src/app/api/. Try GET /api/health to verify.",
    path: "src/app/api/",
  },
  {
    title: "Utilities",
    description: "Shared helpers and types belong in src/lib/. Includes the cn() helper.",
    path: "src/lib/",
  },
]

export default function Home() {
  return (
    <main className="flex flex-1 flex-col py-12 sm:py-16">
      <Container as="section" className="flex flex-col gap-10">
        <div className="flex max-w-2xl flex-col gap-4">
          <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
            Starter project
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
            Ready to build on top of
          </h1>
          <p className="text-lg leading-relaxed text-muted-foreground">
            Next.js 16, React 19, TypeScript, and Tailwind CSS — wired up with a
            layout shell, reusable components, and a sample API route.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Button href="/api/health" variant="secondary">
              Check API health
            </Button>
            <Button
              href="https://nextjs.org/docs"
              variant="ghost"
              target="_blank"
              rel="noopener noreferrer"
            >
              Next.js docs
            </Button>
          </div>
        </div>

        <ul className="grid gap-4 sm:grid-cols-2">
          {starterSections.map((section) => (
            <li
              key={section.title}
              className="rounded-xl border border-border bg-muted/30 p-6 transition-colors hover:bg-muted/50"
            >
              <h2 className="text-lg font-semibold text-foreground">{section.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {section.description}
              </p>
              <code className="mt-4 inline-block rounded-md bg-background px-2 py-1 font-mono text-xs text-foreground">
                {section.path}
              </code>
            </li>
          ))}
        </ul>
      </Container>
    </main>
  )
}
