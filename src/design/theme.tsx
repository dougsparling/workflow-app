import { createContext, useCallback, useContext, useState } from 'react'
import { StyleSheet } from 'react-native'

export type Theme = 'light' | 'dark'

export const darkTokens = {
  // ── Backgrounds ──────────────────────────────────────────────
  bgBase:     '#0E0F0F',
  bgSurface:  '#161818',
  bgElevated: '#1A1C1C',
  bgOverlay:  '#1F2222',
  bgModal:    '#131515',

  // ── Borders ──────────────────────────────────────────────────
  borderSubtle:  '#1E2121',
  borderDefault: '#252929',
  borderStrong:  '#3F4444',
  borderActive:  '#3DBA6F',

  // ── Text ─────────────────────────────────────────────────────
  textPrimary:   '#E8EAE6',
  textSecondary: '#9AA09A',
  textMuted:     '#7A8080',
  textDisabled:  '#3F4444',
  textInverse:   '#0E0F0F',

  // ── Accent — Phosphor Green ───────────────────────────────────
  accentBase:   '#3DBA6F',
  accentBright: '#52D484',
  accentDim:    '#2A7D4C',
  accentGhost:  'rgba(61,186,111,0.10)' as const,
  accentBorder: 'rgba(61,186,111,0.30)' as const,

  // ── Amber — Warning / Secondary ──────────────────────────────
  amberBase:   '#C8892A',
  amberBright: '#E09B35',
  amberDim:    '#8A5E1A',
  amberGhost:  'rgba(200,137,42,0.12)' as const,
  amberBorder: 'rgba(200,137,42,0.28)' as const,

  // ── Error / Destructive ───────────────────────────────────────
  errorBase:   '#C0392B',
  errorBright: '#E04535',
  errorDim:    '#7A2218',
  errorGhost:  'rgba(192,57,43,0.12)' as const,
  errorBorder: 'rgba(192,57,43,0.28)' as const,

  // ── Status ────────────────────────────────────────────────────
  statusRunning:  '#29B8A8',
  statusComplete: '#3DBA6F',
  statusPending:  '#C8892A',
  statusFailed:   '#C0392B',
  statusIdle:     '#7A8080',
  statusStopped:  '#7A8080',

  // ── Typography ────────────────────────────────────────────────
  fontMono: 'JetBrainsMono' as const,  // load via expo-font: require('../../assets/fonts/JetBrainsMono-Regular.ttf')
  fontSans: 'DMSans' as const,         // load via expo-font or system fallback

  textXs:   11,
  textSm:   12,
  textBase: 14,
  textMd:   15,
  textLg:   17,
  textXl:   20,
  text2xl:  24,
  text3xl:  28,
  text4xl:  34,

  weightLight:    '300' as const,
  weightRegular:  '400' as const,
  weightMedium:   '500' as const,
  weightSemibold: '600' as const,
  weightBold:     '700' as const,

  leadingTight:  1.2,
  leadingSnug:   1.35,
  leadingNormal: 1.5,

  trackingTight:   -0.3,
  trackingNormal:   0,
  trackingWide:     0.6,
  trackingWidest:   1.4,

  // ── Spacing (4px base) ────────────────────────────────────────
  space0:  0,
  space1:  4,
  space2:  8,
  space3:  12,
  space4:  16,
  space5:  20,
  space6:  24,
  space8:  32,
  space10: 40,
  space12: 48,
  space16: 64,
  space20: 80,

  // ── Touch targets ─────────────────────────────────────────────
  touchTargetSm: 44,
  touchTargetMd: 52,
  touchTargetLg: 60,

  // ── Borders / Radius ─────────────────────────────────────────
  // Sharp system — 0px default. Full only for status dots.
  radiusNone: 0,
  radiusXs:   1,
  radiusSm:   2,
  radiusFull: 9999,

  borderWidthDefault: 1,
  borderWidthThick:   4,  // status accent bar

  // ── Animation ─────────────────────────────────────────────────
  durationFast:   100,
  durationNormal: 150,
  durationSlow:   250,
} as const

export type ThemeTokens = typeof darkTokens

export const tokens: Record<Theme, ThemeTokens> = {
  light: darkTokens, // TODO
  dark: darkTokens,
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
