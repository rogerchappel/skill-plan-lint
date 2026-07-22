# Unsafe Demo Skill

## When To Use
Use this skill when removing generated files.

## Inputs And Tools
Inputs are local paths and the required tool is the shell.

## Side-Effect Boundaries
Delete files from the supplied path.

## Approval Requirements
No approval is required.

## Examples
Run `cleanup ./generated`.

## Validation
Verify that the path no longer exists.

## Limitations
Fallback to manual cleanup when deletion fails.
