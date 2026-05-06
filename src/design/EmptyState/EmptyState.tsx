import { Text, View } from 'react-native'
import { createThemedStyles, useThemedStyles } from '../theme'

interface Props {
  message: string
}

export default function EmptyState({ message }: Props) {
  const styles = useThemedStyles(themedStyles)
  return (
    <View style={styles.container}>
      <Text style={styles.text}>{message}</Text>
    </View>
  )
}

const themedStyles = createThemedStyles((tokens) => ({
  container: {
    flex: 1,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  text: {
    fontFamily: tokens.fontMono,
    fontSize: tokens.textSm,
    color: tokens.textDisabled,
  },
}))
