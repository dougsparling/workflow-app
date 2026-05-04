import { Pressable, Text, View } from 'react-native'
import { useCallback, useEffect, useState } from 'react'
import { deepseekApiKey } from '@workflow/models'
import PrimaryButton from '@design/PrimaryButton/PrimaryButton'
import {
  createThemedStyles,
  useTheme,
  useThemedStyles,
} from '@design/theme'
import type { ThemePreference } from '@design/theme'
import { TextInput } from '@design/TextInput/TextInput'
import Background from '@design/Background/Background'

const THEME_OPTIONS: { label: string; value: ThemePreference }[] = [
  { label: 'Light', value: 'light' },
  { label: 'Dark', value: 'dark' },
  { label: 'System', value: 'system' },
]

export default function Settings() {
  const [apiKey, setApiKey] = useState(null as string | null)
  const [saved, setSaved] = useState(false)
  const styles = useThemedStyles(themedStyles)
  const { themePreference, setThemePreference } = useTheme()

  const handleSave = useCallback(async () => {
    const key = apiKey?.trim() 
    if (!key) return
    try {
      await deepseekApiKey.set(key)
      setSaved(true)
    } catch (e) {
      console.log("failed to save DeepSeek API key", e)
    }
  }, [apiKey])

  useEffect(() => {
    deepseekApiKey.get().then(setApiKey)
  }, [])

  return (
    <Background>
      <View style={styles.section}>
        <Text style={styles.label}>DeepSeek API Key</Text>
        <TextInput
          value={apiKey ?? ''}
          onChangeText={(text) => { setApiKey(text); setSaved(false) }}
          placeholder="sk-..."
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
        />
        <PrimaryButton
          label={saved ? 'Saved' : 'Save'}
          icon={saved ? 'check' : undefined}
          onPress={handleSave}
          disabled={!apiKey?.trim() || saved}
        />
      </View>
      <View style={styles.section}>
        <Text style={styles.label}>Theme</Text>
        <View style={styles.segmentRow}>
          {THEME_OPTIONS.map(({ label, value }) => (
            <Pressable
              key={value}
              style={[
                styles.segment,
                themePreference === value && styles.segmentActive,
              ]}
              onPress={() => setThemePreference(value)}
            >
              <Text
                style={[
                  styles.segmentLabel,
                  themePreference === value && styles.segmentLabelActive,
                ]}
              >
                {label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
    </Background>
  )
}

const themedStyles = createThemedStyles((tokens) => ({
  section: {
    gap: tokens.space3,
  },
  label: {
    fontFamily: tokens.fontMono,
    fontSize: tokens.textSm,
    fontWeight: tokens.weightMedium,
    color: tokens.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: tokens.trackingWide,
  },
  segmentRow: {
    flexDirection: 'row',
    borderRadius: tokens.radiusSm,
    borderWidth: tokens.borderWidthDefault,
    borderColor: tokens.borderDefault,
    overflow: 'hidden',
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: tokens.space3,
  },
  segmentActive: {
    backgroundColor: tokens.accentBase,
  },
  segmentLabel: {
    fontSize: tokens.textBase,
    color: tokens.textSecondary,
    fontWeight: tokens.weightMedium,
  },
  segmentLabelActive: {
    color: tokens.textInverse,
  },
}))
