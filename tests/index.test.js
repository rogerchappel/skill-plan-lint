import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { analyzeSkill, renderMarkdown } from '../src/index.js';
test('scores complete skill as ship', () => { const report = analyzeSkill(fs.readFileSync('fixtures/good-skill.md', 'utf8')); assert.equal(report.status, 'ship'); assert.equal(report.score, 100); });
test('flags missing operational sections', () => { const report = analyzeSkill('# Tiny Skill\n\nUse this sometimes.'); assert.equal(report.status, 'revise'); assert.ok(report.checks.some((check) => !check.passed && check.id === 'approval')); });
test('renders markdown evidence table', () => { assert.match(renderMarkdown(analyzeSkill('## When to use\nExample `x`')), /Evidence line/); });

test('requires every declared required check before shipping', () => {
  const complete = fs.readFileSync('fixtures/good-skill.md', 'utf8');

  for (const [section, expectedScore] of [
    ['Approval is required before applying or rejecting a proposal.', 85],
    ['## Examples\nRun `skill-plan-lint check SKILL.md`.', 90]
  ]) {
    const report = analyzeSkill(complete.replace(section, ''));

    assert.equal(report.score, expectedScore, section);
    assert.equal(report.status, 'incubate', section);
  }
});

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

test('requires approval for live external communication actions', () => {
  const actions = [
    'It may send a live customer email.',
    'It publishes a release announcement.',
    'It can post a message to the customer channel.'
  ];

  for (const action of actions) {
    const completeWithoutApproval = fs.readFileSync('fixtures/good-skill.md', 'utf8')
      .replace('Approval is required before applying or rejecting a proposal.', 'No approval is required.')
      .concat(`\n${action}\n`);
    const report = analyzeSkill(completeWithoutApproval);

    assert.equal(report.score, 85, action);
    assert.equal(report.status, 'revise', action);
  }
});

test('still requires approval evidence when external actions are prohibited', () => {
  const localOnly = fs.readFileSync('fixtures/good-skill.md', 'utf8')
    .replace('Approval is required before applying or rejecting a proposal.', 'No approval is required.')
    .concat('\nNever send customer email.\n');

  assert.equal(analyzeSkill(localOnly).status, 'incubate');
});

test('does not let approval for an unrelated action authorize email', () => {
  const skill = fs.readFileSync('fixtures/good-skill.md', 'utf8')
    .replace('Approval is required before applying or rejecting a proposal.', 'Approval is required before deleting files.')
    .concat('\nSide effects: send an email immediately.\n');

  const report = analyzeSkill(skill);

  assert.equal(report.score, 100);
  assert.equal(report.status, 'revise');
});

test('accepts approval evidence paired with the risky action', () => {
  const skill = fs.readFileSync('fixtures/good-skill.md', 'utf8')
    .replace('Approval is required before applying or rejecting a proposal.', 'Approval is required before sending email.');

  assert.equal(analyzeSkill(skill).status, 'ship');
});

test('requires scoped approval for every risky action', () => {
  const mixedApproval = fs.readFileSync('fixtures/good-skill.md', 'utf8')
    .replace('Approval is required before applying or rejecting a proposal.', 'Approval is required before deleting files.')
    .concat('\nSide effects: delete files and deploy the release.\n');
  const completeApproval = mixedApproval.concat('\nObtain confirmation before deploying the release.\n');

  assert.equal(analyzeSkill(mixedApproval).status, 'revise');
  assert.equal(analyzeSkill(completeApproval).status, 'ship');
});

test('keeps negated and prohibited actions out of scoped approval', () => {
  const skill = fs.readFileSync('fixtures/good-skill.md', 'utf8')
    .replace('Approval is required before applying or rejecting a proposal.', 'Approval is required before deleting files.')
    .concat('\nNever send customer email or deploy a release.\n');

  assert.equal(analyzeSkill(skill).status, 'ship');
});

