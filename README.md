# PesoWise

PesoWise is a responsive personal and shared finance tracker built with React, Vite, Supabase Auth/PostgreSQL/RLS/Realtime, Recharts, and React Icons.

## Features

- Email registration, verification, login, logout, password recovery, protected routes, and persistent sessions.
- Personal or shared workspaces with Owner, Admin, Member, and Viewer roles.
- Workspace invitations, acceptance/decline, role changes, removal, ownership transfer, and leave/delete rules.
- Cash, E-wallet, Debit, and Credit wallet setup.
- Income, expense, and atomic wallet-to-wallet transfer transactions.
- Monthly budgets, warnings, dashboards, activity logs, reports, CSV export, month picker, and responsive mobile UI.
- Supabase Row Level Security and Realtime subscriptions scoped to the active workspace.
- Vercel SPA routing support.

## Local setup

1. Create a Supabase project.
2. Run `supabase/migrations/001_initial_schema.sql` in the SQL Editor, or use the Supabase CLI:

   ```bash
   supabase link --project-ref YOUR_PROJECT_REF
   supabase db push
   ```

3. Copy `.env.example` to `.env` and add the project URL and public anon key.
4. In Supabase Authentication > URL Configuration, set:
   - Site URL: `http://localhost:5173` locally or your production Vercel domain.
   - Redirect URLs: `http://localhost:5173/**` and `https://your-vercel-domain.vercel.app/**`.
5. Install and run:

   ```bash
   npm install
   npm run dev
   ```

## Optional invitation email delivery

Database invitations work without an email provider: registered users see matching invitations after login. To also send email, deploy `supabase/functions/send-workspace-invite` and configure these function secrets:

```bash
supabase secrets set RESEND_API_KEY=... INVITE_FROM_EMAIL="PesoWise <noreply@yourdomain.com>" APP_URL=https://your-domain.vercel.app
supabase functions deploy send-workspace-invite
```

The Supabase service-role key is available only inside the Edge Function runtime and is never exposed to the React frontend.

## Vercel

- Import the repository in Vercel.
- Add `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and `VITE_APP_URL` as environment variables.
- Build command: `npm run build`
- Output directory: `dist`
- `vercel.json` handles nested route refreshes.

## Security model

All financial tables use Row Level Security. Access is based on active workspace membership. Viewer is read-only, Member can add transactions and edit their own, Admin has broader CRUD access, and Owner controls workspace deletion/ownership. Frontend button visibility is convenience only; database policies enforce access.
