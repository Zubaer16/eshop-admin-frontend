import AdminLink from '@/components/ui/admin-link'
export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-canvas p-8 text-center">
      <p className="text-sm font-bold text-primary">404</p>
      <h1 className="text-3xl font-extrabold">Page not found</h1>
      <p className="text-sm text-muted">
        This part of the admin workspace does not exist.
      </p>
      <AdminLink
        href="/dashboard"
        className="rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white"
      >
        Back to dashboard
      </AdminLink>
    </main>
  )
}
