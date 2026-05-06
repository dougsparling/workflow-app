import { Pressable, Text, View } from 'react-native'
import { createThemedStyles, useThemedStyles } from '../theme'
import type { ThemeTokens } from '../theme'

interface Option<T extends string> {
  label: string
  value: T
}

interface Props<T extends string> {
  options: Option<T>[]
  value: T
  onChange: (value: T) => void
}

export default function MultiToggle<T extends string>({ options, value, onChange }: Props<T>) {
  const styles = useThemedStyles(themedStyles)
  return (
    <View style={styles.row}>
      {options.map((opt) => (
        <Pressable
          key={opt.value}
          style={[styles.segment, value === opt.value && styles.segmentActive]}
          onPress={() => onChange(opt.value)}
        >
          <Text style={[styles.label, value === opt.value && styles.labelActive]}>
            {opt.label}
          </Text>
        </Pressable>
      ))}
    </View>
  )
}

const themedStyles = createThemedStyles((tokens: ThemeTokens) => ({
  row: {
    flexDirection: 'row' as const,
    borderRadius: tokens.radiusSm,
    borderWidth: tokens.borderWidthDefault,
    borderColor: tokens.borderDefault,
    overflow: 'hidden' as const,
  },
  segment: {
    flex: 1,
    alignItems: 'center' as const,
    paddingVertical: tokens.space3,
  },
  segmentActive: {
    backgroundColor: tokens.accentBase,
  },
  label: {
    fontSize: tokens.textBase,
    color: tokens.textSecondary,
    fontWeight: tokens.weightMedium,
  },
  labelActive: {
    color: tokens.textInverse,
  },
}))
