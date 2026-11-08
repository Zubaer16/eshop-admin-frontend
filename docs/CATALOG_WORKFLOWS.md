# Catalog administration flows

## Products and variations

- Every product has a unique base SKU, USD base price, category, and publication state.
- Variants are optional, identified by a unique variant SKU and a unique size/color combination.
- When variants are present, total product stock is calculated as their sum. Inventory adjustments select a specific variant. Products without variants retain their original single stock field.
- Product images in this frontend are **references**, not uploads: use a site-relative path or HTTPS URL and meaningful alt text; maximum six. Image availability and content cannot be guaranteed until storage and a media service exist.
- Duplicate base/variant SKUs are rejected across products (case-insensitive). Duplicate size/color combinations within a product are rejected.
- Product/order data is illustrative; editing a product does not retroactively alter existing sample order line snapshots.

## Categories

- Each category may belong to one parent category, creating a hierarchy of arbitrary depth.
- Slugs are globally unique for the local catalog.
- A category cannot be moved beneath itself or one of its descendants.
- Categories with directly assigned products or direct subcategories cannot be deleted.
- New category IDs are browser-local and are not shared with the customer storefront.

## Persistence and limitations

All management actions are saved in localStorage under the **existing** `kookaburra-admin-local-preview-v1` key, preserving the original browser preview. Previous records without `variants`, `images` or `parentId` remain valid and render with their former stock figures. Use **Reset sample data** to see the new illustrative variants on the seeded sneaker and T-shirt items if your browser has older saved data.

These screens do not enforce real authorization, audit changes on a server, accept media uploads, or synchronize with the eShop customer storefront. Do not operate actual inventory or publish this as an unlocked administration system.

## Browser testing

```powershell
npm run check
npm run test:e2e:visual
npm run test:e2e:report
```

The E2E suite contains six original workflows and three advanced catalog workflows. It runs sequentially in headed Chromium with a default 900 ms delay after recorded actions.
