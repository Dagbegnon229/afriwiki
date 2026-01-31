"use client";

import * as React from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

interface SearchInputProps {
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  onSearch?: (value: string) => void;
  className?: string;
  size?: "sm" | "md" | "lg";
  showButton?: boolean;
  buttonText?: string;
  autoFocus?: boolean;
}

const SearchInput: React.FC<SearchInputProps> = ({
  placeholder = "Rechercher sur AfriWiki",
  value,
  onChange,
  onSearch,
  className,
  size = "md",
  showButton = true,
  buttonText = "Rechercher",
  autoFocus = false,
}) => {
  const [internalValue, setInternalValue] = React.useState(value || "");
  const inputRef = React.useRef<HTMLInputElement>(null);

  const currentValue = value !== undefined ? value : internalValue;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    if (value === undefined) {
      setInternalValue(newValue);
    }
    onChange?.(newValue);
  };

  const handleSearch = () => {
    if (currentValue.trim()) {
      onSearch?.(currentValue.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const sizeClasses = {
    sm: "h-8 text-sm",
    md: "h-9 text-sm",
    lg: "h-10 text-base",
  };

  return (
    <div className={cn("flex w-full", className)}>
      <div className="relative flex-1">
        <Search
          className={cn(
            "absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-foreground-muted)]",
            size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4"
          )}
        />
        <input
          ref={inputRef}
          type="text"
          value={currentValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className={cn(
            "w-full pl-9 pr-3 border border-[var(--color-border)]",
            "bg-[var(--color-background)]",
            "placeholder:text-[var(--color-foreground-muted)]",
            "focus:outline-none focus:border-[var(--color-link)]",
            showButton ? "rounded-l-[var(--radius-sm)] border-r-0" : "rounded-[var(--radius-sm)]",
            sizeClasses[size]
          )}
        />
      </div>
      {showButton && (
        <Button
          type="button"
          variant="secondary"
          onClick={handleSearch}
          className={cn(
            "rounded-l-none rounded-r-[var(--radius-sm)] border border-[var(--color-border)]",
            sizeClasses[size]
          )}
        >
          {buttonText}
        </Button>
      )}
    </div>
  );
};

export { SearchInput };
