import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeLatex,
  parseMathBlocks,
  formatMilestones,
  extractCleanResponse,
} from './mathParser';

test('normalizeLatex converts bracket delimiters to dollar delimiters', () => {
  const input = 'Consider \\[ \\int x^2 dx \\] and \\( f(x) = 2x \\).';
  const expected = 'Consider $$ \\int x^2 dx $$ and $ f(x) = 2x $.';
  assert.equal(normalizeLatex(input), expected);
});

test('parseMathBlocks splits mixed text, inline math, and block math correctly', () => {
  const text = 'Here is an integral $$ \\int_0^1 x dx = \\frac{1}{2} $$ and an inline variable $x = 3$. Great work!';
  const blocks = parseMathBlocks(text);

  assert.equal(blocks.length, 5);
  assert.equal(blocks[0].type, 'text');
  assert.match(blocks[0].content, /Here is an integral/);

  assert.equal(blocks[1].type, 'block-math');
  assert.equal(blocks[1].content, '\\int_0^1 x dx = \\frac{1}{2}');

  assert.equal(blocks[2].type, 'text');
  assert.match(blocks[2].content, /and an inline variable/);

  assert.equal(blocks[3].type, 'inline-math');
  assert.equal(blocks[3].content, 'x = 3');

  assert.equal(blocks[4].type, 'text');
  assert.match(blocks[4].content, /Great work!/);
});

test('formatMilestones correctly marks completed, current, and locked steps', () => {
  const titles = [
    'Choose substitution variable u',
    'Calculate differential du',
    'Substitute into integral',
    'Integrate and reverse substitute'
  ];

  // At step index 1 (second step, 0-indexed)
  const milestones = formatMilestones(titles, 1);
  assert.equal(milestones.length, 4);

  // Step 1: completed and unlocked
  assert.equal(milestones[0].isCompleted, true);
  assert.equal(milestones[0].isCurrent, false);
  assert.equal(milestones[0].isUnlocked, true);

  // Step 2: current and unlocked
  assert.equal(milestones[1].isCompleted, false);
  assert.equal(milestones[1].isCurrent, true);
  assert.equal(milestones[1].isUnlocked, true);

  // Step 3: locked
  assert.equal(milestones[2].isCompleted, false);
  assert.equal(milestones[2].isCurrent, false);
  assert.equal(milestones[2].isUnlocked, false);
});

test('extractCleanResponse separates thought tags from answer text', () => {
  const raw = '<thought>Thinking about u-substitution...</thought>Let us choose $u = \\ln(x)$.';
  const result = extractCleanResponse(raw);
  assert.equal(result.thoughtText, 'Thinking about u-substitution...');
  assert.equal(result.cleanText, 'Let us choose $u = \\ln(x)$.');
});
