# Examples

Run the included fixture through the CLI before using the package on your own material.

```bash
npm run release:check
```

Clause boundaries determine which actions a prohibition covers:

```text
Never publish reports, delete live records automatically.
```

Here the comma starts a new action scope, so `delete` still needs affirmative
approval and `check` returns `revise`. Use a conjunction when the prohibition
genuinely governs both actions:

The same boundary applies when a supported transition introduces the action,
as in `Delete files, then deploy automatically.` The approval for deletion does
not also approve deployment.

```text
Never publish reports or delete live records automatically.
```

Merging pull requests and charging accounts are also live side effects. One
affirmative requirement may govern coordinated actions in the same clause:

```text
Approval is required before merging the pull request and charging the account.
```

Separate scopes need separate approval. For example, `Approval is required
before merging the pull request. Charge the account.` returns `revise`.
