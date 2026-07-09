import { PageLayout } from '../components/PageLayout'
import { InsightsWarningsCard } from '../components/InsightsWarningsCard'

export function InsightsPage() {
  return (
    <PageLayout
      title="Insights & Warnings"
      subtitle="Automatic anomaly detection + ask questions about your data"
    >
      <InsightsWarningsCard />
    </PageLayout>
  )
}
