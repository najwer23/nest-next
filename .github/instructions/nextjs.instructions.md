# Next.js Standards

- Use the App Router and `src/app` by default.
- Prefer Server Components for pages, layouts, and shared UI.
- Add `"use client"` only when a component needs browser-only behavior such as:
  - `useState`, `useEffect`, or other React hooks
  - event handlers like `onClick`
  - browser APIs (`window`, `localStorage`, DOM access)
  - third-party client-only libraries.
- Do not import client-only modules into server components.
- Client components must handle UI states explicitly:
  - pending/loading state
  - error/failed state
  - success state
- Use route segment `loading.tsx`, `error.tsx`, and `not-found.tsx` for navigation state handling when appropriate.
- Use `next/navigation` helpers (`redirect`, `notFound`, `cookies()`) in server components and route handlers.
- Keep page controllers thin: fetch data in server components or helpers, and move all business logic out of page files.
- Route handlers belong in `src/app/api/**/route.ts`; keep API logic separate from component rendering.

Avoid unnecessary manual loading flags and duplicate client-side state management when server-rendered data is available.