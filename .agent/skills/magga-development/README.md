# Magga Development Skill - README

## Overview

This skill provides comprehensive development guidelines for working with the **Magga** manga management system. It includes architecture patterns, code review checklists, common solutions, and reference implementations.

## Skill Structure

```
.agent/skills/magga-development/
├── SKILL.md              # Main skill instructions
├── README.md             # This file - usage documentation
└── examples/             # Reference implementations
    ├── api-route.ts      # Protected API endpoint example
    ├── server-component.tsx  # Next.js Server Component example
    └── form-component.tsx    # Client form with validation example
```

## When This Skill Activates

The agent will automatically use this skill when:

- Making changes to the Magga codebase
- Adding new features or fixing bugs
- Working with database schema (Prisma)
- Creating UI components (React/MUI)
- Implementing authentication flows
- Optimizing performance
- Deploying to Vercel

## What's Included

### 1. Architecture Decision Trees

- Adding new features (pages, components, API routes)
- Database schema changes workflow
- API route creation patterns

### 2. Code Review Checklist

Comprehensive checklists covering:

- General best practices
- Next.js specifics
- Database & Prisma
- Authentication & Security
- UI/UX considerations
- Performance optimizations

### 3. Common Patterns

Ready-to-use code patterns for:

- Server Components with database queries
- Protected API routes
- Form components with validation

### 4. Example Files

- **api-route.ts**: Complete example of a protected API endpoint with GET/POST handlers
- **server-component.tsx**: Server Component with metadata generation and ISR
- **form-component.tsx**: Client form with validation, error handling, and loading states

## Updating This Skill

To update or extend this skill:

1. **Edit SKILL.md** for new guidelines or patterns
2. **Add examples/** for new reference implementations
3. **Update README.md** to document changes

## Technology Stack Reference

- **Framework**: Next.js 16 (App Router)
- **Database**: Turso (LibSQL) with Prisma ORM
- **Authentication**: NextAuth.js
- **UI Library**: Material-UI (MUI)
- **Styling**: TailwindCSS
- **Language**: TypeScript

## Useful Commands

```bash
# Development
npm run dev

# Database
npx prisma migrate dev --name <name>
npx prisma generate
npx prisma studio

# Build
npm run build
```

## Related Documentation

- `d:\magga\README.md` - Project overview
- `d:\magga\LAYOUT_CUSTOMIZATION_GUIDE.md` - UI customization
- `d:\magga\OPTIMIZATION_GUIDE.md` - Performance tips
- `d:\magga\VERCEL_SETUP.md` - Deployment guide
