// components/PrimaryButton/PrimaryButton.tsx
import React, { useState } from 'react'
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
  variant?: 'primary' | 'ghost' | 'destructive'
  disabled?: boolean
}

export default function PrimaryButton({
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
    t.bgBase

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
        pressed && variant === 'primary'     && styles.pressedPrimary,
        pressed && variant === 'ghost'       && styles.pressedGhost,
        pressed && variant === 'destructive' && styles.pressedDestructive,
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
    alignSelf: 'flex-start' as const,
    borderRadius: tokens.radiusNone,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: tokens.space1 + 2,
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
  disabled: {
    backgroundColor: tokens.bgSurface,
    borderWidth: 1,
    borderColor: tokens.borderSubtle,
  },
  label: {
    fontFamily: tokens.fontMono,
    fontSize: tokens.textBase - 1,
    fontWeight: tokens.weightMedium,
    letterSpacing: 0.3,
  },
}))
