# skill-plan-lint

Local-first linter for reusable agent skill instructions.

## Quickstart

```bash
npm install
npm test
npm run smoke
```

## CLI

```bash
node src/cli.js check fixtures/good-skill.md --markdown
node src/cli.js report docs --format=markdown
```

After installing the package, the same check is available through the bin:

```bash
skill-plan-lint check SKILL.md --markdown
skill-plan-lint --help
```

Directory targets are searched recursively for Markdown files. Reports use a
deterministic path order, and a directory containing no Markdown fails instead
of producing an empty successful report. File targets must use a `.md`
extension. The optional target defaults to `SKILL.md`; the only accepted output
flags are `--markdown` and `--format=markdown`.

## Scoring and status

The seven checks are required gates as well as weighted score components:
when to use (15), inputs and tools (15), side-effect boundaries (15), approval
requirements (15), examples (10), validation workflow (15), and limitations
and fallback (15), for 100 points total.

- `ship`: score at least 85, every required check passes, and every risky side
  effect has affirmative, action-scoped approval. Because all current checks
  are required, a complete plan scores 100.
- `incubate`: score at least 60, but one or more required checks are missing.
- `revise`: score below 60, or a risky side effect lacks action-scoped
  approval regardless of score.

The `check` command exits 0 only when every report is `ship`; both `incubate`
and `revise` reports exit 1. The `report` command remains informational.

## Verify

Run the release-readiness check before publishing or tagging:

```bash
npm run release:check
```

## Agent Skill

See [SKILL.md](./SKILL.md) for when to use this package, side-effect boundaries, approval requirements, examples, and validation.

## Safety Notes

The default workflow is local-first. It does not call external services, read credentials, publish packages, or perform live account writes.

Approval evidence must state an affirmative requirement, such as "Approval is required before deleting files." Negated statements such as "No approval is required" do not satisfy the approval check. Approval and negation are evaluated with a deterministic clause heuristic: sentence punctuation, semicolons, contrastive `but`, and a comma followed by a risky action start a new scope. The transition words `then`, `next`, `afterwards`, `subsequently`, and `finally` may appear between that comma and the action. Coordinated actions joined by `and` or `or` share their scope. Approval is scoped to the risky action in that clause: approval to delete files does not authorize a later clause that sends email, publishes, or deploys. Every clause containing a non-negated risky action needs its own affirmative approval, even when a later clause approves another occurrence of the same action type. Coordinated actions in one clause may share one approval requirement. A plan with an unapproved destructive or live side effect—including sending email or messages, posting, publishing, and deploying—is classified as `revise`, and `skill-plan-lint check` exits with status 1 even when its numeric score would otherwise be high enough to ship.

## Limitations

This MVP provides deterministic planning and linting helpers rather than a full natural-language parser. In particular, comma-separated risky actions are treated as separate clauses; use `and` or `or` when one prohibition intentionally governs coordinated actions. Human review remains required before trusting output for release, installation, or live connector execution.
