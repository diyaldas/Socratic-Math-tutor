/**
 * Math and LaTeX text parsing utilities for Socratic Math Tutor
 */

export interface ParsedBlock {
  type: 'text' | 'inline-math' | 'block-math';
  content: string;
}

/**
 * Normalizes different LaTeX delimiters to standard $ and $$ formats
 * e.g., \[ ... \] -> $$ ... $$, \( ... \) -> $ ... $
 */
export function normalizeLatex(text: string): string {
  if (!text) return '';
  return text
    // Replace \[ ... \] with $$ ... $$
    .replace(/\\\[([\s\S]*?)\\\]/g, '$$$$$1$$$$')
    // Replace \( ... \) with $ ... $
    .replace(/\\\(([\s\S]*?)\\\)/g, '$$$1$$');
}

/**
 * Splits text with embedded LaTeX formulas ($...$ or $$...$$) into structured blocks
 * for safe and accurate KaTeX rendering.
 */
export function parseMathBlocks(text: string): ParsedBlock[] {
  if (!text) return [];
  const normalized = normalizeLatex(text);
  const blocks: ParsedBlock[] = [];

  // Match block math ($$...$$) or inline math ($...$) or regular text
  // We handle $$...$$ first, then $...$
  const regex = /(\$\$[\s\S]*?\$\$|\$(?!\$)[\s\S]*?\$)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(normalized)) !== null) {
    const matchIndex = match.index;
    if (matchIndex > lastIndex) {
      const textChunk = normalized.substring(lastIndex, matchIndex);
      if (textChunk.trim().length > 0 || textChunk.includes('\n')) {
        blocks.push({ type: 'text', content: textChunk });
      }
    }

    const matchedStr = match[0];
    if (matchedStr.startsWith('$$') && matchedStr.endsWith('$$')) {
      const inner = matchedStr.slice(2, -2).trim();
      blocks.push({ type: 'block-math', content: inner });
    } else if (matchedStr.startsWith('$') && matchedStr.endsWith('$')) {
      const inner = matchedStr.slice(1, -1).trim();
      blocks.push({ type: 'inline-math', content: inner });
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < normalized.length) {
    const trailing = normalized.substring(lastIndex);
    if (trailing.length > 0) {
      blocks.push({ type: 'text', content: trailing });
    }
  }

  return blocks;
}

export interface StepMilestone {
  stepNumber: number;
  title: string;
  isUnlocked: boolean;
  isCurrent: boolean;
  isCompleted: boolean;
}

/**
 * Parses structured step milestones from AI response or fallback
 */
export function formatMilestones(stepTitles: string[], currentStepIndex: number): StepMilestone[] {
  if (!stepTitles || stepTitles.length === 0) {
    return [
      { stepNumber: 1, title: 'Understand & Set Up Problem', isUnlocked: true, isCurrent: true, isCompleted: false },
      { stepNumber: 2, title: 'Find Key Mathematical Relation', isUnlocked: false, isCurrent: false, isCompleted: false },
      { stepNumber: 3, title: 'Apply Algebraic/Calculus Rule', isUnlocked: false, isCurrent: false, isCompleted: false },
      { stepNumber: 4, title: 'Synthesize & Verify Solution', isUnlocked: false, isCurrent: false, isCompleted: false }
    ];
  }

  return stepTitles.map((title, idx) => ({
    stepNumber: idx + 1,
    title,
    isUnlocked: idx <= currentStepIndex,
    isCurrent: idx === currentStepIndex,
    isCompleted: idx < currentStepIndex,
  }));
}

/**
 * Extracts and sanitizes clean text from potential thought tags
 */
export function extractCleanResponse(text: string): { cleanText: string; thoughtText?: string } {
  if (!text) return { cleanText: '' };

  const thoughtRegex = /<thought>([\s\S]*?)<\/thought>/i;
  const match = thoughtRegex.exec(text);

  if (match) {
    const thoughtText = match[1].trim();
    const cleanText = text.replace(thoughtRegex, '').trim();
    return { cleanText, thoughtText };
  }

  return { cleanText: text.trim() };
}
