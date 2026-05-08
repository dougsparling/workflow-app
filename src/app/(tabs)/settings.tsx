import { Text, View } from 'react-native'
import { useEffect, useState } from 'react'
import { deepseekApiKey, anthropicApiKey, type ApiKeyStorage } from '@workflow/models'
import { createThemedStyles, useTheme, useThemedStyles } from '@design/theme'
import type { ThemePreference } from '@design/theme'
import TextInput from '@design/TextInput/TextInput'
import Background from '@design/Background/Background'
import SectionLabel from '@design/SectionLabel/SectionLabel'
import MultiToggle from '@design/MultiToggle/MultiToggle'

const DEEPSEEK_KEY_REGEX = /^sk-[a-f0-9]{32}$/
const ANTHROPIC_KEY_REGEX = /^sk-ant-.{32}/

const THEME_OPTIONS: { label: string; value: ThemePreference }[] = [
  { label: 'Light', value: 'light' },
  { label: 'Dark', value: 'dark' },
  { label: 'System', value: 'system' },
]

export default function Settings() {
  const styles = useThemedStyles(themedStyles)
  const { themePreference, setThemePreference } = useTheme()

  const deepseek = useApiKeyField(deepseekApiKey, DEEPSEEK_KEY_REGEX)
  const anthropic = useApiKeyField(anthropicApiKey, ANTHROPIC_KEY_REGEX)

  return (
    <Background>
      <View style={styles.section}>
        <SectionLabel>DeepSeek API Key</SectionLabel>
        <View style={styles.inputGroup}>
          <TextInput
            value={deepseek.value ?? ''}
            onChangeText={deepseek.setValue}
            placeholder="sk-..."
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
          />
          {deepseek.statusLabel && (
            <Text style={[styles.status, deepseek.validity === 'invalid' ? styles.statusError : styles.statusOk]}>
              {deepseek.statusLabel}
            </Text>
          )}
        </View>
      </View>
      <View style={styles.divider} />
      <View style={styles.section}>
        <SectionLabel>Anthropic API Key</SectionLabel>
        <View style={styles.inputGroup}>
          <TextInput
            value={anthropic.value ?? ''}
            onChangeText={anthropic.setValue}
            placeholder="sk-ant-..."
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
          />
          {anthropic.statusLabel && (
            <Text style={[styles.status, anthropic.validity === 'invalid' ? styles.statusError : styles.statusOk]}>
              {anthropic.statusLabel}
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

function useApiKeyField(keyStorage: ApiKeyStorage, regex: RegExp) {
  const [value, setValue] = useState(null as string | null)
  const trimmed = value?.trim() ?? ''
  const validity: 'empty' | 'invalid' | 'valid' =
    !trimmed ? 'empty' : regex.test(trimmed) ? 'valid' : 'invalid'

  useEffect(() => { keyStorage.get().then(setValue) }, [keyStorage])
  useEffect(() => {
    if (validity === 'valid') keyStorage.set(trimmed)
  }, [validity, trimmed, keyStorage])

  const statusLabel =
    validity === 'empty' ? null :
    validity === 'invalid' ? 'INVALID' :
    'SAVED'

  return { value, setValue, validity, statusLabel }
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
