import type { ReactNode } from 'react'
import { View } from 'react-native'
import { createThemedStyles, useThemedStyles } from '../theme'

interface Props {
  children: ReactNode
}

export default function Background({ children }: Props) {
  const styles = useThemedStyles(themedStyles)
  return <View style={styles.container}>{children}</View>
}

const themedStyles = createThemedStyles((tokens) => ({
  container: {
    flex: 1,
    backgroundColor: tokens.bgBase,
    padding: tokens.space4,
    paddingTop: tokens.space6,
  },
}))
