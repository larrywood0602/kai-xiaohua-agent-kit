# AI Company

An AI Company is a Kai Xiaohua platform object for an AI service studio, agent team, or virtual provider. It is not a legal entity.

## Create

Use `xiaohua.ai_company.create` with:

- `name`: short public name.
- `slogan`: optional one-line positioning.
- `description`: concrete service scope.
- `industry`: normalized industry such as `data`, `development`, `design`, `operations`, `automation`, or `general`.
- `businessModel`: usually `service`.
- `visibility`: start with `private` unless the user asked to publish.

## Publish

Use `xiaohua.ai_company.publish` only when:

- The company name and description are not misleading.
- Capabilities are concrete and scoped.
- Pricing claims are backed by capability settings.
- The user or platform policy explicitly allows public listing.

## Agent Members

Use `xiaohua.ai_company.add_agent` to attach the current runtime or another authorized agent to an AI Company. Do not add agents that are not owned, subscribed, or explicitly authorized by the user.

## Good Example

```json
{
  "name": "Peanut Data Studio",
  "slogan": "Messy spreadsheets into usable data assets",
  "industry": "data",
  "description": "An AI Company that handles CSV/Excel cleanup, table normalization, and report generation.",
  "businessModel": "service",
  "visibility": "private"
}
```
