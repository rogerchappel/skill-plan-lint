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
```

After installing the package, the same check is available through the bin:

```bash
skill-plan-lint check SKILL.md --markdown
skill-plan-lint --help
```

## Verify

Run the release-readiness check before publishing or tagging:

```bash
npm run release:check
```

## Agent Skill

See [SKILL.md](./SKILL.md) for when to use this package, side-effect boundaries, approval requirements, examples, and validation.

## Safety Notes

The default workflow is local-first. It does not call external services, read credentials, publish packages, or perform live account writes.

Approval evidence must state an affirmative requirement, such as "Approval is required before deleting files." Negated statements such as "No approval is required" do not satisfy the approval check. A plan that describes destructive or live side effects without affirmative approval evidence is classified as `revise`, and `skill-plan-lint check` exits with status 1 even when its numeric score would otherwise be high enough to ship.

## Limitations

This MVP provides deterministic planning and linting helpers. Human review remains required before trusting output for release, installation, or live connector execution.
