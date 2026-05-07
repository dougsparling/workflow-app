import { useState } from 'react'
import { FlatList, Pressable, View } from 'react-native'
import Background from '@design/Background/Background'
import BottomSheet from '@design/BottomSheet/BottomSheet'
import Button from '@design/Button/Button'
import EmptyState from '@design/EmptyState/EmptyState'
import ActionRow from '@design/ActionRow/ActionRow'
import { createThemedStyles, useThemedStyles } from '@design/theme'
import type { ThemeTokens } from '@design/theme'
import WorkflowDetail from '@components/WorkflowDetail/WorkflowDetail'
import { useWorkflowStore, type WorkflowJob } from '@store/workflowQueue'
import { sampleWorkflow } from '@workflow/sampleWorkflow'
import type { Workflow } from '@workflow/workflow'
import type { TSchema } from 'typebox'

function JobCard({ job, onPress }: { job: WorkflowJob, onPress: () => void }) {
  const completedCount = job.steps.filter(s => s.status === 'complete').length
  return (
    <ActionRow
      title={job.name}
      status={job.status}
      time={`${completedCount}/${job.steps.length} steps`}
      subtitles={job.error ? [job.error] : undefined}
      onPress={onPress}
    />
  )
}

export default function Workflows() {
  const jobs = useWorkflowStore(s => s.jobs)
  const enqueue = useWorkflowStore(s => s.enqueue)
  const styles = useThemedStyles(themedStyles)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  // TODO: fix schema types
  const runSample = () => enqueue('Topic Summarizer', sampleWorkflow as unknown as Workflow<TSchema, TSchema>, { topic: 'quantum computing' })

  if (jobs.length === 0) {
    return (
      <Background>
        <EmptyState message="No workflow runs yet." />
        <View style={styles.buttonRow}>
          <Button label="Run sample workflow" onPress={runSample} />
        </View>
      </Background>
    )
  }

  return (
    <Background>
      <View style={styles.buttonRow}>
        <Button label="Run workflow" onPress={runSample} />
      </View>
      <FlatList
        data={[...jobs].reverse()}
        keyExtractor={j => j.id}
        renderItem={({ item }) => (
          <JobCard job={item} onPress={() => setSelectedId(item.id)} />
        )}
        contentContainerStyle={styles.list}
      />
      <BottomSheet visible={selectedId !== null} onDismiss={() => setSelectedId(null)}>
        {selectedId && <WorkflowDetail workflowId={selectedId} />}
      </BottomSheet>
    </Background>
  )
}

const themedStyles = createThemedStyles((tokens: ThemeTokens) => ({
  buttonRow: {
    paddingHorizontal: tokens.space4,
    paddingTop: tokens.space3,
    paddingBottom: tokens.space2,
  },
  list: {
    gap: tokens.space2,
    paddingBottom: tokens.space4,
  },
}))
