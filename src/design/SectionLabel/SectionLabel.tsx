import { View, Text } from 'react-native'
import { createThemedStyles, useThemedStyles } from '../theme'
import type { ThemeTokens } from '../theme'

type Props = {
  children: string
}

export default function SectionLabel({ children }: Props) {
  const styles = useThemedStyles(themedStyles)
  return (
    <View style={styles.container}>
      <Text style={styles.text}>{children.toUpperCase()}</Text>
    </View>
  )
}

const themedStyles = createThemedStyles((tokens: ThemeTokens) => ({
  container: {
    paddingTop: tokens.space2,
    paddingBottom: tokens.space1,
  },
  text: {
    fontFamily: tokens.fontMono,
    fontSize: tokens.textXs,
    fontWeight: tokens.weightMedium,
    color: tokens.textDisabled,
    letterSpacing: tokens.trackingWidest,
  },
}))
