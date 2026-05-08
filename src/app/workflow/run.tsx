import { useMemo, useState } from 'react'
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { Feather } from '@expo/vector-icons'
import { Check } from 'typebox/value'
import type { TSchema } from 'typebox'
import Button from '@design/Button/Button'
import MultiToggle from '@design/MultiToggle/MultiToggle'
import SectionLabel from '@design/SectionLabel/SectionLabel'
import TextInput from '@design/TextInput/TextInput'
import { createThemedStyles, useThemedStyles, useTheme } from '@design/theme'
import type { ThemeTokens } from '@design/theme'
import { useWorkflowStore } from '@store/workflowQueue'
import { workflowRegistry } from '@workflow/registry'

type FieldSchema = { type?: string; description?: string }

function getProperties(schema: TSchema | undefined): Record<string, FieldSchema> | null {
  if (!schema) return null
  const s = schema as Record<string, unknown>
  if (s.type !== 'object' || typeof s.properties !== 'object' || !s.properties) return null
  return s.properties as Record<string, FieldSchema>
}

function coerceInput(properties: Record<string, FieldSchema>, values: Record<string, string>): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  for (const [key, schema] of Object.entries(properties)) {
    const raw = values[key] ?? ''
    if (schema.type === 'number' || schema.type === 'integer') {
      const n = Number(raw)
      result[key] = isNaN(n) ? raw : n
    } else {
      result[key] = raw
    }
  }
  return result
}

const workflowOptions = workflowRegistry.map(e => ({ label: e.label, value: e.id }))

export default function RunWorkflow() {
  const enqueue = useWorkflowStore(s => s.enqueueWorkflow)
  const styles = useThemedStyles(themedStyles)
  const { tokens: t } = useTheme()

  const [selectedId, setSelectedId] = useState(workflowRegistry[0]?.id ?? '')
  const [formValues, setFormValues] = useState<Record<string, string>>({})

  const selected = workflowRegistry.find(w => w.id === selectedId)
  const inputSchema = selected?.workflow.steps[0]?.input
  const properties = useMemo(() => getProperties(inputSchema), [inputSchema])

  const coerced = useMemo(
    () => (properties ? coerceInput(properties, formValues) : null),
    [properties, formValues],
  )

  const isValid = useMemo(() => {
    if (!selected) return false
    if (!properties || !inputSchema) return true
    if (!coerced) return false
    return Check(inputSchema, coerced)
  }, [selected, properties, inputSchema, coerced])

  const setField = (key: string, value: string) =>
    setFormValues(prev => ({ ...prev, [key]: value }))

  const launch = () => {
    if (!selected || !isValid) return
    enqueue(selected.label, selected.workflow, coerced ?? undefined)
    router.back()
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={8}>
          <Feather name="chevron-left" size={22} color={t.accentBase} />
        </Pressable>
        <Text style={styles.title}>Run Workflow</Text>
      </View>

      <KeyboardAvoidingView
        style={styles.body}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <SectionLabel>Workflow</SectionLabel>
          <MultiToggle
            options={workflowOptions}
            value={selectedId}
            onChange={(id) => {
              setSelectedId(id)
              setFormValues({})
            }}
            direction="vertical"
          />

          {properties && Object.keys(properties).length > 0 ? (
            <>
              <SectionLabel>Inputs</SectionLabel>
              {Object.entries(properties).map(([key, schema]) => (
                <TextInput
                  key={key}
                  label={key}
                  value={formValues[key] ?? ''}
                  onChangeText={v => setField(key, v)}
                  keyboardType={
                    schema.type === 'number' || schema.type === 'integer' ? 'numeric' : 'default'
                  }
                  placeholder={schema.description ?? ''}
                  autoCapitalize="sentences"
                  autoCorrect={false}
                />
              ))}
            </>
          ) : selected ? (
            <Text style={styles.noInputs}>No inputs required.</Text>
          ) : null}
        </ScrollView>

        <View style={styles.footer}>
          <Button label="Launch" onPress={launch} disabled={!isValid} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const themedStyles = createThemedStyles((tokens: ThemeTokens) => ({
  container: {
    flex: 1,
    backgroundColor: tokens.bgBase,
  },
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: tokens.space2,
    paddingHorizontal: tokens.space4,
    paddingVertical: tokens.space3,
    borderBottomWidth: 1,
    borderBottomColor: tokens.borderSubtle,
  },
  backButton: {
    flexShrink: 0,
  },
  title: {
    fontFamily: tokens.fontMono,
    fontSize: tokens.textLg,
    fontWeight: tokens.weightSemibold,
    color: tokens.textPrimary,
    flex: 1,
    letterSpacing: tokens.trackingTight,
  },
  body: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: tokens.space4,
    paddingBottom: tokens.space4,
    gap: tokens.space2,
  },
  noInputs: {
    fontFamily: tokens.fontSans,
    fontSize: tokens.textSm,
    color: tokens.textMuted,
    marginTop: tokens.space2,
  },
  footer: {
    paddingHorizontal: tokens.space4,
    paddingTop: tokens.space3,
    paddingBottom: tokens.space4,
    borderTopWidth: 1,
    borderTopColor: tokens.borderSubtle,
  },
}))
