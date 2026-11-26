import { PageHeading } from '@/components/layout/page-heading'
import { Panel, SectionHeading } from '@/components/ui/panel'
import { AdminNotice } from '@/components/ui/admin-workspace'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, Coins, Database, ShieldCheck } from 'lucide-react'

const principles = [
  {
    title: 'Shared API contract',
    description:
      'Admin and Storefront use the same backend API. Product, variant, category and order identifiers come from the server.',
    icon: Database,
    tag: 'Server-backed',
  },
  {
    title: 'Server-owned records',
    description:
      'This workspace displays current store records. Product and order changes use the existing server rules and your current permissions.',
    icon: ShieldCheck,
    tag: 'Permission-scoped',
  },
  {
    title: 'Exact currency lanes',
    description:
      'Catalog prices keep their listed currency. Checkout uses configured country and currency policies. Payments remain in TEST scope.',
    icon: Coins,
    tag: 'No browser FX',
  },
  {
    title: 'Validation evidence',
    description:
      'Source alignment and runtime validation are recorded in the backend integration contract and validation reports. This page does not run acceptance checks.',
    icon: CheckCircle2,
    tag: 'Documentation only',
  },
]

export function Compatibility() {
  return (
    <section className="space-y-6">
      <PageHeading
        eyebrow="PLATFORM GOVERNANCE"
        title="Frontend compatibility"
        description="Reference the shared integration boundaries between the Admin workspace and Storefront."
      />
      <AdminNotice title="This is a reference page" tone="warning">
        This page summarizes the current compatibility principles. It does not
        run automated checks, certify a release or replace the integration
        contract and validation reports.
      </AdminNotice>
      <Panel className="overflow-hidden">
        <div className="border-b border-line px-4 py-4 sm:px-5">
          <SectionHeading
            title="Shared platform principles"
            subtitle="The existing Backend remains the common source of truth."
            action={<Badge kind="info">Reference</Badge>}
          />
        </div>
        <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-5">
          {principles.map(({ title, description, icon: Icon, tag }, index) => (
            <article
              key={title}
              className="rounded-2xl border border-line bg-white p-4 sm:p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="flex size-10 items-center justify-center rounded-xl bg-blue-50 text-primary">
                  <Icon size={19} aria-hidden="true" />
                </span>
                <Badge>{tag}</Badge>
              </div>
              <p className="mt-4 text-base font-extrabold text-ink">{title}</p>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                {description}
              </p>
              <p className="mt-4 text-[10px] font-black uppercase tracking-[.16em] text-slate-300">
                0{index + 1} / 04
              </p>
            </article>
          ))}
        </div>
      </Panel>
    </section>
  )
}
