---
name: magga-development
description: Comprehensive development guidelines for Magga - a Next.js manga management system with Turso (LibSQL), Prisma ORM, NextAuth, and Material-UI. Use when making changes to the codebase, adding features, fixing bugs, or optimizing performance.
---

# Magga Development Skill

This skill provides guidelines for developing features in the Magga manga management system.

## Project Overview

**Magga** is a modern manga management web application built with:

- **Framework**: Next.js 16 (App Router)
- **Database**: Turso (LibSQL) with Prisma ORM
- **Authentication**: NextAuth.js
- **UI Library**: Material-UI (MUI)
- **Styling**: TailwindCSS
- **Language**: TypeScript

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
├─ Update `prisma/schema.prisma`
├─ Run `npx prisma migrate dev --name <descriptive-name>`
├─ Update TypeScript types if needed
└─ Update affected API endpoints and components
```

### 3. Adding API Routes

```
Creating new API endpoint?
├─ Create route.ts in `app/api/<endpoint>/`
├─ Implement proper HTTP methods (GET, POST, PUT, DELETE)
├─ Add authentication check using `getServerSession`
├─ Validate request body/params
├─ Handle errors gracefully
└─ Return appropriate status codes and data
```

## Code Review Checklist

When reviewing or creating code, ensure:

### ✅ General Best Practices

- [ ] Code follows TypeScript best practices
- [ ] No unused imports or variables
- [ ] Proper error handling with try-catch blocks
- [ ] Console.logs removed (except for debugging purposes)
- [ ] Accessibility considerations (ARIA labels, semantic HTML)

### ✅ Next.js Specific

- [ ] Server Components used by default
- [ ] Client Components marked with 'use client'
- [ ] Dynamic routes properly typed (params are awaited in Next.js 16)
- [ ] Images use `next/image` with proper sizing
- [ ] Fonts loaded via `next/font`
- [ ] Metadata properly configured for SEO

### ✅ Database & Prisma

- [ ] Prisma queries include necessary relations
- [ ] Database connections properly closed
- [ ] Indexes used for frequently queried fields
- [ ] Soft deletes considered for important data
- [ ] Migrations have descriptive names

### ✅ Authentication & Security

- [ ] Routes protected with authentication checks
- [ ] Role-based access control (RBAC) implemented where needed
- [ ] Input sanitization for user-provided data
- [ ] CSRF protection enabled
- [ ] Sensitive data not exposed in client components

### ✅ UI/UX

- [ ] Responsive design (mobile, tablet, desktop)
- [ ] Loading states with skeletons
- [ ] Error boundaries for error handling
- [ ] Consistent styling with MUI theme
- [ ] Form validation with helpful error messages

### ✅ Performance

- [ ] Static pages use ISR (Incremental Static Regeneration) when appropriate
- [ ] Dynamic imports for heavy components
- [ ] Images optimized (next/image with proper sizes)
- [ ] Database queries optimized (no N+1 queries)
- [ ] Caching strategies implemented

## Common Patterns

### Server Component with Database Query

```typescript
import { prisma } from "@/lib/prisma";

export default async function MangaPage({
  params,
}: {
  params: { id: string };
}) {
  const manga = await prisma.manga.findUnique({
    where: { id: params.id },
    include: {
      category: true,
      tags: true,
    },
  });

  if (!manga) {
    notFound();
  }

  return <MangaDetail manga={manga} />;
}
```

### Protected API Route

```typescript
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    // Validate and process request
    const result = await prisma.manga.create({
      data: body,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

### Form Component with Validation

```typescript
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TextField, Button } from "@mui/material";

export default function MangaForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const formData = new FormData(e.currentTarget);
      const response = await fetch("/api/manga", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(formData)),
      });

      if (!response.ok) throw new Error("Failed to create manga");

      router.push("/admin/manga");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return <form onSubmit={handleSubmit}>{/* Form fields */}</form>;
}
```

## Testing Guidelines

### Before Committing

1. Run `npm run build` to ensure no build errors
2. Test the feature in development mode
3. Check for TypeScript errors
4. Verify database migrations work correctly
5. Test authentication flows if applicable

### Deployment to Vercel

1. Ensure environment variables are set in Vercel
2. Database connection strings configured
3. Run migrations on production database
4. Test critical flows after deployment

## File Organization

```
d:\magga\
├── app/
│   ├── (auth)/           # Authentication pages
│   ├── admin/            # Admin dashboard and management
│   ├── api/              # API routes
│   ├── components/       # React components
│   │   ├── features/     # Feature-specific components
│   │   ├── forms/        # Form components
│   │   ├── layout/       # Layout components
│   │   └── ui/           # Reusable UI components
│   ├── manga/            # Manga-related pages
│   └── ...
├── lib/                  # Utility functions and configurations
├── prisma/               # Database schema and migrations
├── public/               # Static assets
└── types/                # TypeScript type definitions
```

## Helpful Commands

```bash
# Development
npm run dev                          # Start dev server

# Database
npx prisma migrate dev              # Create and apply migration
npx prisma generate                 # Generate Prisma Client
npx prisma studio                   # Open Prisma Studio
npx prisma db push                  # Push schema changes (dev only)

# Build & Production
npm run build                       # Build for production
npm start                           # Start production server

# Code Quality
npm run lint                        # Run ESLint
```

## Common Issues & Solutions

### Issue: Hydration Mismatch

**Solution**: Ensure server and client render the same content. Use `suppressHydrationWarning` if needed, or wrap dynamic content in Client Components.

### Issue: Database Connection Pool Exhausted

**Solution**: Ensure Prisma client is properly instantiated as a singleton. Check `lib/prisma.ts`.

### Issue: Session Not Persisting

**Solution**: Verify NextAuth configuration, ensure cookies are set correctly, check environment variables.

### Issue: Images Not Loading

**Solution**: Configure `next.config.mjs` with proper image domains. Use `next/image` component.

### Issue: Build Errors on Vercel

**Solution**: Check TypeScript errors locally first, ensure all dependencies are in package.json, verify environment variables.

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Material-UI Documentation](https://mui.com/material-ui/getting-started/)
- [NextAuth.js Documentation](https://next-auth.js.org/)
- Project-specific guides:
  - `LAYOUT_CUSTOMIZATION_GUIDE.md`
  - `OPTIMIZATION_GUIDE.md`
  - `VERCEL_SETUP.md`