test('does not let same-line approval authorize a later sentence', () => {
  const skill = fs.readFileSync('fixtures/good-skill.md', 'utf8')
    .replace('Approval is required before applying or rejecting a proposal.', 'Approval is required before deleting files. Send a customer email.');

  assert.equal(analyzeSkill(skill).status, 'revise');
});

test('accepts same-line actions when each statement has scoped approval', () => {
  const skill = fs.readFileSync('fixtures/good-skill.md', 'utf8')
    .replace('Approval is required before applying or rejecting a proposal.', 'Approval is required before deleting files. Obtain confirmation before sending customer email.');

  assert.equal(analyzeSkill(skill).status, 'ship');
});

test('requires approval for each repeated action occurrence', () => {
  const complete = fs.readFileSync('fixtures/good-skill.md', 'utf8');
  const partiallyApproved = complete.replace(
    'Approval is required before applying or rejecting a proposal.',
    'Send a customer email automatically. Approval is required before sending a different customer email.'
  );
  const independentlyApproved = complete.replace(
    'Approval is required before applying or rejecting a proposal.',
    'Approval is required before sending a customer email. Obtain confirmation before messaging another customer.'
  );

  assert.equal(analyzeSkill(partiallyApproved).status, 'revise');
  assert.equal(analyzeSkill(independentlyApproved).status, 'ship');
});

test('scopes approval negations and prohibited actions to their statements', () => {
  const skill = fs.readFileSync('fixtures/good-skill.md', 'utf8')
    .replace('Approval is required before applying or rejecting a proposal.', 'Approval is not required for local reads. Approval is required before deleting files.')
    .concat('\nNever send customer email. Deploy the release.\n');
  const report = analyzeSkill(skill);

  assert.equal(report.checks.find((check) => check.id === 'approval').passed, true);
  assert.equal(report.status, 'revise');
});

test('scopes prohibited actions to contrastive and semicolon clauses', () => {
  const complete = fs.readFileSync('fixtures/good-skill.md', 'utf8')
    .replace('Approval is required before applying or rejecting a proposal.', 'Approval is required before sending email.');

  for (const sideEffects of [
    'Never send customer email but deploy a release.',
    'Never send customer email; deploy a release.'
  ]) {
    const report = analyzeSkill(`${complete}\n${sideEffects}\n`);

    assert.equal(report.score, 100, sideEffects);
    assert.equal(report.status, 'revise', sideEffects);
  }
});

test('keeps coordinated actions under a shared prohibition', () => {
  const skill = fs.readFileSync('fixtures/good-skill.md', 'utf8')
    .replace('Approval is required before applying or rejecting a proposal.', 'Approval is required before deleting files.')
    .concat('\nNever send customer email or deploy a release.\n');

  assert.equal(analyzeSkill(skill).status, 'ship');
});

test('scopes a prohibition before a comma to its action', () => {
  const skill = fs.readFileSync('fixtures/good-skill.md', 'utf8')
    .replace('Approval is required before applying or rejecting a proposal.', 'Approval is required before publishing reports.')
    .concat('\nNever publish reports, delete live records automatically.\n');

  assert.equal(analyzeSkill(skill).status, 'revise');
});

test('scopes comma-separated actions introduced by transition words', () => {
  const complete = fs.readFileSync('fixtures/good-skill.md', 'utf8');

  for (const approval of [
    'Approval is required before deleting files, then deploy automatically.',
    'Approval is required before deleting files, next publish the report.'
  ]) {
    const skill = complete.replace('Approval is required before applying or rejecting a proposal.', approval);
    assert.equal(analyzeSkill(skill).status, 'revise', approval);
  }
});

test('keeps explicitly coordinated follow-on actions in one scope', () => {
  const skill = fs.readFileSync('fixtures/good-skill.md', 'utf8')
    .replace(
      'Approval is required before applying or rejecting a proposal.',
      'Approval is required before deleting files and then deploying automatically.'
    );

  assert.equal(analyzeSkill(skill).status, 'ship');
});
