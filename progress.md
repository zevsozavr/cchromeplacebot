## Goal
Complete Nova Poshta API integration for automatic shipment creation, fix all checkout/cart/UX bugs, and clean up remaining collection references.

## Constraints & Preferences
- Bot token: `8962788106:AAHRlKbCNCHe4nW47PmKJkQeMzDIc7GpDZ0`
- Admin IDs: `7264276513`, `822479618` (both receive Telegram order notifications + stock alerts)
- Seller contact: `@cchromeplacee`
- Vercel project: `yblnik/cchromeplacebot` — `https://cchromeplacebot.vercel.app`
- MongoDB connected (`db_connected: true`) — whitelisted `0.0.0.0/0` in Atlas
- NP API key `587dc77f71fef7624b1e66296cc3c28b` (temporary) — needs to be set as `NP_API_KEY` env var on Vercel for real TTN creation
- NP sender config (Refs, phone, etc.) stored in DB via admin panel at `/admin/nova-poshta`

## Progress
### Done
- **Database connected** — MongoDB Atlas whitelisted; `api/test-db` returns `{"db_connected":true}`; DataContext syncs to DB on every change
- **Categories updated** — Removed Dresses, Premium Outerwear; added Shoes with Unsplash image
- **Subcategories added** — `subcategory?: string` on Product; admin form shows subcategory input; Products page has second filter bar for subcategory chips
- **Multi-image support** — `images?: string[]` on Product; admin form allows multiple file/URL uploads with previews; ProductDetail carousel uses actual images; first image marked as primary
- **Admin Products form rewritten** — Sections (Basic Info, Pricing, Photos, Details); chip buttons for sizes (XS–XXL toggle + custom); colors (preset circles + name/hex input, removable tags); per-size stock steppers (`sizeStock: Record<string, number>`); translated categories in dropdown
- **Collections feature removed** — `collections` field deleted from Product type; admin form, list, dashboard card, translations all cleaned; `Collection` type reduced to only `npConfig`; Storefront hero/highlight sections removed; `AdminCollection` page/route removed
- **Rating removed** — Star + "4.9" deleted from ProductDetail
- **Cart shipping fixed** — Now uses `getNovaPoshtaPrice()` (was hardcoded "Free")
- **Per-size stock tracking** — `sizeStock` on Product; decremented on order; out-of-stock sizes disabled in ProductDetail with "Немає" badge; admin notified via Telegram when size hits 0
- **Nova Poshta API integration** — Created `lib/np.js` (all NP methods); `api/np-cities.js` (city search dropdown), `api/np-warehouses.js` (warehouse search), `api/np-cost.js` (delivery cost), `api/create-shipment.js` (InternetDocument creation)
- **Checkout rewritten** — City/warehouse searchable dropdowns filled from NP API; prepay checkbox (notifies admin); auto-TTN creation on order; TTN sent to user via Telegram with tracking link; admin notified with all order details
- **AdminNovaPoshta page** — `/admin/nova-poshta` for NP sender config (Refs, address, phone, city); saves to DB via `npConfig` in DataContext
- **Loading screen** — DataProvider shows branded spinner (CCHROME PLACE + green glow) while fetching from DB; 600ms minimum to prevent flash
- **Cart persistence** — CartContext saves/loads from `localStorage('plugstreet_cart')`; stock validation in `addItem` (limits qty to `sizeStock`)
- **Order confirmed** — Now renders order details properly (no raw translation keys)
- **Language preference** — webhook saves `lang_ua`/`lang_ru` to DB via `/api/users`; loads on /start and skips language choice on repeat visits
- **Empty states** — Products page shows icon + two-line text when filtered category has 0 items; Storefront masonry has same style; admin list shows "no products"
- **Subcategory filter** — Second scrollable chip bar below category bar; dynamic paddingTop adjustment
- **User auto-registration** — AuthContext sends TG user data to `/api/register` on mount; `/api/users` endpoint created for GET/POST/DELETE
- **Storefront cleaned** — Hero section and highlighted products section removed; only category chips + masonry grid remain
- **Admin Dashboard cleaned** — Collection card removed
- **RU translations deduplicated** — Fixed duplicate checkout keys in RU section

### Blocked
- NP shipment creation falls back to placeholder TTN (`NP-...`) until sender config is filled in admin panel + `NP_API_KEY` added to Vercel env vars
- Users not showing in admin dashboard — user data endpoint needs to be wired to the UI

## Key Decisions
- `sizeStock: Record<string, number>` preferred over changing `sizes: string[]` to objects — keeps backward compatibility with existing products
- NP sender config stored in DB (not env vars) so admin can edit via UI
- `npConfig` lives in the same data blob as products (single MongoDB document `app_data`), not a separate collection
- Default products/collection removed entirely from code to avoid "loading then clearing" flash
- Loading screen uses inline CSS animation (no external dependency)

## Next Steps
1. Set `NP_API_KEY` env var on Vercel (value: `587dc77f71fef7624b1e66296cc3c28b`)
2. Fill in NP sender settings in admin panel (`/admin/nova-poshta`) to enable real TTN creation
3. Fix admin Users page to display registered users with order history
4. Debug warehouse dropdown selection in checkout
5. Test app at https://cchromeplacebot.vercel.app

## Critical Context
- `DataContext` now exports `npConfig` + `setNpConfig` instead of `collection` + `setCollection`
- `inCollection` field still exists on Product type — used only for Storefront masonry filter (removing would break products that have it set)
- Build passes (`tsc -b && vite build`), Vercel deploy succeeds
- All local files in `C:\Users\PzKmp\Desktop\cchromeplacebot\`

## Relevant Files
- `lib/np.js`: Nova Poshta API helper (`searchCities`, `getWarehouses`, `getDeliveryCost`, `createShipment`)
- `api/np-cities.js`, `api/np-warehouses.js`, `api/np-cost.js`, `api/create-shipment.js`: NP API endpoints
- `src/pages/Checkout.tsx`: NP city/warehouse dropdowns, prepay, TTN creation
- `src/pages/admin/NovaPoshta.tsx`: NP sender config form (uses `setNpConfig` from DataContext)
- `src/context/DataContext.tsx`: loading screen, npConfig state, DB-first sync
- `src/context/CartContext.tsx`: localStorage persistence, stock validation in addItem
- `src/pages/Products.tsx`: two-tier category + subcategory filter bar
- `src/pages/admin/Products.tsx`: per-size stock steppers, chip toggles, multi-image upload
- `api/webhook.js`: language preference saved to DB via `/api/users`
- `src/context/AuthContext.tsx`: auto-registers user to DB on mount
- `src/pages/Storefront.tsx`: category chips + masonry grid (no hero/collection)
- `src/pages/admin/Dashboard.tsx`: admin overview cards (no collection card)
