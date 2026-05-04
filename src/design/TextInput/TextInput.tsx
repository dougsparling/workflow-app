// components/TextInput/TextInput.tsx
import React from 'react'
import {
  View,
  Text,
  TextInput as RNTextInput,
} from 'react-native'
import type { TextInputProps as RNTextInputProps } from 'react-native'
import { createThemedStyles, useThemedStyles, useTheme } from '../theme'
import type { ThemeTokens } from '../theme'

export interface TextInputProps extends Pick<RNTextInputProps,
  | 'value'
  | 'onChangeText'
  | 'placeholder'
  | 'keyboardType'
  | 'autoCapitalize'
  | 'autoCorrect'
  | 'secureTextEntry'
  | 'multiline'
  | 'numberOfLines'
  | 'onFocus'
  | 'onBlur'
  | 'testID'
> {
  label?: string
  hint?: string
  error?: string
  disabled?: boolean
}

export function TextInput({
  label,
  hint,
  error,
  disabled = false,
  ...inputProps
}: TextInputProps) {
  const styles = useThemedStyles(themedStyles)
  const { tokens } = useTheme()
  const hasError = Boolean(error)

  return (
    <View style={styles.wrapper}>
      {label ? (
        <Text style={[styles.label, disabled && styles.labelDisabled]}>
          {label}
        </Text>
      ) : null}

      <RNTextInput
        {...inputProps}
        placeholderTextColor={disabled ? tokens.textDisabled : tokens.textMuted}
        editable={!disabled}
        autoCapitalize={inputProps.autoCapitalize ?? 'none'}
        autoCorrect={inputProps.autoCorrect ?? false}
        style={[
          styles.input,
          hasError   && styles.inputError,
          disabled   && styles.inputDisabled,
        ]}
      />

      {(error || hint) ? (
        <Text style={[styles.hint, hasError && styles.hintError]}>
          {error ?? hint}
        </Text>
      ) : null}
    </View>
  )
}

const themedStyles = createThemedStyles((tokens: ThemeTokens) => ({
  wrapper: {
    gap: tokens.space1,
  },
  label: {
    fontFamily: tokens.fontMono,
    fontSize: tokens.textXs,
    fontWeight: tokens.weightMedium,
    color: tokens.textMuted,
    textTransform: 'uppercase' as const,
    letterSpacing: tokens.trackingWide,
  },
  labelDisabled: {
    color: tokens.textDisabled,
  },
  input: {
    fontFamily: tokens.fontSans,
    fontSize: tokens.textBase,
    fontWeight: tokens.weightRegular,
    color: tokens.textPrimary,
    backgroundColor: tokens.bgSurface,
    borderWidth: tokens.borderWidthDefault,
    borderColor: tokens.borderDefault,
    minHeight: tokens.touchTargetSm,
    paddingHorizontal: tokens.space3,
    paddingVertical: tokens.space2,
    includeFontPadding: false,
    textAlignVertical: 'top' as const,
  },
  inputError: {
    borderColor: tokens.errorBase,
  },
  inputDisabled: {
    color: tokens.textDisabled,
    borderColor: tokens.borderSubtle,
    backgroundColor: tokens.bgBase,
  },
  hint: {
    fontFamily: tokens.fontSans,
    fontSize: tokens.textSm,
    color: tokens.textMuted,
  },
  hintError: {
    color: tokens.errorBright,
  },
}))
