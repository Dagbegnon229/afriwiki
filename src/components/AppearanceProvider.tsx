"use client";

import * as React from "react";

type TextSize = "small" | "standard" | "large";
type ColorScheme = "auto" | "light" | "dark";

interface AppearanceContextType {
  textSize: TextSize;
  colorScheme: ColorScheme;
  setTextSize: (size: TextSize) => void;
  setColorScheme: (scheme: ColorScheme) => void;
}

const AppearanceContext = React.createContext<AppearanceContextType | undefined>(
  undefined
);

export const useAppearance = () => {
  const context = React.useContext(AppearanceContext);
  if (!context) {
    throw new Error("useAppearance must be used within AppearanceProvider");
  }
  return context;
};

interface AppearanceProviderProps {
  children: React.ReactNode;
}

export const AppearanceProvider: React.FC<AppearanceProviderProps> = ({
  children,
}) => {
  const [textSize, setTextSizeState] = React.useState<TextSize>("standard");
  const [colorScheme, setColorSchemeState] = React.useState<ColorScheme>("light");
  const [mounted, setMounted] = React.useState(false);

  // Load preferences from localStorage on mount
  React.useEffect(() => {
    setMounted(true);
    const savedTextSize = localStorage.getItem("afriwiki-text-size") as TextSize;
    const savedColorScheme = localStorage.getItem(
      "afriwiki-color-scheme"
    ) as ColorScheme;

    if (savedTextSize) setTextSizeState(savedTextSize);
    if (savedColorScheme) setColorSchemeState(savedColorScheme);
  }, []);

  // Apply text size to document
  React.useEffect(() => {
    if (!mounted) return;

    const sizes = {
      small: "13px",
      standard: "14px",
      large: "16px",
    };

    document.documentElement.style.fontSize = sizes[textSize];
    localStorage.setItem("afriwiki-text-size", textSize);
  }, [textSize, mounted]);

  // Apply color scheme to document
  React.useEffect(() => {
    if (!mounted) return;

    const root = document.documentElement;

    if (colorScheme === "dark") {
      root.classList.add("dark-mode");
      root.style.setProperty("--background", "#101418");
      root.style.setProperty("--background-secondary", "#1a1d21");
      root.style.setProperty("--border-light", "#2a2d31");
      root.style.setProperty("--border-color", "#54595d");
      root.style.setProperty("--text-primary", "#f8f9fa");
      root.style.setProperty("--text-secondary", "#a2a9b1");
      root.style.setProperty("--link-color", "#6b9eff");
    } else if (colorScheme === "light") {
      root.classList.remove("dark-mode");
      root.style.setProperty("--background", "#ffffff");
      root.style.setProperty("--background-secondary", "#f8f9fa");
      root.style.setProperty("--border-light", "#eaecf0");
      root.style.setProperty("--border-color", "#a2a9b1");
      root.style.setProperty("--text-primary", "#202122");
      root.style.setProperty("--text-secondary", "#54595d");
      root.style.setProperty("--link-color", "#3366cc");
    } else {
      // Auto - follow system preference
      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches;
      if (prefersDark) {
        root.classList.add("dark-mode");
        root.style.setProperty("--background", "#101418");
        root.style.setProperty("--background-secondary", "#1a1d21");
        root.style.setProperty("--border-light", "#2a2d31");
        root.style.setProperty("--border-color", "#54595d");
        root.style.setProperty("--text-primary", "#f8f9fa");
        root.style.setProperty("--text-secondary", "#a2a9b1");
        root.style.setProperty("--link-color", "#6b9eff");
      } else {
        root.classList.remove("dark-mode");
        root.style.setProperty("--background", "#ffffff");
        root.style.setProperty("--background-secondary", "#f8f9fa");
        root.style.setProperty("--border-light", "#eaecf0");
        root.style.setProperty("--border-color", "#a2a9b1");
        root.style.setProperty("--text-primary", "#202122");
        root.style.setProperty("--text-secondary", "#54595d");
        root.style.setProperty("--link-color", "#3366cc");
      }
    }

    localStorage.setItem("afriwiki-color-scheme", colorScheme);
  }, [colorScheme, mounted]);

  const setTextSize = (size: TextSize) => {
    setTextSizeState(size);
  };

  const setColorScheme = (scheme: ColorScheme) => {
    setColorSchemeState(scheme);
  };

  return (
    <AppearanceContext.Provider
      value={{ textSize, colorScheme, setTextSize, setColorScheme }}
    >
      {children}
    </AppearanceContext.Provider>
  );
};

// Sidebar component with working appearance options
export const AppearanceSidebar: React.FC = () => {
  const { textSize, colorScheme, setTextSize, setColorScheme } = useAppearance();

  return (
    <div className="sidebar-section">
      <div className="sidebar-title">Apparence</div>
      <div className="appearance-options">
        <div
          className="sidebar-title"
          style={{ fontSize: "0.8rem", border: "none", padding: 0 }}
        >
          Taille du texte
        </div>
        <div className="appearance-option">
          <input
            type="radio"
            name="text-size"
            id="size-small"
            checked={textSize === "small"}
            onChange={() => setTextSize("small")}
          />
          <label htmlFor="size-small">Petite</label>
        </div>
        <div className="appearance-option">
          <input
            type="radio"
            name="text-size"
            id="size-standard"
            checked={textSize === "standard"}
            onChange={() => setTextSize("standard")}
          />
          <label htmlFor="size-standard">Standard</label>
        </div>
        <div className="appearance-option">
          <input
            type="radio"
            name="text-size"
            id="size-large"
            checked={textSize === "large"}
            onChange={() => setTextSize("large")}
          />
          <label htmlFor="size-large">Grande</label>
        </div>
      </div>
      <div className="appearance-options" style={{ marginTop: "1rem" }}>
        <div
          className="sidebar-title"
          style={{ fontSize: "0.8rem", border: "none", padding: 0 }}
        >
          Couleur
        </div>
        <div className="appearance-option">
          <input
            type="radio"
            name="color"
            id="color-auto"
            checked={colorScheme === "auto"}
            onChange={() => setColorScheme("auto")}
          />
          <label htmlFor="color-auto">Automatique</label>
        </div>
        <div className="appearance-option">
          <input
            type="radio"
            name="color"
            id="color-light"
            checked={colorScheme === "light"}
            onChange={() => setColorScheme("light")}
          />
          <label htmlFor="color-light">Clair</label>
        </div>
        <div className="appearance-option">
          <input
            type="radio"
            name="color"
            id="color-dark"
            checked={colorScheme === "dark"}
            onChange={() => setColorScheme("dark")}
          />
          <label htmlFor="color-dark">Sombre</label>
        </div>
      </div>
    </div>
  );
};
