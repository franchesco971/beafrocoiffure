import * as React from "react";
import { cn } from "cn";

// Liste déroulante native : fiable sur mobile et compatible avec les formulaires sans JavaScript.
function NativeSelect({ className, ...props }: React.ComponentProps<"select">) {
  return (
    <select
      data-slot="native-select"
      className={cn(
        "h-11 w-full min-w-0 rounded-lg border border-input bg-input/30 px-2.5 text-base transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm [&>option]:bg-ink-2 [&>option]:text-bone",
        className,
      )}
      {...props}
    />
  );
}

export { NativeSelect };
