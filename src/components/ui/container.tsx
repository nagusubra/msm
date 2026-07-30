import { cn } from "@/lib/utils"

type ContainerProps = {
  children: React.ReactNode
  className?: string
  as?: "div" | "section" | "main" | "header" | "footer"
}

export const Container = ({
  children,
  className,
  as: Component = "div",
}: ContainerProps) => {
  return (
    <Component
      className={cn("mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8", className)}
    >
      {children}
    </Component>
  )
}
