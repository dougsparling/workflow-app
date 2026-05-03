import { Text, View } from 'react-native'
import { useCallback, useEffect, useState } from 'react'
import { deepseekApiKey } from '@workflow/models'
import PrimaryButton from '@design/PrimaryButton/PrimaryButton'
import { createThemedStyles, useThemedStyles, useTheme } from '@design/theme'
import { TextInput } from '@design/TextInput/TextInput'

export default function Settings() {
  const [apiKey, setApiKey] = useState(null as string | null)
  const [saved, setSaved] = useState(false)
  const styles = useThemedStyles(themedStyles)

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
    <View style={styles.container}>
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
    </View>
  )
}

const themedStyles = createThemedStyles((tokens) => ({
  container: {
    flex: 1,
    backgroundColor: tokens.bgBase,
    padding: tokens.space4,
    paddingTop: tokens.space6,
  },
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
}))
