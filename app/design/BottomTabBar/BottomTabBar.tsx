// components/BottomTabBar/BottomTabBar.tsx
import React from 'react'
import { View, Text, Pressable } from 'react-native'
import Feather from '@expo/vector-icons/Feather'
import type { ComponentProps } from 'react'
import { createThemedStyles, useThemedStyles, useTheme, type ThemeTokens } from '../theme'

type FeatherName = ComponentProps<typeof Feather>['name']

export interface TabConfig {
  id: string
  label: string
  icon: FeatherName
}

interface Props {
  tabs: TabConfig[]
  activeTab: string
  onTabPress: (id: string) => void
}

export default function BottomTabBar({ tabs, activeTab, onTabPress }: Props) {
  const { tokens: t } = useTheme()
  const styles = useThemedStyles(themedStyles)

  return (
    <View style={styles.container}>
      {tabs.map(tab => {
        const isActive = activeTab === tab.id
        return (
          <Pressable
            key={tab.id}
            onPress={() => onTabPress(tab.id)}
            style={[styles.tab, isActive && styles.tabActive]}
          >
            <Feather
              name={tab.icon}
              size={20}
              color={isActive ? t.accentBase : t.textDisabled}
            />
            <Text style={[styles.label, isActive && styles.labelActive]}>
              {tab.label}
            </Text>
          </Pressable>
        )
      })}
    </View>
  )
}

// Default tab config for the Mobile Workflows app
export const MW_TABS: TabConfig[] = [
  { id: 'executions', label: 'executions', icon: 'activity' },
  { id: 'workflows',  label: 'workflows',  icon: 'git-branch' },
]

const themedStyles = createThemedStyles((tokens: ThemeTokens) => ({
  container: {
    flexDirection: 'row' as const,
    backgroundColor: tokens.bgSurface,
    borderTopWidth: 1,
    borderTopColor: tokens.borderDefault,
    height: 56,
  },
  tab: {
    flex: 1,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 3,
    borderTopWidth: 2,
    borderTopColor: 'transparent',
  },
  tabActive: {
    borderTopColor: tokens.accentBase,
  },
  label: {
    fontFamily: tokens.fontMono,
    fontSize: tokens.textXs - 1,
    letterSpacing: tokens.trackingWide,
    color: tokens.textMuted,
  },
  labelActive: {
    color: tokens.accentBase,
  },
}))
