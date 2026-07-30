import Link from "next/link"
import { cn } from "@/lib/utils"

type ButtonVariant = "primary" | "secondary" | "ghost"
type ButtonSize = "sm" | "md" | "lg"

type ButtonStyles = {
  variant?: ButtonVariant
  size?: ButtonSize
  className?: string
}

type NativeButtonProps = ButtonStyles &
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    href?: never
  }

type LinkButtonProps = ButtonStyles &
  React.AnchorHTMLAttributes<HTMLAnchorElement> & {
    href: string
  }

export type ButtonProps = NativeButtonProps | LinkButtonProps

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-foreground text-background hover:bg-foreground/90 focus-visible:ring-foreground/30",
  secondary:
    "border border-border bg-background text-foreground hover:bg-muted focus-visible:ring-foreground/20",
  ghost:
    "text-foreground hover:bg-muted focus-visible:ring-foreground/20",
}

const sizeStyles: Record<ButtonSize, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-11 px-5 text-sm",
  lg: "h-12 px-6 text-base",
}

const baseStyles =
  "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"

const getStyles = (
  variant: ButtonVariant,
  size: ButtonSize,
  className?: string
) => cn(baseStyles, variantStyles[variant], sizeStyles[size], className)

export const Button = (props: ButtonProps) => {
  const {
    variant = "primary",
    size = "md",
    className,
    children,
    ...rest
  } = props

  const styles = getStyles(variant, size, className)

  if ("href" in rest && rest.href) {
    const { href, ...linkProps } = rest

    if (href.startsWith("/")) {
      return (
        <Link href={href} className={styles} {...linkProps}>
          {children}
        </Link>
      )
    }

    return (
      <a href={href} className={styles} {...linkProps}>
        {children}
      </a>
    )
  }

  const buttonProps = rest as React.ButtonHTMLAttributes<HTMLButtonElement>

  return (
    <button type={buttonProps.type ?? "button"} className={styles} {...buttonProps}>
      {children}
    </button>
  )
}
