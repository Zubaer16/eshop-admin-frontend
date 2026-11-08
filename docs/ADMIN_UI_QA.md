# Admin UI & accessibility QA — Patch 08

## Purpose

This patch improves interaction and keyboard accessibility in the **frontend-only** eShop administration preview. It is **not** a completed accessibility conformance audit or production readiness certification.

## Implemented

- Visible-on-focus **Skip to main content** link to `main#main-content`.
- Mobile sidebar as a Radix dialog: focus contained while open, Escape closes, focus returned to trigger, labelled navigation. Existing menu links and sample-data reset remain available.
- Searchable **Jump to section** dialog with **Ctrl+K**/**Command+K**, result filtering, ArrowUp/ArrowDown, Enter to navigate, Escape to close and clear empty-state feedback. Available on phone and desktop widths.
- Reports tabs use a single active keyboard tab stop and support ArrowLeft, ArrowRight, Home and End.
- All existing data tables with horizontal overflow expose keyboard-focusable labelled scroll regions.
- Product/editor dialogs respect small dynamic viewports and have less cramped mobile padding.
- Playwright scenarios verify these interactions with the existing visual delay of 900 ms per recorded action.

## Manual acceptance list

1. Test navigation and report tabs with **keyboard only** on desktop; check focus is visible and no focus is stranded behind a dialog.
2. Check product editor at 320, 375, 390, 768 and 1120px widths and at enlarged browser text. Some dense inventory and reporting tables intentionally scroll horizontally.
3. Check both mobile drawer and quick-navigation results with a screen reader; confirm dialog name, announcements and result navigation.
4. Use high zoom, reduced motion and Windows high-contrast settings; verify the preview remains operable.
5. Run `npm run check`, `npm run verify:ui` and `npm run test:e2e:visual` locally. Automated coverage is not a substitute for manual accessibility testing.
6. Before backend work, reconcile the Admin vs Storefront catalog, variant, category, shipping, order and payment DTOs documented in `docs/CROSS_FRONTEND_ALIGNMENT.md`.

## Constraints

The preview still stores data only in the browser and does **not** enforce real authorization, process payments, or publish catalog or promotions to the customer storefront. Do **not** deploy it to production as an authenticated administrative system. No new dependencies were introduced in Patch 08.
