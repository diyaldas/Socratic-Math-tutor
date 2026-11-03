import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SOCRATIC_SYSTEM_INSTRUCTION,
  buildTutorPrompt,
} from './socraticPrompts';

test('SOCRATIC_SYSTEM_INSTRUCTION enforces pedagogical rules and latex formatting', () => {
  assert.match(SOCRATIC_SYSTEM_INSTRUCTION, /NEVER BLURT OUT THE ENTIRE SOLUTION/);
  assert.match(SOCRATIC_SYSTEM_INSTRUCTION, /WALK THROUGH ONE STEP AT A TIME/);
  assert.match(SOCRATIC_SYSTEM_INSTRUCTION, /"WHY DID WE DO THAT\?" IS YOUR SPECIALTY/);
  assert.match(SOCRATIC_SYSTEM_INSTRUCTION, /BEAUTIFUL LATEX FORMATTING/);
});

test('buildTutorPrompt builds dedicated why_did_we_do_that prompt correctly', () => {
  const prompt = buildTutorPrompt({
    actionType: 'why_did_we_do_that',
    currentStepIndex: 1,
    currentStepTitle: 'Integration by parts setup',
    userMessage: 'Why did we pick u = ln(x) instead of dv = ln(x)?',
  });

  assert.match(prompt, /Why did we do that\?/);
  assert.match(prompt, /Integration by parts setup/);
  assert.match(prompt, /Why did we pick u = ln\(x\)/);
  assert.match(prompt, /The Everyday Analogy/);
  assert.match(prompt, /The "What If\?"/);
});

test('buildTutorPrompt builds scratchpad prompt correctly', () => {
  const prompt = buildTutorPrompt({
    actionType: 'check_scratchpad',
    currentStepIndex: 0,
    currentStepTitle: 'Derivative rule',
    userMessage: 'Did I apply the product rule properly here?',
  });

  assert.match(prompt, /scratchpad/i);
  assert.match(prompt, /whiteboard/i);
  assert.match(prompt, /Did I apply the product rule properly here\?/);
});
