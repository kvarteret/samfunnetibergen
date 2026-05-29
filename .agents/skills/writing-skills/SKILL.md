---
name: writing-skills
description: Create or update focused agent skills under .agents/skills for this repository.
---

# Writing Skills

Skills should teach a repeatable job. They should not be broad policy dumps or
copies of stale repo docs.

## Rules

- Use lowercase kebab-case directory names.
- Put the entry point in `SKILL.md`.
- Keep `SKILL.md` focused. Add `references/` only when the detail would distract
  from the main workflow.
- Include trigger terms in the description.
- Verify repository facts from current source before writing them.
- Prefer source paths over prose-only claims.

## Structure

```text
.agents/skills/<skill-name>/
  SKILL.md
  references/
```

## Review Checklist

- The skill has a clear job-to-be-done.
- It names when to use it.
- It avoids duplicating generic guidance already in `.agents/README.md`.
- It does not place generic rules in `.claude` or `.pi`.
