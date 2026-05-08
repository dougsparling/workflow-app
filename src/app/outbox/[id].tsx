import { ScrollView, Text, TouchableOpacity, View } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { Feather } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Markdown from 'react-native-markdown-display'
import Background from '@design/Background/Background'
import { createThemedStyles, useThemedStyles, useTheme } from '@design/theme'
import type { ThemeTokens } from '@design/theme'
import { useOutboxStore } from '@store/outboxStore'

export default function OutboxDetail() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const doc = useOutboxStore((s) => s.documents.find((d) => d.id === id))
  const remove = useOutboxStore((s) => s.remove)
  const styles = useThemedStyles(themedStyles)
  const { tokens } = useTheme()
  const insets = useSafeAreaInsets()

  if (!doc) {
    return (
      <Background>
        <Text style={styles.missing}>Document not found.</Text>
      </Background>
    )
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Feather name="arrow-left" size={22} />
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>
          {doc.title}
        </Text>
        <TouchableOpacity onPress={() => { remove(doc.id); router.back() }} style={styles.deleteButton}>
          <Feather name="trash-2" size={18} />
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <Markdown style={makeMarkdownStyles(tokens)}>{doc.content}</Markdown>
      </ScrollView>
    </View>
  )
}

function makeMarkdownStyles(tokens: ThemeTokens) {
  return {
    body: {
      fontFamily: tokens.fontMono,
      fontSize: tokens.textBase,
      lineHeight: 22,
      color: tokens.textSecondary,
    },
    heading1: {
      flexDirection: 'column' as const,
      fontFamily: tokens.fontMono,
      fontSize: tokens.text2xl,
      fontWeight: tokens.weightBold,
      color: tokens.textPrimary,
      marginBottom: tokens.space3,
    },
    heading2: {
      flexDirection: 'column' as const,
      fontFamily: tokens.fontMono,
      fontSize: tokens.textXl,
      fontWeight: tokens.weightSemibold,
      color: tokens.textPrimary,
      marginBottom: tokens.space2,
      marginTop: tokens.space3,
    },
    heading3: {
      flexDirection: 'column' as const,
      fontFamily: tokens.fontMono,
      fontSize: tokens.textLg,
      fontWeight: tokens.weightSemibold,
      color: tokens.textPrimary,
      marginBottom: tokens.space1,
      marginTop: tokens.space2,
    },
    paragraph: {
      fontFamily: tokens.fontMono,
      fontSize: tokens.textBase,
      lineHeight: 22,
      color: tokens.textSecondary,
      marginBottom: tokens.space2,
    },
    strong: {
      fontWeight: tokens.weightBold,
      color: tokens.textPrimary,
    },
    em: {
      fontStyle: 'italic' as const,
      color: tokens.textPrimary,
    },
    list_item: {
      flexDirection: 'row' as const,
      fontFamily: tokens.fontMono,
      fontSize: tokens.textBase,
      lineHeight: 22,
      color: tokens.textSecondary,
      marginBottom: tokens.space1,
    },
    blockquote: {
      borderLeftWidth: 3,
      borderLeftColor: tokens.accentBase,
      paddingLeft: tokens.space3,
      marginVertical: tokens.space2,
      backgroundColor: tokens.accentGhost,
      paddingVertical: tokens.space1,
    },
    code_inline: {
      fontFamily: tokens.fontMono,
      backgroundColor: tokens.bgElevated,
      paddingHorizontal: tokens.space1,
      borderRadius: tokens.radiusSm,
      color: tokens.accentBright,
    },
    fence: {
      fontFamily: tokens.fontMono,
      backgroundColor: tokens.bgElevated,
      padding: tokens.space3,
      borderRadius: tokens.radiusSm,
      marginVertical: tokens.space2,
      color: tokens.textSecondary,
    },
  }
}

const themedStyles = createThemedStyles((tokens: ThemeTokens) => ({
  container: {
    flex: 1,
    backgroundColor: tokens.bgBase,
  },
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: tokens.space3,
    paddingHorizontal: tokens.space4,
    paddingVertical: tokens.space3,
    borderBottomWidth: 1,
    borderBottomColor: tokens.borderSubtle,
    backgroundColor: tokens.bgSurface,
  },
  backButton: {
    padding: tokens.space1,
  },
  deleteButton: {
    padding: tokens.space1,
  },
  title: {
    flex: 1,
    fontFamily: tokens.fontMono,
    fontSize: tokens.textLg,
    fontWeight: tokens.weightSemibold,
    color: tokens.textPrimary,
  },
  content: {
    padding: tokens.space4,
    paddingBottom: tokens.space8,
  },
  missing: {
    fontFamily: tokens.fontMono,
    fontSize: tokens.textBase,
    color: tokens.textDisabled,
    textAlign: 'center' as const,
    marginTop: tokens.space12,
  },
}))
