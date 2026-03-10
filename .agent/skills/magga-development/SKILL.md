---
name: magga-development
description: Comprehensive development guidelines for Magga - a Next.js manga management system with PostgreSQL, Drizzle ORM, Better Auth, and Material-UI v7. Features include user profiles, blocking system, comment moderation, avatar uploads. Use when making changes to the codebase, adding features, fixing bugs, or optimizing performance.
---

# Magga Development Skill

> **Note:** Additional rules are defined in `AGENTS.md` at the project root. Always read `AGENTS.md` before making changes.

This skill provides guidelines for developing features in the Magga manga management system.

## Project Overview

**Magga** is a modern manga management web application built with:

| Stack | Version |
|-------|---------|
| **Framework** | Next.js 16.1.6 (App Router) |
| **Database** | PostgreSQL via `pg` + `postgres` drivers |
| **ORM** | Drizzle ORM 0.45.1 |
| **Authentication** | Better Auth 1.5.3 (Credentials + Google OAuth) |
| **UI Library** | Material-UI (MUI) v7.3.8 |
| **Styling** | Tailwind CSS v4 |
| **Language** | TypeScript 5.9 |
| **Storage** | Cloudflare R2 (images & avatars via `@aws-sdk/client-s3`) |
| **Deployment** | Vercel Hobby Plan |

> ⚠️ **Vercel Hobby Limits**: Max 60s execution per Serverless Function. No background jobs. Free plan = 1 project. Keep Edge Functions lightweight.

## When to Use This Skill

Use this skill when:
- Adding new features to Magga
- Fixing bugs or issues
- Optimizing performance
- Working with the database schema
- Implementing UI components
- Setting up authentication flows
- Deploying to Vercel

## Architecture Decision Trees

### 1. Adding a New Feature

```
Is it a new page?
├─ YES → Create in `app/` directory following App Router conventions
│         ├─ Use Server Components by default
│         ├─ Add 'use client' only when needed (forms, interactivity)
│         └─ Create loading.tsx and error.tsx for better UX
│
└─ NO → Is it a component?
         ├─ YES → Is it UI-only or feature-specific?
         │        ├─ UI-only → Add to `app/components/ui/`
         │        └─ Feature-specific → Add to `app/components/features/`
         │
         └─ NO → Is it an API endpoint?
                  └─ YES → Create in `app/api/` directory
                           ├─ Validate input with Zod
                           ├─ Check authentication/authorization
                           └─ Use proper HTTP status codes
```

### 2. Database Schema Changes

```
Need to modify database?
├─ Update `db/schema.ts` (PostgreSQL dialect)
├─ Run `npm run db:generate` then `npm run db:migrate`
├─ Update TypeScript types if needed
└─ Update affected API endpoints and components
```

### 3. Adding API Routes

```
Creating new API endpoint?
├─ Create route.ts in `app/api/<endpoint>/`
├─ Implement proper HTTP methods (GET, POST, PUT, DELETE)
├─ Add authentication check using Better Auth session
├─ Validate request body/params with Zod
├─ Handle errors gracefully
└─ Return appropriate status codes and data
```

## Code Review Checklist

### ✅ General Best Practices

- [ ] Code follows TypeScript best practices
- [ ] No unused imports or variables
- [ ] Proper error handling with try-catch blocks
- [ ] Console.logs removed (except for debugging purposes)
- [ ] Accessibility considerations (ARIA labels, semantic HTML)

### ✅ Next.js 16+ Specific

- [ ] Server Components used by default
- [ ] Client Components marked with `'use client'`
- [ ] `params` and `searchParams` are **awaited** (async in Next.js 15+)
- [ ] `cookies()` and `headers()` are **awaited**
- [ ] Images use `next/image` with proper sizing
- [ ] Fonts loaded via `next/font`
- [ ] Metadata properly configured for SEO

### ✅ Database & Drizzle

- [ ] Drizzle queries include necessary relations (use `db.query` API)
- [ ] Indexes used for frequently queried fields
- [ ] Migrations have descriptive names
- [ ] No N+1 queries — use `.with()` for relations
- [ ] Use `db.transaction()` for multi-step writes

### ✅ Authentication & Security

- [ ] Routes protected with Better Auth session checks
- [ ] Role-based access control (RBAC) implemented where needed
- [ ] Input sanitization for user-provided data
- [ ] CSRF protection enabled
- [ ] Sensitive data not exposed in client components

### ✅ UI/UX (MUI v7)

- [ ] Responsive design (mobile, tablet, desktop)
- [ ] Loading states with skeletons
- [ ] Error boundaries for error handling
- [ ] Consistent styling with MUI theme
- [ ] Form validation with helpful error messages

