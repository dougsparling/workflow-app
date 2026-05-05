import { Text, View } from 'react-native'
import Background from '@design/Background/Background'
import { createThemedStyles, useThemedStyles } from '@design/theme'
import type { ThemeTokens } from '@design/theme'

export default function Workflows() {
  const styles = useThemedStyles(themedStyles)
  return (
    <Background>
      <View style={styles.empty}>
        <Text style={styles.emptyText}>Coming soon!</Text>
      </View>
    </Background>
  )
}

const themedStyles = createThemedStyles((tokens: ThemeTokens) => ({
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontFamily: tokens.fontMono,
    fontSize: tokens.textSm,
    color: tokens.textDisabled,
  },
}))
