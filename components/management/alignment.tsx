export function LiveAlignment() {
  return (
    <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-7">
      <h1 className="text-2xl font-black">Frontend compatibility</h1>
      <p>
        Live Admin and Storefront use the same backend API. Product, variant,
        category and order identifiers come from the server.
      </p>
      <p>
        Preview records belong to the preview environment. They are not imported
        or matched automatically to live records.
      </p>
      <p>
        Catalog prices keep their listed currency. Checkout uses configured
        country and currency policies. Payments remain in TEST scope.
      </p>
      <p>
        Source alignment and runtime validation are recorded in the backend
        integration contract and validation reports. This page does not run
        acceptance checks.
      </p>
    </section>
  )
}
