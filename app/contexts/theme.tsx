import { createContext, useCallback, useContext, useState } from 'react'
import { StyleSheet } from 'react-native'

type Theme = 'light' | 'dark'
export type ThemeTokens = {
  // TODO
} & object

const tokens: Record<Theme, ThemeTokens> = {
  light: {},
  dark: {},
}

type ThemeContextValue = {
  theme: Theme
  tokens: ThemeTokens
  toggleTheme: () => void
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light')
  const toggleTheme = useCallback(() => setTheme((t) => (t === 'light' ? 'dark' : 'light')), [])

  return (
    <ThemeContext.Provider value={{ theme, tokens: tokens[theme], toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const ThemeContext = createContext<ThemeContextValue | null>(null)

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider')
  return ctx
}

export function useThemedStyles<T extends StyleSheet.NamedStyles<T>>(
  factory: (tokens: ThemeTokens, theme: Theme) => T,
) {
  const { theme, tokens } = useTheme()
  return factory(tokens, theme)
}

export function createThemedStyles<T extends StyleSheet.NamedStyles<T>>(
  factory: (tokens: ThemeTokens, theme: Theme) => T,
) {
  return factory
}
