import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { Loader2 as Loader2Icon } from "lucide-react"

const loaderVariants = cva(
  "animate-spin",
  {
    variants: {
      size: {
        default: "h-4 w-4",
        sm: "h-3 w-3",
        lg: "h-6 w-6",
        xl: "h-8 w-8"
      },
      variant: {
        default: "text-primary",
        secondary: "text-secondary",
        destructive: "text-destructive",
        muted: "text-muted-foreground",
        accent: "text-accent",
        brand: "text-[#4588B2]"
      }
    },
    defaultVariants: {
      size: "default",
      variant: "default"
    }
  }
)

export interface LoaderProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof loaderVariants> {}

const Loader = React.forwardRef<HTMLDivElement, LoaderProps>(
  ({ className, size, variant, ...props }, ref) => {
    return (
      <div
        className={cn(loaderVariants({ size, variant, className }))}
        ref={ref}
        {...props}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
      </div>
    )
  }
)
Loader.displayName = "Loader"

const Loader2 = React.forwardRef<HTMLDivElement, LoaderProps>(
  ({ className, size, variant, ...props }, ref) => {
    return (
      <div
        className={cn(loaderVariants({ size, variant, className }))}
        ref={ref}
        {...props}
      >
        <Loader2Icon className="w-full h-full" />
      </div>
    )
  }
)
Loader2.displayName = "Loader2"

export { Loader, Loader2, loaderVariants }
