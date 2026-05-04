// components/SecondaryButton/SecondaryButton.tsx
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
  disabled?: boolean
}

export default function SecondaryButton({ label, icon, onPress, disabled = false }: Props) {
  const [pressed, setPressed] = useState(false)
  const styles = useThemedStyles(themedStyles)
  const { tokens: t } = useTheme()

  const color = disabled ? t.textDisabled : t.textPrimary

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      style={[
        styles.base,
        pressed && styles.pressed,
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
    backgroundColor: tokens.bgSurface,
    borderWidth: 1,
    borderColor: tokens.borderDefault,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: tokens.space1 + 2,
    paddingHorizontal: tokens.space5,
  },
  pressed: {
    backgroundColor: tokens.bgOverlay,
    borderColor: tokens.borderStrong,
  },
  disabled: {
    borderColor: tokens.borderSubtle,
  },
  label: {
    fontFamily: tokens.fontMono,
    fontSize: tokens.textBase - 1,
    fontWeight: tokens.weightMedium,
    letterSpacing: 0.3,
  },
}))
