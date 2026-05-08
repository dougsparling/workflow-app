import { View, Text } from 'react-native'
import { type TSchema } from 'typebox'
import { createThemedStyles, useThemedStyles } from '@design/theme'
import type { ThemeTokens } from '@design/theme'
import SectionLabel from '@design/SectionLabel/SectionLabel'

type Props = {
  label: string
  schema: TSchema
  data?: Record<string, unknown>
}

function formatValue(v: unknown): string {
  if (v === undefined || v === null) return '—'
  if (typeof v === 'object') return JSON.stringify(v)
  return String(v)
}

export default function RecordList({ label, schema, data }: Props) {
  const styles = useThemedStyles(themedStyles)
  const properties = (schema as { properties?: Record<string, unknown> }).properties ?? {}
  const keys = Object.keys(properties)

  return (
    <View>
      <SectionLabel>{label}</SectionLabel>
      {keys.map(key => (
        <View key={key} style={styles.row}>
          <Text style={styles.key}>{key}</Text>
          <Text style={styles.value} numberOfLines={1}>{formatValue(data?.[key])}</Text>
        </View>
      ))}
    </View>
  )
}

const themedStyles = createThemedStyles((tokens: ThemeTokens) => ({
  row: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: tokens.space4,
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: tokens.borderSubtle,
  },
  key: {
    fontFamily: tokens.fontMono,
    fontSize: tokens.textSm,
    color: tokens.textMuted,
  },
  value: {
    fontFamily: tokens.fontMono,
    fontSize: tokens.textSm,
    color: tokens.textPrimary,
    flex: 1,
    textAlign: 'right' as const,
    marginLeft: tokens.space4,
  },
}))
