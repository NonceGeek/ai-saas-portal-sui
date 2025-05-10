"use client";

import * as React from "react";
import {
  ThemeProvider as NextThemesProvider,
  useTheme as useNextTheme,
} from "next-themes";
import { ThemeProvider as MuiThemeProvider } from "@mui/material/styles";
import { type ThemeProviderProps } from "next-themes/dist/types";
import { lightTheme, darkTheme } from "../app/theme";

function MuiThemeWrapper({ children }: { children: React.ReactNode }) {
  const { theme } = useNextTheme();
  const muiTheme = theme === "dark" ? darkTheme : lightTheme;
  return <MuiThemeProvider theme={muiTheme}>{children}</MuiThemeProvider>;
}

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider {...props}>
      <MuiThemeWrapper>{children}</MuiThemeWrapper>
    </NextThemesProvider>
  );
}
