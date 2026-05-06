import { Redirect } from 'expo-router'
import { polyfillWebCrypto } from 'expo-standard-web-crypto'

// required from running langchain from RN
polyfillWebCrypto()

export default function Index() {
  return <Redirect href="/executions" />
}
