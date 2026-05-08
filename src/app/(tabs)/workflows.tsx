import { FlatList } from 'react-native'
import { router } from 'expo-router'
import Background from '@design/Background/Background'
import Button from '@design/Button/Button'
import EmptyState from '@design/EmptyState/EmptyState'
import ActionRow from '@design/ActionRow/ActionRow'
import { createThemedStyles, useThemedStyles } from '@design/theme'
import type { ThemeTokens } from '@design/theme'
import { useWorkflowStore, type WorkflowJob } from '@store/workflowQueue'

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
  const styles = useThemedStyles(themedStyles)

  return (
    <Background>
      {jobs.length === 0 ? (
        <EmptyState message="No workflow runs yet." />
      ) : (
        <FlatList
          data={[...jobs].reverse()}
          keyExtractor={j => j.id}
          renderItem={({ item }) => (
            <JobCard job={item} onPress={() => router.push(`/workflow/${item.id}`)} />
          )}
          contentContainerStyle={styles.list}
          style={styles.jobList}
        />
      )}
      <Button label="Run workflow" onPress={() => router.push('/workflow/run')} />
    </Background>
  )
}

const themedStyles = createThemedStyles((tokens: ThemeTokens) => ({
  jobList: {
    flex: 1,
  },
  list: {
    gap: tokens.space2,
    paddingBottom: tokens.space2,
  },
}))
