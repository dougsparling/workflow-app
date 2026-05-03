import { useFonts } from 'expo-font'
import * as SplashScreen from 'expo-splash-screen'
import { useEffect, type ReactNode } from 'react'

SplashScreen.preventAutoHideAsync()

export function AssetLoader({ children }: { children: ReactNode }) {
  const [loaded] = useFonts({
    JetBrainsMono: require('../../assets/fonts/JetBrainsMono-Regular.ttf'),
  })

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync()
    }
  }, [loaded])

  if (!loaded) {
    return null
  }

  return children
}
