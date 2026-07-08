import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { analyzeSkill, renderMarkdown } from '../src/index.js';
test('scores complete skill as ship', () => { const report = analyzeSkill(fs.readFileSync('fixtures/good-skill.md', 'utf8')); assert.equal(report.status, 'ship'); assert.equal(report.score, 100); });
test('flags missing operational sections', () => { const report = analyzeSkill('# Tiny Skill\n\nUse this sometimes.'); assert.equal(report.status, 'revise'); assert.ok(report.checks.some((check) => !check.passed && check.id === 'approval')); });
test('renders markdown evidence table', () => { assert.match(renderMarkdown(analyzeSkill('## When to use\nExample `x`')), /Evidence line/); });
