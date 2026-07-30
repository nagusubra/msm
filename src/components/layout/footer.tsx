import { Container } from "@/components/ui/container"

export const Footer = () => {
  const year = new Date().getFullYear()

  return (
    <footer className="mt-auto border-t border-border bg-background">
      <Container className="flex h-16 items-center justify-between text-sm text-muted-foreground">
        <p>© {year} ChaChing</p>
        <p>Timing tax · dual revenue</p>
      </Container>
    </footer>
  )
}
