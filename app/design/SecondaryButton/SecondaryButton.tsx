// components/SecondaryButton/SecondaryButton.tsx
import React from 'react'
import { Pressable, Text, View } from 'react-native'
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
  const styles = useThemedStyles(themedStyles)
  const { tokens: t } = useTheme()

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      {({ pressed }) => {
        const color = disabled ? t.textDisabled : pressed ? t.textPrimary : t.textPrimary
        return (
          <View style={[styles.inner, pressed && styles.innerPressed]}>
            {icon ? <Feather name={icon} size={14} color={color} /> : null}
            <Text style={[styles.label, { color }]}>{label}</Text>
          </View>
        )
      }}
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
  },
  pressed: {
    backgroundColor: tokens.bgOverlay,
    borderColor: tokens.borderStrong,
  },
  disabled: {
    borderColor: tokens.borderSubtle,
  },
  inner: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: tokens.space1 + 2,
    paddingHorizontal: tokens.space5,
  },
  innerPressed: {},
  label: {
    fontFamily: tokens.fontMono,
    fontSize: tokens.textBase - 1,
    fontWeight: tokens.weightMedium,
    letterSpacing: 0.3,
  },
}))
