---
name: vercel-react-best-practices
description: Core performance and modernization guidelines for Next.js 16+ and React 19. Focuses on Server Components, Streaming, and React 19 primitives (`use`, `useActionState`, `useOptimistic`).
license: MIT
metadata:
  author: vercel
  version: "2.0.0"
---

# Next.js 16 & React 19 Best Practices

Comprehensive guide for building production-grade applications with **Next.js 16+ (App Router)** and **React 19**, maintained by Vercel Engineering.

## When to Apply

Reference these guidelines when:

- Writing **Server Actions** (use `useActionState`)
- Accessing **Params/Search Params** (use `await`)
- Implementing **Data Fetching** (use `unstable_cache`, `use()`)
- Optimizing **UI Feedback** (use `useOptimistic`)
- Reducing **Bundle Size** (Tailwind v4, `optimizePackageImports`)

## Rule Categories

| Priority     | Category            | Focus                                                                                         |
| ------------ | ------------------- | --------------------------------------------------------------------------------------------- |
| **CRITICAL** | **Next.js 16 Core** | Async APIs (`await params`), Data Cache (`unstable_cache`), Server Actions (`useActionState`) |
| **CRITICAL** | **React 19**        | Unwrapping Promises (`use`), Instant Feedback (`useOptimistic`), Compiler                     |
| **HIGH**     | **Server Perf**     | Streaming, Parallel Fetching (`Promise.all`), Non-blocking (`after`)                          |
| **MEDIUM**   | **Client Perf**     | URL State (`nuqs`), Fetching (`SWR`)                                                          |
| **MEDIUM**   | **Bundle & CSS**    | Tailwind v4, Package Optimization                                                             |

## Key Changes in v2.0 (Feb 2026)

- **Async Request APIs**: `params`, `searchParams`, `headers`, `cookies` are now async.
- **React 19 Primitives**: New hooks replace legacy patterns (`useFormState` -> `useActionState`).
- **Data Caching**: `unstable_cache` is the standard for localized persistence.
- **React Compiler**: Manual `useMemo`/`useCallback` largely deprecated.

> **Full Documentation**: See `AGENTS.md` for detailed code examples and anti-patterns.
