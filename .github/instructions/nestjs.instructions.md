# NestJS Standards

- Controllers should only handle HTTP concerns: request validation, routing, metadata logging, and returning DTOs.
- Services own business logic, orchestration, and domain rules.
- Entity services enforce domain invariants and translate repository results into application-level models or errors.
- Repositories encapsulate direct Prisma access and should not contain business decisions.
- Prefer typed DTOs and config objects everywhere. Avoid `any` unless there is no reasonable alternative.
- Use `DomainException` (and its subclasses) for domain errors, and only use Nest `HttpException` classes when HTTP semantics are required.
- Never throw raw `Error` from application code.
- Use `ConfigModule` with typed `load` helpers for app and database config, instead of scattering `process.env` checks.
- Enable global validation with `whitelist`, `forbidNonWhitelisted`, and request transformation.
- External integrations must:
  - enforce timeouts
  - retry transient failures
  - validate provider responses before persisting anything
  - translate provider errors into domain-specific exceptions
- Example domain mapping:

ANALYTICS_PROVIDER_UNAVAILABLE -> HTTP 503

- Database writes should happen only after input and external response validation succeed.
- Write tests for happy paths and failure cases, including domain errors, duplicate prevention, and external provider failures.
- Keep feature modules focused and document them with module-level README files.
