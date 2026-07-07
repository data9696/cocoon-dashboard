import { PageLayout } from '../components/PageLayout'
import { AdminApprovals } from '../components/AdminApprovals'

export function AdminPage() {
  return (
    <PageLayout title="Admin — User Access" subtitle="Approve or reject dashboard access requests">
      <AdminApprovals />
    </PageLayout>
  )
}
