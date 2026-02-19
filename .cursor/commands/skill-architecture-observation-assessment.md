---
description: Assess PR review observations and propose concrete changes to address feedback
---

# PR Review Observation Assessment

Analyze the provided PR review observation/comment and propose a structured plan to address it.

## Instructions

1. **Understand the Observation**: Parse the reviewer's feedback to identify:
   - The core concern or issue raised
   - Any architectural principles being referenced
   - Specific files or patterns being questioned

2. **Analyze Current Implementation**: Review the affected code to understand:
   - What the current implementation does
   - Why it was implemented this way
   - What dependencies or coupling exists

3. **Check Architectural Context**: Read relevant documentation:
   - `.cursor/plans/edd-documents/ADA_V3_FOLDER_STRUCTURE.md` for folder structure guidance
   - Any referenced EDD documents
   - Related architectural decision records

4. **Propose Changes**: Create a concrete proposal with:
   - Summary of the recommended approach
   - Table of files to modify/delete with actions
   - Rationale aligned with the reviewer's concerns

5. **Present for Approval**: Format the response as:

```
## Reviewer's Concern
[Summarize the key points from the observation]

## Recommended Approach
[Describe the solution approach]

## Affected Files

| File | Action |
|------|--------|
| `path/to/file.py` | Delete/Modify/Create |
| ... | ... |

## Rationale
[Explain how this addresses the feedback]

Should I implement these changes?
```

## Example Usage

When a user shares a PR review comment like:
> "Unless we migrate all the github related services from aidx_server, there is no need to do this partial migration..."

The command should:
1. Identify this is about avoiding partial migrations
2. Find files that create partial coupling (e.g., services containers that still import from aidx_server)
3. Propose removing the partial migration layer and using existing services directly
4. List all files that need to be deleted or simplified
