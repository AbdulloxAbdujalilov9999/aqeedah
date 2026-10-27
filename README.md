# Aqeedah

A bilingual (Uzbek + English) Islamic question-and-answer platform. People ask; scholars answer
with evidence; a second, senior scholar reviews every answer before it is published.

- **Public site** (`/uz`, `/en`): search (Latin and Cyrillic Uzbek both work), topics, answer pages
  with Qur'an/hadith evidence blocks, asking a question, tracking it by its number, scholars, method.
- **Latin / Cyrillic switch** for Uzbek, converted on the fly.

The original research and design proposal is in [`design/index.html`](design/index.html).

## Stack

Next.js 15 (App Router) on Vercel, Supabase (Postgres, Auth, row level security).
The database schema is in [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql).

## Run locally

```bash
npm install
npm run dev
```

The Supabase URL and publishable key have defaults in `lib/config.ts`; override them with
`NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.

## Deploy on Vercel

Import this repository on vercel.com. The framework is detected as Next.js; no environment
variables are required.

## Admins

Visitors never need an account: they ask with their name (and optionally a phone number or
Telegram username) and follow their question by its number.

Answering happens in the separate admin app,
[aqeedah-admins](https://github.com/AbdulloxAbdujalilov9999/aqeedah-admins), which uses the
same Supabase database.

## Answer format

```
## Heading
Paragraph with **bold** and *italic*.
- list item

:::ayah Baqara surasi, 184-oyat
Arabic text
---
Translation
:::

:::hadith Buxoriy, 1903 · sahih
Arabic text (optional)
---
Translation
:::
```
