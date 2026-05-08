import { type ReactNode, useEffect, useRef } from 'react'
import { Animated, Modal, Pressable, StyleSheet, TouchableOpacity, View } from 'react-native'
import { Feather } from '@expo/vector-icons'
import { createThemedStyles, useTheme, useThemedStyles } from '../theme'
import type { ThemeTokens } from '../theme'

type Props = {
  visible: boolean
  onDismiss: () => void
  children: ReactNode
}

export default function BottomSheet({ visible, onDismiss, children }: Props) {
  const styles = useThemedStyles(themedStyles)
  const { tokens } = useTheme()
  const backdropOpacity = useRef(new Animated.Value(0)).current
  const sheetTranslateY = useRef(new Animated.Value(300)).current

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(backdropOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.timing(sheetTranslateY, { toValue: 0, duration: 250, useNativeDriver: true }),
      ]).start()
    } else {
      backdropOpacity.setValue(0)
      sheetTranslateY.setValue(300)
    }
  }, [visible, backdropOpacity, sheetTranslateY])

  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(backdropOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(sheetTranslateY, { toValue: 300, duration: 200, useNativeDriver: true }),
    ]).start(() => onDismiss())
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleDismiss}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
          <Pressable style={{ flex: 1 }} onPress={handleDismiss} />
        </Animated.View>
        <Animated.View style={[styles.sheet, { transform: [{ translateY: sheetTranslateY }] }]}>
          <TouchableOpacity style={styles.closeButton} onPress={handleDismiss} hitSlop={12}>
            <Feather name="x" size={20} color={tokens.textMuted} />
          </TouchableOpacity>
          {children}
        </Animated.View>
      </View>
    </Modal>
  )
}

const themedStyles = createThemedStyles((tokens: ThemeTokens) => ({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    flex: 1,
    maxHeight: '90%',
    backgroundColor: tokens.bgBase,
    padding: tokens.space4,
    paddingTop: tokens.space6,
    borderTopLeftRadius: tokens.space4,
    borderTopRightRadius: tokens.space4,
  },
  closeButton: {
    position: 'absolute',
    top: tokens.space3,
    right: tokens.space3,
    zIndex: 1,
  },
}))
