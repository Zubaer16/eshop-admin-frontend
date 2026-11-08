export type UploadInstruction = {
  mediaId: string
  uploadUrl: string
  method: 'POST' | 'PUT'
  fields: Record<string, string | number | boolean>
  headers: Record<string, string>
  expiresAt: string
}
export async function transferImage(
  file: File,
  instruction: UploadInstruction,
  send: typeof fetch = fetch,
) {
  const url = new URL(instruction.uploadUrl)
  if (
    url.username ||
    url.password ||
    !(
      url.protocol === 'https:' ||
      (url.protocol === 'http:' &&
        ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname))
    )
  )
    throw new Error('The upload destination is not secure.')
  if (
    !['POST', 'PUT'].includes(instruction.method) ||
    !Number.isFinite(Date.parse(instruction.expiresAt)) ||
    Date.parse(instruction.expiresAt) <= Date.now()
  )
    throw new Error('Upload instruction has expired or is invalid.')
  if (
    Object.keys(instruction.headers || {}).some((key) =>
      /^(authorization|cookie|proxy-authorization)$/i.test(key),
    )
  )
    throw new Error('Invalid upload headers.')
  let body: BodyInit = file
  if (instruction.method === 'POST') {
    const form = new FormData()
    for (const [key, value] of Object.entries(instruction.fields || {}))
      form.append(key, String(value))
    form.append('file', file)
    body = form
  }
  const response = await send(url.href, {
    method: instruction.method,
    headers: instruction.headers,
    body,
    credentials: 'omit',
    redirect: 'error',
    referrerPolicy: 'no-referrer',
    signal: AbortSignal.timeout(60000),
  })
  if (!response.ok)
    throw new Error(
      'Upload was not confirmed. If the file may already exist, use Verify uploaded file before retrying.',
    )
}
