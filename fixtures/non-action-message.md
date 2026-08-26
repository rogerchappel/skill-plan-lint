# Complete Skill

## When to use
Use this skill when a plan needs deterministic validation.

## Inputs and tools
Provide a Markdown skill file and use the local CLI.

## Side-effect boundaries
The check is local-only and does not mutate the input.

## Approval requirements
Approval is required before deleting files.

## Examples
Run `skill-plan-lint check SKILL.md` and inspect each error message.

## Validation workflow
Verify the result with the test suite and CLI smoke check.

## Limitations and fallback
Natural-language interpretation is out of scope; fall back to human review.
