import React, { createContext, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { darkColors, lightColors, ThemeColors } from './index';
import { useSettingsStore } from '@/store/settingsStore';

interface ThemeContextValue {
  colors: ThemeColors;
  isDark: boolean;
  /** True once the Nunito font family has loaded; until then text uses the system font. */
  fontsReady: boolean;
}

const ThemeContext = createContext<ThemeContextValue>({ colors: lightColors, isDark: false, fontsReady: false });

export function ThemeProvider({ children, fontsReady = false }: { children: React.ReactNode; fontsReady?: boolean }) {
  const system = useColorScheme();
  const pref = useSettingsStore((s) => s.settings.theme);
  const isDark = pref === 'system' ? system === 'dark' : pref === 'dark';
  const value = useMemo(
    () => ({ colors: isDark ? darkColors : lightColors, isDark, fontsReady }),
    [isDark, fontsReady],
  );
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
