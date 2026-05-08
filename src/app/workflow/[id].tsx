import { useEffect, useRef, useState } from 'react'
import { Pressable, useWindowDimensions, View, Text } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, router } from 'expo-router'
import Carousel, { type ICarouselInstance } from 'react-native-reanimated-carousel'
import type { PanGesture } from 'react-native-gesture-handler'
import { Feather } from '@expo/vector-icons'
import StatusBadge from '@design/StatusBadge/StatusBadge'
import { getStatusColors, type ExecutionStatus } from '@util/status'
import { createThemedStyles, useThemedStyles, useTheme } from '@design/theme'
import type { ThemeTokens } from '@design/theme'
import StepSlide from '@components/StepSlide/StepSlide'
import { useWorkflowStore } from '@store/workflowQueue'
import type { Step } from '@workflow/workflow'
import type { TSchema } from 'typebox'

const PEEK = 24

export default function WorkflowScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const job = useWorkflowStore(s => s.jobs.find(j => j.id === id))
  const { width: screenWidth } = useWindowDimensions()
  const { tokens: t } = useTheme()
  const styles = useThemedStyles(themedStyles)
  const carouselRef = useRef<ICarouselInstance>(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const [detailOpen, setDetailOpen] = useState(false)
  const [isScrolling, setIsScrolling] = useState(false)
  const prevRef = useRef<{ index: number; status: string }>({ index: -1, status: '' })

  const currentStatus = job?.steps[activeIndex]?.status ?? ''

  useEffect(() => {
    if (!job) return
    const prev = prevRef.current
    if (prev.index !== activeIndex) {
      prevRef.current = { index: activeIndex, status: currentStatus }
      return
    }
    if (prev.status === 'running' && currentStatus === 'complete' && !detailOpen) {
      const nextIndex = activeIndex + 1
      if (nextIndex < job.steps.length) {
        setTimeout(() => {
          carouselRef.current?.scrollTo({ index: nextIndex, animated: true })
        }, 600)
      }
    }
    prevRef.current = { index: activeIndex, status: currentStatus }
  }, [currentStatus, activeIndex, detailOpen, job])

  if (!job) return null

  const slideWidth = screenWidth - PEEK * 2

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={8}>
          <Feather name="chevron-left" size={22} color={t.accentBase} />
        </Pressable>
        <Text style={styles.title} numberOfLines={1}>{job.name}</Text>
        <StatusBadge status={job.status} />
      </View>

      {/* Step indicator */}
      <View style={styles.indicator}>
        {job.steps.map((step, i) => (
          <Pressable
            key={i}
            style={[styles.indicatorBar, { backgroundColor: i === activeIndex ? getStatusColors(t, step.status as ExecutionStatus).dot : t.borderStrong }]}
            onPress={() => carouselRef.current?.scrollTo({ index: i, animated: true })}
          />
        ))}
      </View>

      {/* Carousel */}
      <View style={styles.carouselWrapper}>
        <Carousel
          ref={carouselRef}
          data={job.steps}
          width={slideWidth}
          style={{ width: screenWidth }}
          loop={false}
          onSnapToItem={setActiveIndex}
          onScrollStart={() => setIsScrolling(true)}
          onScrollEnd={() => setIsScrolling(false)}
          onConfigurePanGesture={(panGesture: PanGesture) => {
            panGesture.activeOffsetX([-10, 10])
          }}
          renderItem={({ index }) => {
            const step = job.steps[index]
            const stepDef = job.wf.steps[index]
            return (
              <StepSlide
                index={index}
                step={step}
                stepDef={stepDef as Step<TSchema, TSchema>}
                onModalChange={setDetailOpen}
                isScrolling={isScrolling}
              />
            )
          }}
        />

        {/* Left/right affordance arrows */}
        {activeIndex > 0 && (
          <Pressable
            style={[styles.affordance, styles.affordanceLeft]}
            onPress={() => carouselRef.current?.scrollTo({ index: activeIndex - 1, animated: true })}
          >
            <Feather name="chevron-left" size={18} color={t.textMuted} />
          </Pressable>
        )}
        {activeIndex < job.steps.length - 1 && (
          <Pressable
            style={[styles.affordance, styles.affordanceRight]}
            onPress={() => carouselRef.current?.scrollTo({ index: activeIndex + 1, animated: true })}
          >
            <Feather name="chevron-right" size={18} color={t.textMuted} />
          </Pressable>
        )}
      </View>
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
  indicator: {
    flexDirection: 'row' as const,
    gap: tokens.space1,
    paddingHorizontal: tokens.space4,
    paddingVertical: tokens.space2,
  },
  indicatorBar: {
    flex: 1,
    height: 3,
    borderRadius: tokens.radiusXs,
  },
  carouselWrapper: {
    flex: 1,
    position: 'relative' as const,
  },
  affordance: {
    position: 'absolute' as const,
    top: '50%' as unknown as number,
    marginTop: -16,
    width: 32,
    height: 32,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: tokens.bgOverlay,
    borderWidth: 1,
    borderColor: tokens.borderDefault,
    zIndex: 20,
  },
  affordanceLeft: {
    left: 2,
  },
  affordanceRight: {
    right: 2,
  },
}))
