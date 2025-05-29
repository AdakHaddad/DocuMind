import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/src/lib/utils";

const inputVariants = cva(
  "text-documind-primary placeholder-documind-primary border-documind-primary file:text-documind-primary selection:bg-documind-primary selection:text-documind-card-bg dark:bg-documind-input/30 flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
  {
    variants: {
      state: {
        default: "",
        invalid:
          "ring-documind-error/20 dark:ring-documind-error/40 border-documind-error"
      }
    },
    defaultVariants: {
      state: "default"
    }
  }
);

interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement>,
    VariantProps<typeof inputVariants> {
  label?: string;
  id?: string;
}

function Input({ className, state, type, label, id, ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label
          htmlFor={id}
          className="text-sm font-medium text-documind-primary"
        >
          {label}
        </label>
      )}
      <input
        id={id}
        type={type}
        data-slot="input"
        className={cn(
          inputVariants({ state }),
          "focus-visible:border-documind-primary focus-visible:ring-documind-primary/50 focus-visible:ring-[2px] border-[2px]",
          "aria-invalid:ring-documind-error/20 dark:aria-invalid:ring-documind-error/40 aria-invalid:border-documind-error",
          className
        )}
        {...props}
      />
    </div>
  );
}

export { Input, inputVariants };
