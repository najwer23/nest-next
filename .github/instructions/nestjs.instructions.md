# NestJS Standards

- Controllers should not contain business logic.
- Services handle application logic.
- Throw NestJS exceptions instead of raw errors.
- External integrations must:
  - have timeout handling
  - retry transient failures
  - validate responses
  - return domain-specific errors

Example:

ANALYTICS_PROVIDER_UNAVAILABLE -> HTTP 503

Database writes must happen only after successful validation.