import type { ThemeConfig } from "@/types";

export const defaultTheme: ThemeConfig = {
  colors: {
    primary: "#0071E3",
    secondary: "#86868B",
    background: "#F5F5F7",
    surface: "#FFFFFF",
    text: "#1D1D1F",
    textSecondary: "#6E6E73",
    accent: "#0077ED",
  },
  typography: {
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
    headingWeight: 600,
    bodyWeight: 400,
  },
  spacing: {
    cardGap: "16px",
    sectionGap: "32px",
    pagePadding: "24px",
  },
  borderRadius: {
    card: "16px",
    button: "12px",
  },
};
