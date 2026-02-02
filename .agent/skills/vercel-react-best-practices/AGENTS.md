# React & Next.js Best Practices (v2.0)

**Version 2.0.0**
**Target:** Next.js 16+ (App Router), React 19, Tailwind CSS v4
**Updated:** February 2026

> **Note:** This document is optimized for AI agents to generate high-performance, modern code. It focuses on the latest stable features available in Next.js 16 and React 19.

---

## Abstract

A comprehensive guide for building production-grade applications with Next.js 16+ and React 19. This guide prioritizes **Server Components**, **Streaming**, and **React 19 Primitives** (`use`, `useActionState`, `useOptimistic`) over legacy patterns.

---

## Table of Contents

1. [Next.js 16 Core Patterns](#1-nextjs-16-core-patterns) — **CRITICAL**
   - 1.1 [Async Request APIs (params/searchParams)](#11-async-request-apis)
   - 1.2 [Data Cache with `unstable_cache`](#12-data-cache-with-unstable_cache)
   - 1.3 [Server Actions with `useActionState`](#13-server-actions-with-useactionstate)
2. [React 19 Primitives](#2-react-19-primitives) — **CRITICAL**
   - 2.1 [Unwrapping Promises with `use()`](#21-unwrapping-promises-with-use)
   - 2.2 [Optimistic UI with `useOptimistic`](#22-optimistic-ui-with-useoptimistic)
   - 2.3 [React Compiler & Memoization](#23-react-compiler--memoization)
3. [Server-Side Performance](#3-server-side-performance) — **HIGH**
   - 3.1 [Parallel Data Fetching](#31-parallel-data-fetching)
   - 3.2 [Deduplication with `React.cache`](#32-deduplication-with-reactcache)
   - 3.3 [Non-blocking Work with `after()`](#33-non-blocking-work-with-after)
4. [Client-Side Performance](#4-client-side-performance) — **MEDIUM**
   - 4.1 [Nuqs for URL State](#41-nuqs-for-url-state)
   - 4.2 [SWR/TanStack Query for Client Fetching](#42-swrtanstack-query-for-client-fetching)
5. [Bundle Size & CSS](#5-bundle-size--css) — **MEDIUM**
   - 5.1 [Tailwind CSS v4 & Lightning CSS](#51-tailwind-css-v4--lightning-css)
   - 5.2 [Package Import Optimization](#52-package-import-optimization)

---

## 1. Next.js 16 Core Patterns

### 1.1 Async Request APIs

**Impact: CRITICAL (Fixes "sync-dynamic-apis" errors)**

In Next.js 15/16, accessing `params`, `searchParams`, `headers()`, and `cookies()` is asynchronous. You **MUST** await them before use.

**Incorrect: Synchronous access (Throws Error)**

```tsx
// ❌ Error: params must be awaited
export default function Page({ params }: { params: { slug: string } }) {
  return <div>{params.slug}</div>;
}
```

**Correct: Await before use**

```tsx
// ✅ Correct
type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function Page(props: Props) {
  const params = await props.params;
  const searchParams = await props.searchParams;

  return <div>{params.slug}</div>;
}
```

### 1.2 Data Cache with `unstable_cache`

**Impact: HIGH (Persistent caching)**

For expensive operations (DB queries, heavy computations) that need to persist across requests (unlike `React.cache` which is per-request), use `unstable_cache`.

> **Note:** Next.js 16 stabilizes parts of this API, but the pattern remains key.

**Incorrect: No caching or manual Redis**

```tsx
async function getTrendingPosts() {
  // ❌ Hits DB on every request from every user
  return db.posts.findMany({ where: { trending: true } });
}
```

**Correct: Cached with Revalidation Tags**

```tsx
import { unstable_cache } from "next/cache";

const getTrendingPosts = unstable_cache(
  async () => {
    return db.posts.findMany({ where: { trending: true } });
  },
  ["trending-posts"], // Key parts
  {
    revalidate: 3600, // 1 hour
    tags: ["posts"], // For on-demand revalidation
  },
);
```

**Revalidation:**

```tsx
import { revalidateTag } from 'next/cache'

export async function createPost() {
  await db.posts.create(...)
  revalidateTag('posts') // Purges the cache
}
```

### 1.3 Server Actions with `useActionState`

**Impact: CRITICAL (Standardized form mutations)**

Use React 19's `useActionState` (formerly `useFormState`) to handle Server Action states (loading, error, success) progressively.

**Incorrect: `useState` + `onSubmit` (Old School)**

```tsx
// ❌ Client-side heavy, manual loading state
function Form() {
  const [loading, setLoading] = useState(false)
  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    await saveData(...)
    setLoading(false)
  }
}
```

**Correct: `useActionState`**

```tsx
// actions.ts
"use server";
export async function createUser(prevState: any, formData: FormData) {
  try {
    await db.user.create({ name: formData.get("name") });
    return { success: true, message: "Created!" };
  } catch (e) {
    return { success: false, message: "Failed" };
  }
}

// Form.tsx
("use client");
import { useActionState } from "react";
import { createUser } from "./actions";

export function SignUpForm() {
  const [state, formAction, isPending] = useActionState(createUser, null);

  return (
    <form action={formAction}>
      <input name="name" />
      <button disabled={isPending}>
        {isPending ? "Saving..." : "Sign Up"}
      </button>
      {state?.message && <p>{state.message}</p>}
    </form>
  );
}
```

---

## 2. React 19 Primitives

### 2.1 Unwrapping Promises with `use()`

**Impact: HIGH (Cleaner Client Components)**

You can now pass Promises from Server Components to Client Components and unwrap them with `use()`.

**Incorrect: `useEffect` fetching**

```tsx
"use client";
function UserProfile({ userId }) {
  const [user, setUser] = useState(null);
  useEffect(() => {
    fetchUser(userId).then(setUser);
  }, [userId]);

  if (!user) return <Loading />;
}
```

**Correct: Promise Prop Injection**

```tsx
// page.tsx (Server)
export default function Page() {
  const userPromise = db.user.findFirst();
  return <UserProfile userPromise={userPromise} />;
}

// UserProfile.tsx (Client)
("use client");
import { use, Suspense } from "react";

export function UserProfile({ userPromise }) {
  return (
    <Suspense fallback={<Loading />}>
      <UserDetails userPromise={userPromise} />
    </Suspense>
  );
}

function UserDetails({ userPromise }) {
  const user = use(userPromise); // 🪄 Unwraps promise, suspends if pending
  return <div>{user.name}</div>;
}
```

### 2.2 Optimistic UI with `useOptimistic`

**Impact: HIGH (Instant user feedback)**

Show mutation results _instantly_ before the server responds.

```tsx
"use client";
import { useOptimistic } from "react";

function Messages({ initialMessages }) {
  const [messages, addOptimisticMessage] = useOptimistic(
    initialMessages,
    (state, newMessage) => [...state, newMessage],
  );

  const handleSend = async (formData) => {
    const text = formData.get("text");
    // 1. Show instantly
    addOptimisticMessage({ id: Math.random(), text, sending: true });
    // 2. Sync with server
    await sendMessage(formData);
  };

  return (
    <form action={handleSend}>
      {messages.map((m) => (
        <div key={m.id} style={{ opacity: m.sending ? 0.5 : 1 }}>
          {m.text}
        </div>
      ))}
      <input name="text" />
    </form>
  );
}
```

### 2.3 React Compiler & Memoization

**Impact: MEDIUM (Reduced boilerplate)**

With React Compiler (standard in Next.js 15+), manual memoization (`useMemo`, `useCallback`, `memo`) is largely **unnecessary**. The compiler automatically optimizes re-renders.

**Action:**

- **Stop** indiscriminately wrapping everything in `useMemo`.
- **Only** use them if profiling shows a specific performance bottleneck that the compiler missed.

---

## 3. Server-Side Performance

### 3.1 Parallel Data Fetching

**Impact: CRITICAL (Eliminates Waterfalls)**

Always start independent fetches locally in the component before awaiting them.

**Incorrect: Sequential Waterfalls**

```tsx
// ❌ Takes 3s + 2s = 5s
const user = await getUser();
const posts = await getPosts();
```

**Correct: Parallel Execution**

```tsx
// ✅ Takes max(3s, 2s) = 3s
const userPromise = getUser();
const postsPromise = getPosts();

const [user, posts] = await Promise.all([userPromise, postsPromise]);
```

### 3.2 Deduplication with `React.cache`

**Impact: MEDIUM (Per-request efficiency)**

Use `cache` for non-fetch data sources (like DB calls) to ensure they only run once per request, even if called in multiple components.

```tsx
import { cache } from "react";
import { db } from "@/lib/db";

export const getCurrentUser = cache(async () => {
  // Only hits DB once per request
  return await db.user.findFirst();
});
```

### 3.3 Non-blocking Work with `after()`

**Impact: MEDIUM (Faster TTFB)**

Use `after()` for side effects (logging, analytics) that shouldn't block the response.

```tsx
import { after } from 'next/server'

export async function GET() {
  after(() => {
    analytics.track('page_view')
    db.logs.create(...)
  })

  return Response.json({ ok: true })
}
```

---

## 4. Client-Side Performance

### 4.1 Nuqs for URL State

**Impact: MEDIUM (Type-safe URL state)**

For search params that control UI state (tabs, filters, dialogs), use `nuqs` instead of standard `useSearchParams`.

```tsx
import { useQueryState, parseAsBoolean } from "nuqs";

export function FeedbackDialog() {
  const [isOpen, setIsOpen] = useQueryState(
    "feedback",
    parseAsBoolean.withDefault(false),
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      ...
    </Dialog>
  );
}
```

### 4.2 SWR/TanStack Query for Client Fetching

**Impact: HIGH (Stale-while-revalidate)**

For client-side data fetching (that can't be Server Components), **never** use `useEffect` + `fetch`. Use SWR or TanStack Query.

```tsx
// ✅ Correct
const { data, error } = useSWR("/api/user", fetcher);
```

---

## 5. Bundle Size & CSS

### 5.1 Tailwind CSS v4 & Lightning CSS

**Impact: HIGH (Zero-runtime CSS)**

Tailwind v4 uses a Rust-based compiler (Lightning CSS).

- **No more `tailwind.config.js`** (mostly). Configure variables in CSS.
- **Engine-only**: Only generates CSS for classes you actually use.
- **Avoid CSS-in-JS**: Do not use `styled-components` or `@emotion` in new Next.js projects; they add runtime overhead and break Server Components.

### 5.2 Package Import Optimization

**Impact: MEDIUM**

Use `optimizePackageImports` in `next.config.js` for heavy common libraries.

```js
// next.config.js
module.exports = {
  experimental: {
    optimizePackageImports: ["lucide-react", "@mui/material", "lodash"],
  },
};
```

This allows you to write import { X } from 'lib' without barrel file penalties.
