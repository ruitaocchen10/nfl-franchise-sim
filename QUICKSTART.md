# NFL Franchise Simulator - Quick Start Guide

## 🚀 Get Running in 5 Minutes

### Prerequisites
- Node.js 18+ installed
- A Supabase account (free tier is fine)

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Set Up Supabase

1. **Create a Supabase project:**
   - Go to https://supabase.com
   - Click "New Project"
   - Fill in project details
   - Wait for database to initialize (~2 minutes)

2. **Get your credentials:**
   - Go to Project Settings → API
   - Copy the "Project URL"
   - Copy the "anon/public" key

3. **Configure environment:**
   ```bash
   cp .env.local.example .env.local
   ```

   Then edit `.env.local` and paste your credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   ```

### Step 3: Set Up Database

1. **Open Supabase SQL Editor:**
   - In your Supabase dashboard, go to "SQL Editor"

2. **Run the initial schema:**
   - Copy all contents of `supabase/migrations/00001_initial_schema.sql`
   - Paste into SQL Editor
   - Click "Run"
   - Wait for success message

3. **Run the seed data:**
   - Copy all contents of `supabase/seed.sql`
   - Paste into SQL Editor
   - Click "Run"
   - Should see "Successfully inserted 32 NFL teams"

### Step 4: Start Development Server
```bash
npm run dev
```

### Step 5: Test It Out

1. Open http://localhost:3000
2. You'll be redirected to `/login`
3. Click "create a new account"
4. Sign up with an email and password
5. You should be redirected to the dashboard

**Success!** Your foundation is running.

## ✅ Verify Everything Works

- [ ] Can create an account
- [ ] Can log in
- [ ] Dashboard displays without errors
- [ ] Navigation bar shows your email
- [ ] "Sign out" button works
- [ ] After logout, redirected to login

## 🎯 What's Built So Far

### ✅ Complete
- Full authentication system (signup, login, logout)
- Database schema with 8 core tables
- Row Level Security for user data isolation
- Reusable UI components (Button, Card, Input, Modal)
- Responsive navigation
- Protected routes

### 🚧 Coming Next (Phase 2)
- Franchise creation wizard
- Team selection
- Roster management
- Game simulation

## 📚 Documentation

- **Full Setup Details**: `/docs/setup-complete.md`
- **Database Schema**: `/docs/database-schema.md`
- **Requirements**: `/docs/requirements.md`
- **UI Specs**: `/docs/ui-ux-specifications.md`
- **Supabase Guide**: `/supabase/README.md`

## 🐛 Troubleshooting

### "Invalid credentials" error
- Double-check your `.env.local` file has correct Supabase URL and key
- Restart the dev server after changing `.env.local`

### Database errors
- Make sure you ran both SQL files in order
- Check Supabase logs in Dashboard → Logs

### TypeScript errors
- Run `npm install` to ensure all dependencies are installed
- Restart your IDE/editor

## 🏗️ Project Structure

```
/app                    # Next.js app directory
  /(auth)              # Login/signup pages
  /(protected)         # Authenticated pages (dashboard, etc.)
  /actions             # Server actions
/components
  /layout              # Navigation, headers
  /ui                  # Reusable components
/lib
  /supabase            # Database clients
  /types               # TypeScript definitions
/supabase
  /migrations          # Database schema files
  seed.sql             # Initial data
```

## 💡 Next Steps

Once everything is working, you can:

1. **Explore the codebase** - Check out the components and pages
2. **Read the docs** - Understand the full vision in `/docs`
3. **Start building** - Move to Phase 2 (franchise creation)

## 🤝 Need Help?

- Check `/docs/setup-complete.md` for detailed information
- Review the agent instructions in `/.claude/agents/`
- Consult Supabase docs: https://supabase.com/docs
- Check Next.js docs: https://nextjs.org/docs

---

**Ready to build Phase 2?** Start with the franchise creation feature!
