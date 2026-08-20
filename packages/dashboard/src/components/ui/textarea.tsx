import * as React from "react"
import { cn } from "@/lib/utils"

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full cursor-text rounded-md border border-input bg-surface-overlay px-3 py-2 text-sm shadow-[inset_0_1px_1px_rgb(15_18_13/0.025)] ring-offset-background transition-[background-color,border-color,box-shadow] duration-200 [transition-timing-function:var(--ease-standard)] placeholder:text-muted-foreground placeholder:transition-colors hover:border-foreground/25 focus-visible:border-primary/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35 focus-visible:ring-offset-2 aria-[invalid=true]:border-destructive aria-[invalid=true]:ring-1 aria-[invalid=true]:ring-destructive/35 disabled:cursor-not-allowed disabled:border-input disabled:bg-muted/60 disabled:text-muted-foreground disabled:shadow-none disabled:opacity-100",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }
