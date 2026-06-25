# Work Summit Submission Platform

A Vue 3 frontend and Node.js backend for daily PDF submissions, admin review, and merged PDF downloads.

## Features

- Member upload form for group numbers 0-151
- Daily submission status check with preview and cancellation
- Admin dashboard for today's submissions
- History view for past dates and merged PDF downloads
- Local file storage by default, with Supabase support when configured

## Local development

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npm run dev
   ```

3. Open the frontend at http://localhost:3000 and the API at http://localhost:3001

## Optional Supabase setup

Copy `.env.example` to `.env` and fill in:

```env
SUPABASE_URL=your-project-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
PORT=3001
```

Then create the `submissions` table with the SQL in `supabase/schema.sql` and create a storage bucket named `submissions`.

## Deploy to Vercel

1. Push the repository to GitHub.
2. Import it in Vercel.
3. Vercel will build the Vue app and serve the API from `api/` automatically.


kuykuynahee