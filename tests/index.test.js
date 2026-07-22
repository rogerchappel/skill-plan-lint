import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { analyzeSkill, renderMarkdown } from '../src/index.js';
test('scores complete skill as ship', () => { const report = analyzeSkill(fs.readFileSync('fixtures/good-skill.md', 'utf8')); assert.equal(report.status, 'ship'); assert.equal(report.score, 100); });
test('flags missing operational sections', () => { const report = analyzeSkill('# Tiny Skill\n\nUse this sometimes.'); assert.equal(report.status, 'revise'); assert.ok(report.checks.some((check) => !check.passed && check.id === 'approval')); });
test('renders markdown evidence table', () => { assert.match(renderMarkdown(analyzeSkill('## When to use\nExample `x`')), /Evidence line/); });

test('blocks destructive skills whose approval language is only negated', () => {
  const report = analyzeSkill(fs.readFileSync('fixtures/unsafe-negated-approval.md', 'utf8'));
  const approval = report.checks.find((check) => check.id === 'approval');

  assert.equal(approval.passed, false);
  assert.equal(report.score, 85);
  assert.equal(report.status, 'revise');
});

test('rejects common approval negations while preserving affirmative requirements', () => {
  const negations = [
    'Approval is not required.',
    'No need for user confirmation.',
    'Proceed without permission.',
    'Never ask for approval.'
  ];

  for (const statement of negations) {
    const report = analyzeSkill(`## Approval Requirements\n${statement}`);
    assert.equal(report.checks.find((check) => check.id === 'approval').passed, false, statement);
  }

  const affirmatives = [
    'Approval is required before deleting files.',
    'Require user confirmation before publishing.',
    'Obtain explicit permission before live writes.'
  ];

  for (const statement of affirmatives) {
    const report = analyzeSkill(`## Approval Requirements\n${statement}`);
    assert.equal(report.checks.find((check) => check.id === 'approval').passed, true, statement);
  }
});
