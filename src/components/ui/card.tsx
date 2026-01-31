import * as React from "react";
import { cn } from "@/lib/utils";

// ============================================
// Card Components - Wikipedia Style
// ============================================

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "border border-[var(--color-border-light)] bg-[var(--color-background)]",
      className
    )}
    {...props}
  />
));
Card.displayName = "Card";

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "bg-[var(--color-background-secondary)] border-b border-[var(--color-border-light)] px-4 py-2",
      className
    )}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h2
    ref={ref}
    className={cn(
      "font-[var(--font-serif)] text-base font-normal",
      "font-[small-caps] tracking-wide",
      "text-[var(--color-foreground)]",
      "border-0 m-0 p-0", // Reset default h2 styles
      className
    )}
    style={{ fontFamily: "var(--font-serif)" }}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-[var(--color-foreground-secondary)]", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-4", className)} {...props} />
));
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex items-center px-4 py-3 border-t border-[var(--color-border-light)]",
      className
    )}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

// ============================================
// Notice Box - Wikipedia Style
// ============================================

interface NoticeBoxProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "info" | "warning" | "success" | "danger";
}

const NoticeBox = React.forwardRef<HTMLDivElement, NoticeBoxProps>(
  ({ className, variant = "info", ...props }, ref) => {
    const variantStyles = {
      info: "bg-[var(--color-accent-blue)] border-[var(--color-accent-blue-border)]",
      warning: "bg-[#fef3cd] border-[#ffc107]",
      success: "bg-[var(--color-accent-green-light)] border-[#00af89]",
      danger: "bg-[#fee2e2] border-[var(--color-danger)]",
    };

    return (
      <div
        ref={ref}
        className={cn(
          "border px-4 py-3 mb-4 text-sm",
          variantStyles[variant],
          className
        )}
        {...props}
      />
    );
  }
);
NoticeBox.displayName = "NoticeBox";

// ============================================
// Infobox - Wikipedia Style (for entrepreneur profiles)
// ============================================

const Infobox = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "md:float-right md:ml-4 md:w-[280px] w-full",
      "border border-[var(--color-border)] bg-[var(--color-background-secondary)]",
      "text-sm mb-4",
      className
    )}
    {...props}
  />
));
Infobox.displayName = "Infobox";

const InfoboxHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "bg-[var(--color-background-tertiary)] px-3 py-2 text-center font-semibold",
      className
    )}
    {...props}
  />
));
InfoboxHeader.displayName = "InfoboxHeader";

const InfoboxImage = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "text-center p-2 bg-[var(--color-background)]",
      className
    )}
    {...props}
  />
));
InfoboxImage.displayName = "InfoboxImage";

const InfoboxRow = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex border-t border-[var(--color-border-light)]",
      className
    )}
    {...props}
  />
));
InfoboxRow.displayName = "InfoboxRow";

const InfoboxLabel = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex-[0_0_35%] px-2 py-1.5 bg-[var(--color-background-tertiary)] font-medium",
      className
    )}
    {...props}
  />
));
InfoboxLabel.displayName = "InfoboxLabel";

const InfoboxValue = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex-1 px-2 py-1.5", className)}
    {...props}
  />
));
InfoboxValue.displayName = "InfoboxValue";

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
  NoticeBox,
  Infobox,
  InfoboxHeader,
  InfoboxImage,
  InfoboxRow,
  InfoboxLabel,
  InfoboxValue,
};
