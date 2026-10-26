# Aqeedah

A bilingual (Uzbek + English) Islamic question-and-answer platform. People ask; scholars answer
with evidence; a second, senior scholar reviews every answer before it is published.

- **Public site** (`/uz`, `/en`): search (Latin and Cyrillic Uzbek both work), topics, answer pages
  with Qur'an/hadith evidence blocks, asking a question, tracking it by number + code, scholars, method.
- **Workspace** (`/workspace`): triage, assigning, writing answers, review and publishing,
  translations into the second language, team roles.
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

## Staff accounts and roles

1. The **first** account created at `/workspace/login` becomes **admin** automatically.
2. Other staff create accounts there too; the admin gives each a role on *Workspace → Team*:
   - **Moderator**: triage, link duplicates, decline.
   - **Scholar**: write answers.
   - **Reviewer**: approve or return answers (cannot approve their own).
   - **Translator**: write the second-language version.
   - **Admin**: everything, plus roles.

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
