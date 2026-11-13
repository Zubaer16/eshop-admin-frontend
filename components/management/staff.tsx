'use client'
import { PageHeading } from '@/components/layout/page-heading'
import { useState } from 'react'
import { useResource, ResourceState } from '@/components/catalog/shared'
import { Badge, statusKind } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
      <PageHeading title="Staff and permissions" />
      <p className="text-sm text-muted">
        Manage team access and assigned roles. Only the store owner can change
        permissions.
      </p>
      <Button onClick={() => setEdit(null)}>Create staff account</Button>
      {edit !== undefined && (
        <SpecForm
          key={String(edit?.id || 'new')}
          contract={edit ? 'StaffUpdateDto' : 'StaffCreateDto'}
          row={edit || {}}
          route={'/v1/admin/staff' + (edit ? '/' + edit.id : '')}
          method={edit ? 'PATCH' : 'POST'}
          done={refresh}
          title={edit ? 'Update staff status/role' : 'Create staff account'}
        />
      )}
      {staff.data ? (
        <div
          className="table-scroll rounded-2xl border border-line bg-white"
          tabIndex={0}
          role="region"
          aria-label="Staff members"
        >
          <table className="admin-table">
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
                    <p>{String(row.name || row.email)}</p>
                    <p className="text-xs text-muted">{String(row.email)}</p>
                  </td>
                  <td>{String(row.staffRole || row.role)}</td>
                  <td>
                    <Badge kind={statusKind(String(row.status))}>
                      {String(row.status)}
                    </Badge>
                  </td>
                  <td>
                    {row.role !== 'OWNER' ? (
                      <Button variant="secondary" onClick={() => setEdit(row)}>
                        Edit staff member
                      </Button>
                    ) : (
                      <Badge>Store owner</Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!staff.data.length && (
            <p className="p-8 text-muted">No staff members.</p>
          )}
        </div>
      ) : (
        <ResourceState error={staff.error} retry={staff.reload} />
      )}
      <h2 className="text-xl font-bold">Persisted role grants</h2>
      {role && (
        <SpecForm
          key={String(role.key)}
          contract="RolePermissionUpdateDto"
          row={role}
          route={'/v1/admin/roles/' + role.key + '/permissions'}
          method="PATCH"
          done={refresh}
          title="Replace role permissions"
        />
      )}
      {roles.data ? (
        roles.data.map((row) => (
          <article
            key={String(row.key)}
            className="space-y-3 rounded-2xl border border-line bg-white p-5"
          >
            <DataView value={row} />
            {!row.immutable && (
              <Button variant="secondary" onClick={() => setRole(row)}>
                Edit role grants
              </Button>
            )}
          </article>
        ))
      ) : (
        <ResourceState error={roles.error} retry={roles.reload} />
      )}
    </section>
  )
}
