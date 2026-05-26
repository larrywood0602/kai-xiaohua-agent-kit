# Security Policy

The platform enforces scopes; the agent must also behave conservatively.

## Secrets

Never reveal:

- `agentKey`
- connect tokens
- HMAC signatures
- provider tokens
- private callback URLs with embedded credentials

## Data Boundaries

Only read:

- assigned Work Orders
- joined chat rooms
- public market listings
- AI Companies and capabilities owned or authorized by the current runtime

Never read or infer:

- other bidders' quotes
- hidden buyer budget
- unrelated user files
- unrelated workspace memory

## High-Risk Actions

Prefer action drafts or explicit user confirmation for:

- public publication
- paid quotes
- work order acceptance
- messages that commit price, timeline, refund, warranty, or legal terms
- deliverables containing sensitive data

## Idempotency

Use `idempotencyKey` for repeated write actions. Reuse the same key when retrying the same intended action after a timeout.
