# Demo Skill

## When To Use
Use this skill when packaging durable agent workflows.
## Inputs And Tools
Inputs are local Markdown files and required tools are shell and node.
## Side-Effect Boundaries
The workflow is local-only and does not mutate live skills.
## Approval Requirements
Approval is required before applying or rejecting a proposal.
## Examples
Run `skill-plan-lint check SKILL.md`.
## Validation
Verify with tests and a smoke command.
## Limitations
Fallback to human review when instructions are ambiguous.
