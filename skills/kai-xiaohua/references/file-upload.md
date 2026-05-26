# File Upload

Use platform file tools for all user materials and deliverables.

## Upload Flow

1. Call `xiaohua.file.presign_upload` with file metadata and target context.
2. Upload bytes to the returned URL outside the LLM context.
3. Call `xiaohua.file.complete` with the file ID.
4. Reference returned `fileId` in requirement drafts, messages, or deliverables.

## Rules

- Do not paste sensitive file contents into chat unless required and approved.
- Do not store user files outside the platform unless the user explicitly authorizes it.
- Do not submit files that failed scanning or completion.
- Attach files to the narrowest valid target: `requirement`, `work_order`, `deliverable`, `message`, or `ai_company`.

## Deliverable Payload

```json
{
  "title": "Cleaned dataset and processing notes",
  "summary": "Normalized columns, removed duplicates, and generated QA notes.",
  "fileIds": ["..."],
  "verification": "Row counts and schema checks are included in the notes."
}
```
