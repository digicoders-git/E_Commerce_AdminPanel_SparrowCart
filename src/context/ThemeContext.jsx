// src/context/ThemeContext.jsx
import { createContext, useContext, useEffect, useState } from "react";

// ---- 4 Color Theme Core ----
const BASE_COLORS = {
  primary: "#0F3D3E",       // SparrowCart Teal
  secondary: "#ffffff",     // White

  accent: "#1FB6C9",        // SparrowCart Cyan
  success: "#10b981",       // Green
  warning: "#F04E3E",       // SparrowCart Coral

  backgroundLight: "#F7F8FA",
  backgroundDark: "#0a1a1a",

  surfaceLight: "#ffffff",
  surfaceDark: "#0F2526",

  textLight: "#1A1A1A",
  textDark: "#F7F8FA",

  borderLight: "#E8ECF0",
  borderDark: "#1a5557",

  hoverLight: "#e8f8fa",    // accent-light
  hoverDark: "#1FB6C920",

  activeLight: "#1a5557",   // teal-light
  activeDark: "#1a5557",
};

// ---- All palettes same now ----
const colorPalettes = {
  corporate: BASE_COLORS,
  luxury: BASE_COLORS,
  modern: BASE_COLORS,
  minimal: BASE_COLORS,
};

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const getInitialTheme = () => localStorage.getItem("theme") || "light";
  const getInitialPalette = () => localStorage.getItem("palette") || "corporate";

  const [theme, setTheme] = useState(getInitialTheme);
  const [palette, setPalette] = useState(getInitialPalette);

  useEffect(() => {
    const html = document.documentElement;
    html.setAttribute("data-theme", theme);
    theme === "dark" ? html.classList.add("dark") : html.classList.remove("dark");

    localStorage.setItem("theme", theme);
    localStorage.setItem("palette", palette);
  }, [theme, palette]);

  const toggleTheme = () =>
    setTheme((prev) => (prev === "light" ? "dark" : "light"));

  const changePalette = (newPalette) => {
    if (colorPalettes[newPalette]) setPalette(newPalette);
  };

  const colors = colorPalettes[palette];

  // --- FINAL DESIGN: All 4 colors applied consistently! ---
  const themeColors = {
    light: {
      mode: "light",
      primary: colors.primary,
      secondary: colors.secondary,

      accent: colors.accent,
      success: colors.success,
      warning: colors.warning,

      background: colors.backgroundLight,
      surface: colors.surfaceLight,
      text: colors.textLight,

      border: colors.borderLight,

      hover: {
        background: colors.hoverLight,
        text: colors.textLight,
        border: colors.accent,
      },

      active: {
        background: colors.activeLight,
        text: colors.secondary,
        border: colors.accent,
      },

      onPrimary: "#ffffff",
      textSecondary: "#6B7280",
      danger: "#F04E3E",
    },

    dark: {
      mode: "dark",

      primary: colors.primary,
      secondary: colors.secondary,

      accent: colors.accent,
      success: colors.success,
      warning: colors.warning,

      background: colors.backgroundDark,
      surface: colors.surfaceDark,
      text: colors.textDark,

      border: colors.borderDark,

      hover: {
        background: colors.hoverDark,
        text: colors.textDark,
        border: colors.accent,
      },

      active: {
        background: colors.activeDark,
        text: colors.secondary,
        border: colors.accent,
      },

      onPrimary: "#ffffff",
      textSecondary: "#9CA3AF",
      danger: "#F04E3E",
    },
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        toggleTheme,
        palette,
        changePalette,
        themeColors: themeColors[theme],
        availablePalettes: Object.keys(colorPalettes),
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
