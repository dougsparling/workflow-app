import { useState } from 'react'
import { Pressable, Text } from 'react-native'
import Feather from '@expo/vector-icons/Feather'
import type { ComponentProps } from 'react'
import { createThemedStyles, useThemedStyles, useTheme } from '../theme'
import type { ThemeTokens } from '../theme'

type FeatherName = ComponentProps<typeof Feather>['name']

interface Props {
  label: string
  icon?: FeatherName
  onPress?: () => void
  variant?: 'primary' | 'ghost' | 'destructive' | 'secondary'
  disabled?: boolean
}

export default function Button({
  label,
  icon,
  onPress,
  variant = 'primary',
  disabled = false,
}: Props) {
  const [pressed, setPressed] = useState(false)
  const styles = useThemedStyles(themedStyles)
  const { tokens: t } = useTheme()

  const color =
    disabled                  ? t.textDisabled :
    variant === 'primary'     ? t.bgBase :
    variant === 'ghost'       ? t.accentBase :
    variant === 'destructive' ? '#fff' :
    t.textPrimary

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      style={[
        styles.base,
        variant === 'primary'     && styles.variantPrimary,
        variant === 'ghost'       && styles.variantGhost,
        variant === 'destructive' && styles.variantDestructive,
        variant === 'secondary'   && styles.variantSecondary,
        pressed && variant === 'primary'     && styles.pressedPrimary,
        pressed && variant === 'ghost'       && styles.pressedGhost,
        pressed && variant === 'destructive' && styles.pressedDestructive,
        pressed && variant === 'secondary'   && styles.pressedSecondary,
        disabled && styles.disabled,
      ]}
    >
      {icon ? <Feather name={icon} size={14} color={color} /> : null}
      <Text style={[styles.label, { color }]}>{label}</Text>
    </Pressable>
  )
}

const themedStyles = createThemedStyles((tokens: ThemeTokens) => ({
  base: {
    height: tokens.touchTargetSm,
    borderRadius: tokens.radiusNone,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: tokens.space1,
    paddingHorizontal: tokens.space5,
  },
  variantPrimary: {
    backgroundColor: tokens.accentBase,
  },
  variantGhost: {
    backgroundColor: tokens.accentGhost,
    borderWidth: 1,
    borderColor: tokens.accentBorder,
  },
  variantDestructive: {
    backgroundColor: tokens.errorBase,
  },
  variantSecondary: {
    alignSelf: 'flex-start' as const,
    backgroundColor: tokens.bgSurface,
    borderWidth: 1,
    borderColor: tokens.borderDefault,
  },
  pressedPrimary: {
    backgroundColor: tokens.accentDim,
  },
  pressedGhost: {
    backgroundColor: tokens.bgOverlay,
  },
  pressedDestructive: {
    backgroundColor: tokens.errorGhost,
    borderWidth: 1,
    borderColor: tokens.errorBorder,
  },
  pressedSecondary: {
    backgroundColor: tokens.bgOverlay,
    borderColor: tokens.borderStrong,
  },
  disabled: {
    backgroundColor: tokens.bgSurface,
    borderWidth: 1,
    borderColor: tokens.borderSubtle,
  },
  label: {
    fontFamily: tokens.fontMono,
    fontSize: tokens.textBase,
    fontWeight: tokens.weightMedium,
    letterSpacing: 0.3,
  },
}))
