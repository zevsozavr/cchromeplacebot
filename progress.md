## CCHROME PLACE — Telegram Mini App store

A Telegram Mini App storefront for a clothing reseller, deployed on Vercel.
Admin manages products in-app; forwarded channel posts are auto-parsed into
products by the bot.

## Stack
- **Frontend**: React 19 + TypeScript + Vite (`src/`), served as a Telegram Web App.
- **Backend**: Vercel serverless functions (`api/*.js`).
- **Persistence**: Supabase
  - `kv_store` table (key/value JSONB) holds `app_data` (products + npConfig),
    `orders`, `users`, `user_langs`. Accessed via PostgREST with the
    **service_role** key (`SUPA_KEY`).
  - **Storage** bucket `product-images` (public) holds uploaded product photos.
- **Bot**: Telegram Bot API via webhook at `api/webhook.js`.

## Env vars (Vercel)
- `SUPA_URL` — Supabase project URL (`https://<ref>.supabase.co`)
- `SUPA_KEY` — Supabase **service_role** JWT (bypasses RLS for server writes)
- `SUPABASE_MGMT_KEY` — optional `sbp_` Management key (auto-creates `kv_store`)
- `BOT_TOKEN` — Telegram bot token
- `NP_API_KEY` — Nova Poshta API key (for real TTN creation)

## Constants
- Admin IDs: `7264276513`, `822479618`
- Seller contact: `@cchromeplacee`
- Vercel: `yblnik/cchromeplacebot` — https://cchromeplacebot.vercel.app
- GitHub: `zevsozavr/cchromeplacebot` (deploys from `master`)

## How persistence works (important)
- `src/context/DataContext.tsx` is the single source of truth on the client.
  - Loads `app_data` from `GET /api/data` on mount (falls back to localStorage).
  - Every mutation writes localStorage synchronously, then `PUT /api/data` with
    `keepalive: true`; also flushes on `pagehide`/`visibilitychange` via
    `sendBeacon` (POST). This is what keeps items from vanishing when the
    Telegram webview is closed right after creating one.
  - Sends `knownIds` (every product id the client is aware of) with each save.
    The server (`api/data.js`) preserves any product whose id the client does
    NOT know — so a forwarded-post product added while the admin app is open is
    not wiped, while deletes of known products still apply.
- **Images are uploaded to Supabase Storage**, not stored as base64. The admin
  form compresses each photo (`src/lib/image.ts`, ~1280px JPEG) and POSTs it to
  `api/upload.js`, which returns a hosted URL. This keeps `app_data` small and
  saves fast/reliable.

## Post parser (`api/webhook.js`)
- Triggered by forwarded channel posts (`forward_from_chat`) or photos sent to
  the bot. `parseProduct()` extracts: name, price (UA/RU/EN, handles
  thousands separators and multi-line), sizes (S–XXL tokens, "розмір:" lines,
  EU numeric), colors (keyword→hex), condition, and auto-detected category.
- Multi-photo posts arrive as separate messages sharing `media_group_id`; they
  merge into one product via `upsertChannelProduct()` instead of duplicating.
- Confirms back to the chat with the parsed fields (first/caption message only).

## Known limitations / next steps
- Concurrency between the webhook writer and the admin app is mitigated by the
  `knownIds` merge but not fully transactional (read-modify-write on one JSONB
  row). Fine for a single admin; revisit if multiple admins edit concurrently.
- Nova Poshta TTN creation falls back to a placeholder until `NP_API_KEY` is set
  and sender config is filled in `/admin/nova-poshta`.
- Admin Users page wiring to show registered users + order history.

## Relevant files
- `src/context/DataContext.tsx` — load/save, keepalive+beacon flush, knownIds merge
- `src/lib/image.ts` — client image compress + upload
- `api/data.js` — GET/PUT/POST app_data with merge-on-save
- `api/upload.js` — Supabase Storage image upload
- `api/webhook.js` — Telegram webhook + post parser
- `lib/db.js` — Supabase kv_store helpers (`getAppData`, `saveAppData`, `upsertChannelProduct`, …)
- `src/pages/admin/Products.tsx` — product form (compress/upload, awaited save)
- `lib/np.js`, `api/np-*.js` — Nova Poshta integration
