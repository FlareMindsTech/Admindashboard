import { mode } from "@chakra-ui/theme-tools";

export const globalStyles = {
  colors: {
    gray: {
      700: "#1f2733",
    },
    // Frontend colors mapped to Chakra UI
    primary: {
      50: "#f0f9ff",
      100: "#e0f2fe",
      200: "#bae6fd",
      300: "#7dd3fc",
      400: "#38bdf8",
      500: "#0ea5e9", // accent
      600: "#0284c7", // accent-hover
      700: "#0369a1",
      800: "#075985",
      900: "#0c4a6e",
    },
    brand: {
       50: "#f1f5f9",
       100: "#e2e8f0",
       200: "#cbd5e1", 
       300: "#94a3b8",
       400: "#64748b",
       500: "#0f172a", // primary/foreground
       600: "#0f172a",
       700: "#334155",
       800: "#1e293b", // primary-light
       900: "#0f172a",
    },
    navy: {
      50: "#d0dcfb",
      100: "#aac0fe",
      200: "#a3b9f8",
      300: "#728fea",
      400: "#3652ba",
      500: "#1b3bbb",
      600: "#24388a",
      700: "#1b254b",
      800: "#111c44",
      900: "#0b1437",
    },
  },
  styles: {
    global: (props) => ({
      body: {
        bg: mode("#f8fafc", "#0f172a")(props), // background / primary
        color: mode("#0f172a", "#f8fafc")(props), // foreground / background
        fontFamily: "'Inter', sans-serif",
      },
      html: {
        fontFamily: "'Inter', sans-serif",
      },
    }),
  },
};

