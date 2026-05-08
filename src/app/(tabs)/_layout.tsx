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
        headerStyle: {
          backgroundColor: t.bgSurface,
          borderBottomWidth: 1,
          borderBottomColor: t.borderSubtle,
        },
        headerShadowVisible: false,
        headerTitleStyle: {
          fontFamily: t.fontMono,
          fontSize: t.text2xl,
          fontWeight: t.weightSemibold,
          color: t.textPrimary,
          letterSpacing: t.trackingTight,
        },
        headerTintColor: t.textPrimary,
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
        name="outbox"
        options={{
          title: 'outbox',
          tabBarIcon: ({ color, size }) => (
            <Feather name="mail" size={size} color={color} />
          ),
        }}
      />
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
        name="agents"
        options={{
          title: 'agents',
          tabBarIcon: ({ color, size }) => (
            <Feather name="cpu" size={size} color={color} />
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
