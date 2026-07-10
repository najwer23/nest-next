# Repository Guidelines

## General Rules

- Use TypeScript everywhere.
- Keep code strongly typed.
- Do not use `any` unless there is no reasonable alternative.
- Follow existing project structure.
- Keep files focused on one responsibility.
- Do not introduce unnecessary dependencies.

## Backend (NestJS)

- Use dependency injection.
- Business logic belongs in services.
- Controllers should only handle HTTP concerns.
- Validate external API responses before persistence.
- Never expose raw provider errors.
- Use domain errors with proper HTTP status codes.

## Database (Prisma)

- Database changes require migrations.
- Do not modify production data manually.
- Prisma models must contain explicit relations.
- New required columns need migration handling.

## Frontend (Next.js)

- Prefer App Router patterns.
- Use Server Components by default.
- Use Client Components only when hooks/browser APIs are required.
- Handle loading, error, and success states clearly.
- Keep API calls inside dedicated API helpers.

## Testing

- Test failure scenarios.
- Test external API failures.
- Test duplicate prevention.