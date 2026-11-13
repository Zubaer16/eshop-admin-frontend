# Admin browser validation

Run `npm run test:e2e -- --api-origin https://api.example.test` on Node 24. The runner builds production Next.js and starts it on 127.0.0.1:3213. All session and domain traffic is intercepted in Playwright; no real account, inventory, order or payment is modified. There is no application preview mode.

The canonical suite checks connected dashboard cards/chart and exact financial display, catalog table/editing and unchanged minor-unit payload, order states, permission denial, API failure/retry states and shared workspace rendering. Responsive checks cover 320, 390, 768 and 1440 pixels. It supplements the retained API/session/security unit tests; it is not production/provider acceptance.

Results: `playwright-report/index.html`, `test-results/admin/results.json`, failure traces/screenshots in `test-results/admin/artifacts`, dashboard screenshot in `test-results/admin/dashboard.png`.

Use `npm run test:e2e:list` for discovery or `npm run test:e2e:report` for the HTML report. `npm run test:e2e:visual -- --api-origin https://api.example.test` opens headed Chromium.
