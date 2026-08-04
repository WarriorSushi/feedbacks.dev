import * as React from "react"
import { cn } from "@/lib/utils"

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-[inset_0_1px_1px_rgb(15_18_13/0.025)] ring-offset-background transition-[background-color,border-color,box-shadow] duration-200 [transition-timing-function:var(--ease-standard)] file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground placeholder:transition-colors focus-visible:border-primary/45 focus-visible:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35 focus-visible:ring-offset-2 aria-[invalid=true]:border-destructive aria-[invalid=true]:ring-1 aria-[invalid=true]:ring-destructive/35 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
