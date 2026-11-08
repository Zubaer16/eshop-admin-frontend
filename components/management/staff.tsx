'use client'
import { useState } from 'react'
import { useResource, ResourceState } from '@/components/catalog/shared'
import { Button } from '@/components/ui/button'
import { SpecForm, DataView, type Row } from './shared'
export function LiveStaff() {
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
      <h1 className="text-3xl font-black">Staff and permissions</h1>
      <p className="text-sm text-muted">
        OWNER-only. Passwords are write-only on creation. Removal uses DISABLED
        status; OWNER is immutable. Role/grant changes are effective on the
        server immediately.
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
        <div className="space-y-3">
          {staff.data.map((row) => (
            <article
              key={String(row.id)}
              className="space-y-3 rounded-xl border bg-white p-4"
            >
              <DataView value={row} />
              {row.role !== 'OWNER' && (
                <Button variant="secondary" onClick={() => setEdit(row)}>
                  Edit staff member
                </Button>
              )}
            </article>
          ))}
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
            className="space-y-3 rounded-xl border bg-white p-4"
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
