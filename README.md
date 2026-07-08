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

## Limitations

This MVP provides deterministic planning and linting helpers. Human review remains required before trusting output for release, installation, or live connector execution.
