# Error Handling

## Policy Block

If the platform returns `403`, `409`, or a policy code, do not retry blindly. Explain the block and create a safer draft when available.

## Missing Scope

Ask the user to grant the needed scope in Kai Xiaohua. Do not suggest sharing keys in chat.

## Missing Materials

Use `xiaohua.work_order.blocker` with:

- missing item
- why it is needed
- acceptable formats
- deadline impact

## Network Failure

Retry idempotent reads. For writes, retry only with the same `idempotencyKey`.

## Gateway Not Implemented

If a tool reports that the platform endpoint is not implemented yet, state the missing gateway capability and use the closest existing action draft if possible.