### ✅ Performance

- [ ] Static pages use ISR when appropriate
- [ ] Dynamic imports for heavy components
- [ ] Images optimized (`next/image` with proper sizes)
- [ ] Database queries optimized (no N+1 queries)
- [ ] API routes stay under 60s (Vercel Hobby limit)

## Common Patterns

### Server Component with Database Query

```typescript
import { db } from "@/db";
import { manga as mangaTable } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";

export default async function MangaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params; // Must await in Next.js 15+

  const manga = await db.query.manga.findFirst({
    where: eq(mangaTable.id, id),
    with: {
      category: true,
      mangaTags_mangaId: {
        with: { tag_tagId: true }
      }
    },
  });

  if (!manga) notFound();

  return <MangaDetail manga={manga} />;
}
```

### Protected API Route

```typescript
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { manga as mangaTable } from "@/db/schema";

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const [result] = await db.insert(mangaTable).values(body).returning();
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

### Form Component with React 19 Patterns

```typescript
"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { TextField, Button } from "@mui/material";

export default function MangaForm() {
  const router = useRouter();
  const [state, action, pending] = useActionState(
    async (prevState: unknown, formData: FormData) => {
      const response = await fetch("/api/manga", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(formData)),
      });
      if (!response.ok) return { error: "Failed to create manga" };
      router.push("/admin/manga");
      router.refresh();
      return { success: true };
    },
    null
  );

  return <form action={action}>{/* Form fields */}</form>;
}
```

## File Organization

```
magga/
├── AGENTS.md             # Project rules (read this first!)
├── app/
│   ├── (auth)/           # Authentication pages (login, register)
│   ├── admin/            # Admin dashboard and management
│   ├── api/              # API routes
│   │   └── user/         # User-specific APIs (avatar, blocked, comments)
│   ├── components/       # React components
│   │   ├── features/     # Feature-specific components
│   │   ├── forms/        # Form components
│   │   ├── layout/       # Layout components
│   │   └── ui/           # Reusable UI components
│   ├── manga/            # Manga-related pages
│   ├── profile/          # User profile pages
│   └── settings/         # Account settings
├── db/                   # Drizzle instance + schema (PostgreSQL)
│   ├── index.ts          # Singleton db connection
│   └── schema.ts         # Table definitions
├── lib/                  # Utility functions
│   ├── auth.ts           # Better Auth config
│   └── rate-limit.ts     # Rate limiting
├── public/               # Static assets
└── types/                # TypeScript type definitions
```

## Helpful Commands

```bash
# Development
npm run dev                # Start dev server

# Database (PostgreSQL + Drizzle)
npm run db:generate        # Generate migration files
npm run db:migrate         # Apply migrations to DB
npm run db:push            # Push schema (dev/prototyping only)
npm run db:studio          # Open Drizzle Studio UI

# Build & Production
npm run build              # Build for production
npm start                  # Start production server

# Code Quality
npm run lint               # Run ESLint
```

## Common Issues & Solutions

### Issue: Hydration Mismatch
**Solution**: Ensure server and client render the same content. Use `suppressHydrationWarning` or wrap dynamic content in Client Components.

### Issue: `params` / `cookies()` / `headers()` not awaited
**Solution**: All these APIs are async in Next.js 15+. Always `await` them.
```typescript
const { id } = await params;
const cookieStore = await cookies();
const headersList = await headers();
```

### Issue: Session Not Persisting
**Solution**: Verify Better Auth config in `lib/auth.ts`, check `BETTER_AUTH_SECRET` and `BETTER_AUTH_URL` env vars, ensure cookies are set correctly.

### Issue: Build Errors on Vercel
**Solution**: Run `npm run build` locally first. Check TypeScript errors, verify all env vars are set in Vercel dashboard.

### Issue: API Route Timeout on Vercel Hobby
**Solution**: Hobby plan has 60s max execution. Avoid long-running operations. Move heavy tasks to async patterns or reduce data processing.

### Issue: Database Connection Pool Exhausted
**Solution**: Ensure Drizzle client is a singleton in `db/index.ts`. Avoid creating new connections per request.

## Resources

- [Next.js Docs](https://nextjs.org/docs)
- [Drizzle ORM Docs](https://orm.drizzle.team/docs/overview)
- [MUI v7 Docs](https://mui.com/material-ui/getting-started/)
- [Better Auth Docs](https://better-auth.com/docs)
- [Vercel Hobby Plan Limits](https://vercel.com/docs/limits/overview)
