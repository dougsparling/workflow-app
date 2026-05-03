import { Tabs } from 'expo-router'
import { Feather } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTheme } from '@design/theme'

export default function TabLayout() {
  const { tokens: t } = useTheme()
  const insets = useSafeAreaInsets()

  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor: t.bgSurface,
          borderTopColor: t.borderDefault,
          borderTopWidth: 1,
          height: 56 + insets.bottom,
        },
        tabBarActiveTintColor: t.accentBase,
        tabBarInactiveTintColor: t.textDisabled,
        tabBarLabelStyle: {
          fontFamily: t.fontMono,
          fontSize: t.textXs,
          letterSpacing: t.trackingWide,
        },
      }}
    >
      <Tabs.Screen
        name="executions"
        options={{
          title: 'executions',
          tabBarIcon: ({ color, size }) => (
            <Feather name="play-circle" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="workflows"
        options={{
          title: 'workflows',
          tabBarIcon: ({ color, size }) => (
            <Feather name="git-branch" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'settings',
          tabBarIcon: ({ color, size }) => (
            <Feather name="settings" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  )
}
