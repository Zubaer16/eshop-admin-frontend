'use client'
import { PageHeading } from '@/components/layout/page-heading'
import { useState } from 'react'
import { useResource, ResourceState } from '@/components/catalog/shared'
import { Badge, statusKind } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Panel, SectionHeading } from '@/components/ui/panel'
import { AdminEmptyState, AdminNotice } from '@/components/ui/admin-workspace'
import { SpecForm, DataView, type Row } from './shared'
export function Staff() {
  const staff = useResource<Row[]>('/v1/admin/staff'),
    roles = useResource<Row[]>('/v1/admin/roles'),
    [edit, setEdit] = useState<Row | null | undefined>(),
    [role, setRole] = useState<Row | null>(null)
  const refresh = () => {
    setEdit(undefined)
    setRole(null)
    staff.reload()
    roles.reload()
  }
  return (
    <section className="space-y-6">
      <PageHeading
        eyebrow="WORKSPACE ACCESS"
        title="Staff & roles"
        description="Manage team accounts and inspect the persisted permission grants attached to each role."
        action={
          <Button onClick={() => setEdit(null)}>Create staff account</Button>
        }
      />
      <AdminNotice title="Permission governance" tone="warning">
        Manage team access and assigned roles. Only the store owner can change
        permissions. Role grants are persisted server-side and remain subject to
        Backend authorization.
      </AdminNotice>
      {edit !== undefined && (
        <SpecForm
          key={String(edit?.id || 'new')}
          contract={edit ? 'StaffUpdateDto' : 'StaffCreateDto'}
          row={edit || {}}
          route={'/v1/admin/staff' + (edit ? '/' + edit.id : '')}
          method={edit ? 'PATCH' : 'POST'}
          done={refresh}
          title={edit ? 'Update staff status and role' : 'Create staff account'}
        />
      )}
      <Panel className="overflow-hidden">
        <div className="border-b border-line px-4 py-4 sm:px-5">
          <SectionHeading
            title="Team members"
            subtitle={
              staff.data
                ? `${staff.data.length.toLocaleString('en-US')} server records`
                : 'Current staff directory'
            }
            action={
              <Button
                size="sm"
                variant="secondary"
                busy={staff.isRefreshing}
                pendingLabel="Refreshing…"
                onClick={staff.reload}
              >
                Refresh staff
              </Button>
            }
          />
        </div>
        {staff.data ? (
          staff.data.length ? (
            <>
              <div
                className="table-scroll hidden md:block"
                tabIndex={0}
                role="region"
                aria-label="Staff members"
              >
                <table className="admin-table min-w-[720px]">
                  <thead>
                    <tr>
                      <th>Team member</th>
                      <th>Account role</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {staff.data.map((row) => (
                      <tr key={String(row.id)}>
                        <td>
                          <p className="font-bold text-ink">
                            {String(row.name || row.email)}
                          </p>
                          <p className="mt-1 text-xs font-normal text-muted">
                            {String(row.email)}
                          </p>
                        </td>
                        <td>
                          <Badge>{String(row.staffRole || row.role)}</Badge>
                        </td>
                        <td>
                          <Badge kind={statusKind(String(row.status))}>
                            {String(row.status)}
                          </Badge>
                        </td>
                        <td>
                          {row.role !== 'OWNER' ? (
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => setEdit(row)}
                            >
                              Edit staff member
                            </Button>
                          ) : (
                            <Badge kind="info">Store owner</Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="grid gap-3 p-4 md:hidden">
                {staff.data.map((row) => (
                  <article
                    key={String(row.id)}
                    className="rounded-2xl border border-line p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="break-words text-sm font-extrabold text-ink">
                          {String(row.name || row.email)}
                        </h3>
                        <p className="mt-1 break-all text-xs text-muted">
                          {String(row.email)}
                        </p>
                      </div>
                      <Badge kind={statusKind(String(row.status))}>
                        {String(row.status)}
                      </Badge>
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-2">
                      <Badge>{String(row.staffRole || row.role)}</Badge>
                      {row.role !== 'OWNER' ? (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => setEdit(row)}
                        >
                          Edit
                        </Button>
                      ) : (
                        <Badge kind="info">Store owner</Badge>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </>
          ) : (
            <div className="p-4 sm:p-5">
              <AdminEmptyState
                title="No staff accounts found"
                description="Create a staff account when another team member needs workspace access."
              />
            </div>
          )
        ) : (
          <div className="p-4 sm:p-5">
            <ResourceState
              error={staff.error}
              retry={staff.reload}
              variant="table"
            />
          </div>
        )}
      </Panel>

      <Panel className="overflow-hidden">
        <div className="border-b border-line px-4 py-4 sm:px-5">
          <SectionHeading
            title="Persisted role grants"
            subtitle="Inspect the exact permissions stored for each role."
            action={
              <Button
                size="sm"
                variant="secondary"
                busy={roles.isRefreshing}
                pendingLabel="Refreshing…"
                onClick={roles.reload}
              >
                Refresh roles
              </Button>
            }
          />
        </div>
        {role && (
          <div className="border-b border-line bg-blue-50/30 p-4 sm:p-5">
            <SpecForm
              key={String(role.key)}
              contract="RolePermissionUpdateDto"
              row={role}
              route={'/v1/admin/roles/' + role.key + '/permissions'}
              method="PATCH"
              done={refresh}
              title="Replace role permissions"
            />
          </div>
        )}
        {roles.data ? (
          roles.data.length ? (
            <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-5 xl:grid-cols-3">
              {roles.data.map((row) => (
                <article
                  key={String(row.key)}
                  className="min-w-0 rounded-2xl border border-line bg-white p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="break-words text-sm font-extrabold text-ink">
                      {String(row.key)}
                    </h3>
                    <Badge kind={row.immutable ? 'neutral' : 'info'}>
                      {row.immutable ? 'Immutable' : 'Editable'}
                    </Badge>
                  </div>
                  <p className="mt-2 text-xs text-muted">
                    {Array.isArray(row.permissions)
                      ? `${row.permissions.length} persisted grants`
                      : 'Permission details available below'}
                  </p>
                  <details className="mt-3 border-t border-line pt-3">
                    <summary className="cursor-pointer text-xs font-bold text-primary">
                      Inspect role details
                    </summary>
                    <div className="mt-3">
                      <DataView value={row} />
                    </div>
                  </details>
                  {!row.immutable && (
                    <Button
                      className="mt-4 w-full"
                      size="sm"
                      variant="secondary"
                      onClick={() => setRole(row)}
                    >
                      Edit role grants
                    </Button>
                  )}
                </article>
              ))}
            </div>
          ) : (
            <div className="p-4 sm:p-5">
              <AdminEmptyState title="No persisted roles returned" />
            </div>
          )
        ) : (
          <div className="p-4 sm:p-5">
            <ResourceState
              error={roles.error}
              retry={roles.reload}
              variant="grid"
            />
          </div>
        )}
      </Panel>
    </section>
  )
}
