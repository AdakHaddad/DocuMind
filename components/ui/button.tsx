import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-[3px] cursor-pointer border-documind-primary",
  {
    variants: {
      variant: {
        default:
          "bg-documind-primary text-documind-card-bg hover:bg-documind-primary/90",
        destructive:
          "bg-documind-error text-white hover:bg-documind-error/90 focus-visible:ring-documind-error/20 dark:focus-visible:ring-documind-error/40 dark:bg-documind-error/60",
        outline:
          "border bg-documind-bg text-documind-primary hover:bg-documind-primary/10",
        secondary:
          "bg-documind-secondary text-documind-text-secondary hover:bg-documind-secondary/80",
        ghost:
          "hover:bg-documind-secondary hover:text-documind-text-primary dark:hover:bg-documind-secondary/50",
        link: "text-documind-primary underline-offset-4 hover:underline"
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "text-[1.5vw] py-[.2vw] px-[2vw] rounded-md gap-1.5 has-[>svg]:px-2.5",
        lg: "text-[2vw] py-[.5vw] px-[2vw] rounded-md has-[>svg]:px-4",
        icon: "size-9"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
