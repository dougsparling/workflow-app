// components/SectionLabel/SectionLabel.tsx
import React from 'react'
import { View, Text } from 'react-native'
import { createThemedStyles, useThemedStyles } from '../theme'
import type { ThemeTokens } from '../theme'

interface Props {
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
    paddingHorizontal: tokens.space4,
    paddingTop: tokens.space2 + 2,
    paddingBottom: tokens.space1 + 2,
  },
  text: {
    fontFamily: tokens.fontMono,
    fontSize: tokens.textXs - 1,
    fontWeight: tokens.weightMedium,
    color: tokens.textDisabled,
    letterSpacing: tokens.trackingWidest,
  },
}))
