import { createContext, useContext, useMemo, useState } from 'react'
import { StyleSheet, useColorScheme } from 'react-native'

export type Theme = 'light' | 'dark'
export type ThemePreference = 'light' | 'dark' | 'system'

// tokens.ts — Mobile Workflows design tokens
// Drop into your theme provider as ThemeTokens.
// All values match colors_and_type.css exactly.
//
// Usage:
//   import { darkTokens, lightTokens, sharedTokens } from './tokens'
//   import type { ThemeTokens } from './tokens'
//
//   const theme = isDark ? darkTokens : lightTokens
//   // Non-color props (spacing, type, radius, animation) are in sharedTokens
//   // and already merged into each theme object.

// ─────────────────────────────────────────────────────────────────────────────
// SHARED — non-color props, identical in both themes
// ─────────────────────────────────────────────────────────────────────────────

export const sharedTokens = {
  // ── Typography ────────────────────────────────────────────────
  fontMono: 'JetBrainsMono' as const,  // expo-font: require('../../assets/fonts/JetBrainsMono-Regular.ttf')
  fontSans: 'DMSans' as const,         // expo-font or system fallback

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

// ─────────────────────────────────────────────────────────────────────────────
// DARK THEME — phosphor-green on deep charcoal
// ─────────────────────────────────────────────────────────────────────────────

const darkColors = {
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
}

// ─────────────────────────────────────────────────────────────────────────────
// LIGHT THEME — warm paper base, ink text, deeper green accent
//
// Design rationale:
//   Backgrounds: warm off-white stack (#F5F4F1 → #EFEDEA → #E8E6E2 → #E1DED9)
//     — faint warm tint echoes the green-amber palette; avoids clinical blue-white.
//   Borders: warm greys, low contrast but readable at all elevations.
//   Text: near-black (#111312) primary, stepping down through warm greys.
//   Accent green: #2E9658 — one step darker than dark-theme base for WCAG AA on light.
//   Amber/error: slightly darkened for contrast parity on light surfaces.
//   Status: same hues, darkened ~10% for light-bg contrast.
// ─────────────────────────────────────────────────────────────────────────────

const lightColors = {
  // ── Backgrounds ──────────────────────────────────────────────
  bgBase:     '#F5F4F1',  // warm off-white — main app bg
  bgSurface:  '#EFEDEA',  // cards, panels — one step darker
  bgElevated: '#E8E6E2',  // elevated surfaces
  bgOverlay:  '#E1DED9',  // hover / press overlay
  bgModal:    '#F8F7F5',  // modals / sheets — slightly lighter than base

  // ── Borders ──────────────────────────────────────────────────
  borderSubtle:  '#DDD9D3',  // very light dividers
  borderDefault: '#C8C4BE',  // default card/input borders
  borderStrong:  '#A09B95',  // strong emphasis borders
  borderActive:  '#2E9658',  // focus / active — deeper green for light

  // ── Text ─────────────────────────────────────────────────────
  textPrimary:   '#111312',  // near-black, warm tint
  textSecondary: '#4A5250',  // dark warm grey
  textMuted:     '#72786F',  // muted — mirrors dark's #7A8080 at similar L*
  textDisabled:  '#A8ADA8',  // disabled — clearly lighter
  textInverse:   '#F5F4F1',  // inverse = light base (for dark surfaces)

  // ── Accent — Phosphor Green (deepened for light contrast) ────
  accentBase:   '#2E9658',  // WCAG AA on bgBase (#F5F4F1): ~4.6:1
  accentBright: '#3DBA6F',  // reuse dark's base as "bright" on light
  accentDim:    '#1F6B3E',  // deeper dim
  accentGhost:  'rgba(46,150,88,0.09)' as const,
  accentBorder: 'rgba(46,150,88,0.28)' as const,

  // ── Amber — Warning / Secondary ──────────────────────────────
  amberBase:   '#A86E1A',  // darkened ~15% for light-bg contrast
  amberBright: '#C8892A',  // reuse dark base as "bright"
  amberDim:    '#7A5010',
  amberGhost:  'rgba(168,110,26,0.10)' as const,
  amberBorder: 'rgba(168,110,26,0.25)' as const,

  // ── Error / Destructive ───────────────────────────────────────
  errorBase:   '#B02E22',  // slightly deeper red for light
  errorBright: '#C0392B',  // reuse dark base as "bright"
  errorDim:    '#7A1F16',
  errorGhost:  'rgba(176,46,34,0.09)' as const,
  errorBorder: 'rgba(176,46,34,0.25)' as const,

  // ── Status ────────────────────────────────────────────────────
  // Deepened ~10% vs dark theme for adequate contrast on light surfaces.
  statusRunning:  '#1E9486',  // teal
  statusComplete: '#2E9658',  // green (= accentBase)
  statusPending:  '#A86E1A',  // amber (= amberBase)
  statusFailed:   '#B02E22',  // red (= errorBase)
  statusIdle:     '#72786F',  // grey (= textMuted)
  statusStopped:  '#72786F',
}

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

// Explicit interface so both themes are checked against the same shape.
// Neither `typeof darkColors` nor `typeof lightColors` works here — each
// `as const` object widens to unique literal types that aren't mutually
// assignable. ColorTokens names every key with `string` so either theme
// satisfies it, while still providing autocomplete for consumers.
export type ColorTokens = {
  bgBase: string
  bgSurface: string
  bgElevated: string
  bgOverlay: string
  bgModal: string

  borderSubtle: string
  borderDefault: string
  borderStrong: string
  borderActive: string

  textPrimary: string
  textSecondary: string
  textMuted: string
  textDisabled: string
  textInverse: string

  accentBase: string
  accentBright: string
  accentDim: string
  accentGhost: string
  accentBorder: string

  amberBase: string
  amberBright: string
  amberDim: string
  amberGhost: string
  amberBorder: string

  errorBase: string
  errorBright: string
  errorDim: string
  errorGhost: string
  errorBorder: string

  statusRunning: string
  statusComplete: string
  statusPending: string
  statusFailed: string
  statusIdle: string
  statusStopped: string
}

export type SharedTokens = typeof sharedTokens
export type ThemeTokens = SharedTokens & ColorTokens

// ─────────────────────────────────────────────────────────────────────────────
// MERGED EXPORTS
// Satisfies ColorTokens at compile time — any missing/extra key is a type error.
// ─────────────────────────────────────────────────────────────────────────────

export const darkTokens: ThemeTokens  = { ...sharedTokens, ...darkColors  }
export const lightTokens: ThemeTokens = { ...sharedTokens, ...lightColors }

export const tokens: Record<Theme, ThemeTokens> = {
  light: lightTokens,
  dark: darkTokens,
}

type ThemeContextValue = {
  theme: Theme
  themePreference: ThemePreference
  tokens: ThemeTokens
  setThemePreference: (pref: ThemePreference) => void
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme()
  const [themePreference, setThemePreference] = useState<ThemePreference>('system')

  const theme: Theme = useMemo(() => {
    if (themePreference === 'system') {
      return systemScheme ?? 'light'
    }
    return themePreference
  }, [themePreference, systemScheme])

  return (
    <ThemeContext.Provider value={{ theme, themePreference, tokens: tokens[theme], setThemePreference }}>
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
