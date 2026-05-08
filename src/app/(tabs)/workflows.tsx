import { FlatList, View } from 'react-native'
import { router } from 'expo-router'
import Background from '@design/Background/Background'
import Button from '@design/Button/Button'
import EmptyState from '@design/EmptyState/EmptyState'
import ActionRow from '@design/ActionRow/ActionRow'
import { createThemedStyles, useThemedStyles } from '@design/theme'
import type { ThemeTokens } from '@design/theme'
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
  const enqueue = useWorkflowStore(s => s.enqueueWorkflow)
  const styles = useThemedStyles(themedStyles)

  // TODO: fix schema types
  const runSample = () => enqueue('Researcher', sampleWorkflow as unknown as Workflow<TSchema, TSchema>, { topic: 'quantum computing' })

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
          <JobCard job={item} onPress={() => router.push(`/workflow/${item.id}`)} />
        )}
        contentContainerStyle={styles.list}
      />
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
