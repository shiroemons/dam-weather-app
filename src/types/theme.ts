export interface ThemeConfig {
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    accent: string;
  };
  typography: {
    fontFamily: string;
    headingWeight: number;
    bodyWeight: number;
  };
  spacing: {
    cardGap: string;
    sectionGap: string;
    pagePadding: string;
  };
  borderRadius: {
    card: string;
    button: string;
  };
}
