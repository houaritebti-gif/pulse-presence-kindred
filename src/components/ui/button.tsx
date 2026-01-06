import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";
import { useRipple } from "@/hooks/useRipple";

const buttonVariants = cva(
  cn(
    // Base styles
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium font-body",
    // Transitions - using cubic-bezier for bouncy feel
    "transition-all duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)]",
    // Focus states
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    // Disabled states
    "disabled:pointer-events-none disabled:opacity-50",
    // SVG handling
    "[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
    // Base micro-interactions - more pronounced
    "active:scale-[0.95] active:translate-y-[1px]",
    "hover:translate-y-[-2px]",
    // Touch device optimizations
    "touch-manipulation",
    // Position for ripple
    "relative overflow-hidden"
  ),
  {
    variants: {
      variant: {
        default: cn(
          "bg-primary text-primary-foreground",
          // Enhanced hover with glow and scale
          "hover:bg-primary/90 hover:scale-[1.03]",
          // Dynamic shadow that grows on hover
          "shadow-[0_4px_20px_hsl(var(--primary)/0.35)]",
          "hover:shadow-[0_8px_30px_hsl(var(--primary)/0.5)]",
          // Pressed state with reduced shadow
          "active:shadow-[0_2px_10px_hsl(var(--primary)/0.25)]"
        ),
        destructive: cn(
          "bg-destructive text-destructive-foreground",
          "hover:bg-destructive/90 hover:scale-[1.03]",
          "shadow-[0_4px_15px_hsl(var(--destructive)/0.3)]",
          "hover:shadow-[0_6px_25px_hsl(var(--destructive)/0.4)]",
          "active:shadow-[0_2px_10px_hsl(var(--destructive)/0.2)]"
        ),
        outline: cn(
          "border border-input bg-background",
          "hover:bg-accent hover:text-accent-foreground hover:border-primary/50",
          "hover:scale-[1.02]",
          "active:bg-accent/80"
        ),
        secondary: cn(
          "bg-secondary text-secondary-foreground",
          "hover:bg-secondary/80 hover:scale-[1.02]",
          "active:bg-secondary/70"
        ),
        ghost: cn(
          "hover:bg-accent hover:text-accent-foreground",
          "hover:scale-[1.02]",
          "active:bg-accent/80"
        ),
        link: "text-primary underline-offset-4 hover:underline hover:text-primary/80 active:text-primary/60",
        // KIKI custom variants - enhanced
        kiki: cn(
          "bg-card text-card-foreground font-display font-semibold tracking-wide",
          "hover:bg-card/90 hover:scale-[1.03]",
          "shadow-lg hover:shadow-xl",
          "active:shadow-md active:bg-card/80"
        ),
        "kiki-soft": cn(
          "bg-secondary text-secondary-foreground font-body",
          "hover:bg-secondary/70 hover:scale-[1.02]",
          "active:bg-secondary/60"
        ),
        "kiki-glow": cn(
          "bg-primary text-primary-foreground font-display font-semibold",
          "hover:scale-[1.03] animate-glow",
          "shadow-[0_0_25px_hsl(var(--primary)/0.5)]",
          "hover:shadow-[0_0_40px_hsl(var(--primary)/0.7)]",
          "active:animate-none active:shadow-[0_0_15px_hsl(var(--primary)/0.3)]"
        ),
        "kiki-ghost": cn(
          "bg-transparent text-foreground font-body",
          "hover:text-primary hover:scale-[1.02]",
          "active:text-primary/80"
        ),
      },
      size: {
        default: "h-12 px-6 py-3",
        sm: "h-10 rounded-md px-4",
        lg: "h-14 rounded-lg px-8 text-base",
        xl: "h-16 rounded-xl px-10 text-lg",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  enableRipple?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, enableRipple = true, onMouseDown, onTouchStart, children, ...props }, ref) => {
    const { ripples, createRipple } = useRipple();
    const Comp = asChild ? Slot : "button";

    const handleMouseDown = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (enableRipple && !asChild) {
        createRipple(e);
      }
      onMouseDown?.(e);
    };

    const handleTouchStart = (e: React.TouchEvent<HTMLButtonElement>) => {
      if (enableRipple && !asChild) {
        createRipple(e);
      }
      onTouchStart?.(e);
    };

    if (asChild) {
      return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props}>{children}</Comp>;
    }

    return (
      <Comp 
        className={cn(buttonVariants({ variant, size, className }))} 
        ref={ref} 
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        {...props}
      >
        {children}
        {/* Ripple effects */}
        {enableRipple && ripples.map(ripple => (
          <span
            key={ripple.id}
            className="absolute rounded-full bg-white/30 pointer-events-none animate-ripple"
            style={{
              left: ripple.x,
              top: ripple.y,
              width: ripple.size,
              height: ripple.size,
            }}
          />
        ))}
      </Comp>
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
