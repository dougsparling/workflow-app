import { Text, View } from 'react-native'
import { useEffect, useState } from 'react'
import { deepseekApiKey } from '@workflow/models'
import { createThemedStyles, useTheme, useThemedStyles } from '@design/theme'
import type { ThemePreference } from '@design/theme'
import { TextInput } from '@design/TextInput/TextInput'
import Background from '@design/Background/Background'
import SectionLabel from '@design/SectionLabel/SectionLabel'
import MultiToggle from '@design/MultiToggle/MultiToggle'

const KEY_REGEX = /^sk-[a-f0-9]{32}$/

const THEME_OPTIONS: { label: string; value: ThemePreference }[] = [
  { label: 'Light', value: 'light' },
  { label: 'Dark', value: 'dark' },
  { label: 'System', value: 'system' },
]

export default function Settings() {
  const [apiKey, setApiKey] = useState(null as string | null)
  const styles = useThemedStyles(themedStyles)
  const { themePreference, setThemePreference } = useTheme()

  const trimmed = apiKey?.trim() ?? ''
  const validity: 'empty' | 'invalid' | 'valid' =
    !trimmed ? 'empty' : KEY_REGEX.test(trimmed) ? 'valid' : 'invalid'

  useEffect(() => {
    deepseekApiKey.get().then(setApiKey)
  }, [])

  useEffect(() => {
    if (validity === 'valid') {
      deepseekApiKey.set(trimmed)
    }
  }, [validity, trimmed])

  const statusLabel =
    validity === 'empty' ? null :
    validity === 'invalid' ? 'INVALID' :
    'SAVED'

  return (
    <Background>
      <View style={styles.section}>
        <SectionLabel>DeepSeek API Key</SectionLabel>
        <View style={styles.inputGroup}>
          <TextInput
            value={apiKey ?? ''}
            onChangeText={setApiKey}
            placeholder="sk-..."
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
          />
          {statusLabel && (
            <Text style={[styles.status, validity === 'invalid' ? styles.statusError : styles.statusOk]}>
              {statusLabel}
            </Text>
          )}
        </View>
      </View>
      <View style={styles.divider} />
      <View style={styles.section}>
        <SectionLabel>Theme</SectionLabel>
        <MultiToggle
          options={THEME_OPTIONS}
          value={themePreference}
          onChange={setThemePreference}
        />
      </View>
    </Background>
  )
}

const themedStyles = createThemedStyles((tokens) => ({
  section: {
    gap: tokens.space3,
  },
  inputGroup: {
    gap: tokens.space1,
  },
  divider: {
    height: 1,
    backgroundColor: tokens.borderDefault,
    marginVertical: tokens.space6,
  },
  status: {
    fontFamily: tokens.fontMono,
    fontSize: tokens.textSm,
    fontWeight: tokens.weightMedium,
  },
  statusError: {
    color: tokens.errorBase,
  },
  statusOk: {
    color: tokens.statusComplete,
  },
}))
