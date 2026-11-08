export const label = (key: string) =>
  key
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/Minor/g, '(minor units)')
    .replace(/^./, (c) => c.toUpperCase())
export type Field = {
  key: string
  type: string
  required: boolean
  enum?: readonly (string | number)[]
  minimum?: number
  maximum?: number
  minLength?: number
  maxLength?: number
  nullable?: boolean
  format?: string
  items?: { enum?: readonly string[] }
}
export function formPayload(
  fields: readonly Field[],
  data: FormData,
  revision: number,
): Record<string, unknown> {
  return Object.fromEntries(
    fields
      .map((f) => {
        if (f.key === 'expectedRevision') return [f.key, revision]
        if (f.type === 'boolean') return [f.key, data.has(f.key)]
        const raw =
          f.format === 'password'
            ? String(data.get(f.key) ?? '')
            : String(data.get(f.key) ?? '').trim()
        if (f.type === 'array')
          return [
            f.key,
            f.items?.enum
              ? data.getAll(f.key).map(String)
              : raw.split(/[\s,]+/).filter(Boolean),
          ]
        if (!raw && f.nullable) return [f.key, null]
        if (!raw && !f.required) return [f.key, undefined]
        if (f.type === 'integer' || f.type === 'number') {
          if (!/^\d+$/.test(raw) || !Number.isSafeInteger(Number(raw)))
            throw new Error('Enter a whole number for ' + label(f.key))
          return [f.key, Number(raw)]
        }
        return [f.key, raw]
      })
      .filter(([, v]) => v !== undefined),
  )
}
