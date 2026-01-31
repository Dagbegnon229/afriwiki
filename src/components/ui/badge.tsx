import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-[var(--radius-sm)] px-2 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--color-background-secondary)] text-[var(--color-foreground-secondary)] border border-[var(--color-border-light)]",
        primary:
          "bg-[var(--color-link)] text-white",
        success:
          "bg-[var(--color-accent-green-light)] text-[#00674f] border border-[#a0e5d3]",
        warning:
          "bg-[var(--color-accent-gold)] text-[#3d3d00]",
        danger:
          "bg-[#fee2e2] text-[var(--color-danger)] border border-[#fca5a5]",
        info:
          "bg-[var(--color-accent-blue)] text-[var(--color-link)] border border-[var(--color-accent-blue-border)]",
        // Verification level badges
        verified:
          "bg-[var(--color-accent-green-light)] text-[#00674f]",
        pro:
          "bg-[#fff7e0] text-[#7d5c00] border border-[#ffd700]",
        notable:
          "bg-[#f3e8ff] text-[#6b21a8] border border-[#c4b5fd]",
      },
      size: {
        default: "text-xs px-2 py-0.5",
        sm: "text-[10px] px-1.5 py-0.5",
        lg: "text-sm px-2.5 py-1",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  icon?: React.ReactNode;
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant, size, icon, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(badgeVariants({ variant, size }), className)}
        {...props}
      >
        {icon && <span className="shrink-0">{icon}</span>}
        {children}
      </div>
    );
  }
);
Badge.displayName = "Badge";

// Specialized verification badge component
interface VerificationBadgeProps {
  level: 0 | 1 | 2 | 3 | 4;
  showLabel?: boolean;
  className?: string;
}

const VerificationBadge: React.FC<VerificationBadgeProps> = ({
  level,
  showLabel = true,
  className,
}) => {
  const badges = {
    0: null, // No badge for new users
    1: { icon: "🔵", label: "Basique", variant: "info" as const },
    2: { icon: "✓", label: "Vérifié", variant: "verified" as const },
    3: { icon: "⭐", label: "Pro", variant: "pro" as const },
    4: { icon: "👑", label: "Notable", variant: "notable" as const },
  };

  const badge = badges[level];
  if (!badge) return null;

  return (
    <Badge variant={badge.variant} className={className}>
      <span>{badge.icon}</span>
      {showLabel && <span>{badge.label}</span>}
    </Badge>
  );
};

export { Badge, badgeVariants, VerificationBadge };
