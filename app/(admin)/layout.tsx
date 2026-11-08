import { AdminShell } from '@/components/layout/admin-shell'
import { RequireAuth } from '@/components/auth/auth-provider'
import { WorkspaceBoundary } from '@/components/auth/workspace-boundary'
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth>
      <AdminShell>
        <WorkspaceBoundary>{children}</WorkspaceBoundary>
      </AdminShell>
    </RequireAuth>
  )
}
