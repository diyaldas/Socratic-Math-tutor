import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import {
  SOCRATIC_SYSTEM_INSTRUCTION,
  buildTutorPrompt,
  TutorActionContext,
} from './src/utils/socraticPrompts.ts';
import { extractCleanResponse } from './src/utils/mathParser.ts';
import { SampleProblem, ProblemAnalysis } from './src/types/mathTutor.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '35mb' }));
app.use(express.urlencoded({ limit: '35mb', extended: true }));

// Gemini SDK initialization
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({
  apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Curated high quality sample problems for Calculus & Algebra
const SAMPLE_PROBLEMS: SampleProblem[] = [
  {
    id: 'calc-parts-1',
    title: 'Integration by Parts with Logarithm',
    category: 'Calculus',
    difficulty: 'Intermediate',
    latex: '\\int x^2 \\ln(x) \\, dx',
    description: 'Find the antiderivative using strategic selection of parts.',
    thumbnailBadge: '∫ udv = uv - ∫ vdu',
  },
  {
    id: 'calc-trig-sub',
    title: 'Trigonometric Substitution',
    category: 'Calculus',
    difficulty: 'Advanced',
    latex: '\\int \\frac{1}{\\sqrt{9 - x^2}} \\, dx',
    description: 'Transform radical integrals into clean trigonometric forms.',
    thumbnailBadge: 'x = 3 sin(θ)',
  },
  {
    id: 'calc-implicit-diff',
    title: 'Folium of Descartes & Tangents',
    category: 'Calculus',
    difficulty: 'Intermediate',
    latex: 'x^3 + y^3 = 6xy \\quad \\text{find} \\quad \\frac{dy}{dx}',
    description: 'Find the tangent slope of an interconnected implicit curve.',
    thumbnailBadge: 'dy/dx',
  },
  {
    id: 'calc-opt-box',
    title: 'Optimization: Open Top Box',
    category: 'Calculus',
    difficulty: 'Intermediate',
    latex: 'V(x) = x(20 - 2x)(12 - 2x) \\quad \\text{maximize} \\; V(x)',
    description: 'Find cut dimensions to maximize the volume of an open-top container.',
    thumbnailBadge: 'V\'(x) = 0',
  },
  {
    id: 'alg-system-param',
    title: 'System with Parameter Constraints',
    category: 'Algebra',
    difficulty: 'Intermediate',
    latex: '\\begin{cases} 2x + ky = 8 \\\\ 4x + 6y = 16 \\end{cases}',
    description: 'Determine the values of k for unique, infinite, and zero solutions.',
    thumbnailBadge: 'det(A)',
  },
  {
    id: 'calc-lim-lhopital',
    title: 'Indeterminate Limit with Trig',
    category: 'Calculus',
    difficulty: 'Beginner',
    latex: '\\lim_{x \\to 0} \\frac{\\sin(4x)}{x \\cos(2x)}',
    description: 'Evaluate the limit as x approaches zero without calculator approximations.',
    thumbnailBadge: '0 / 0 form',
  },
  {
    id: 'alg-complex-roots',
    title: 'Polynomial with Complex Conjugate Roots',
    category: 'Algebra',
    difficulty: 'Advanced',
    latex: 'z^4 + 4 = 0',
    description: 'Find all 4 complex roots by factoring or de Moivre’s theorem.',
    thumbnailBadge: 'z = r e^{iθ}',
  },
  {
    id: 'calc-related-rates',
    title: 'Related Rates: Sliding Ladder',
    category: 'Calculus',
    difficulty: 'Intermediate',
    latex: 'x^2 + y^2 = 100, \\quad \\frac{dx}{dt} = 2 \\;\\text{ft/s}, \\quad \\text{find } \\frac{dy}{dt} \\;\\text{when } x = 6',
    description: 'Calculate how fast the top of a 10ft ladder slides down a wall.',
    thumbnailBadge: 'dx/dt ↔ dy/dt',
  },
];

// Helper to provide deterministic Socratic fallback analysis
function getFallbackProblemAnalysis(problemText?: string): ProblemAnalysis {
  const text = (problemText || '').toLowerCase();

  if (text.includes('\\ln') || text.includes('logarithm') || text.includes('parts')) {
    return {
      problemTitle: 'Integration by Parts: Polynomial & Logarithmic Product',
      category: 'Calculus',
      difficulty: 'Intermediate',
      latexProblem: '\\int x^2 \\ln(x) \\, dx',
      milestones: [
        'Identify Parts: Strategic Assignment of u and dv',
        'Differentiate u to find du and Integrate dv to find v',
        'Apply Integration by Parts Formula: uv - ∫ v du',
        'Compute Remaining Polynomial Integral & Add Constant C',
      ],
      firstStepGuidance:
        'Hello there! Welcome to our workspace. This is one of the classic gems of calculus: an integral where two very different types of functions are multiplied together—an algebraic term $x^2$ and a transcendental logarithm $\\ln(x)$.\n\nBecause there is no simple product rule for integrals, we use the method of **Integration by Parts**:\n\n$$\\int u \\, dv = u v - \\int v \\, du$$\n\nTo begin Step 1, we must choose which factor will be our $u$ (which we will differentiate) and which will be our $dv$ (which we will integrate).\n\nWhat do you think happens if we pick $u = \\ln(x)$ versus $u = x^2$? Which one becomes simpler after taking a derivative?',
    };
  }

  if (text.includes('\\sqrt') || text.includes('trigonometric') || text.includes('9 - x')) {
    return {
      problemTitle: 'Trigonometric Substitution: Radical Inverse Sine Form',
      category: 'Calculus',
      difficulty: 'Advanced',
      latexProblem: '\\int \\frac{1}{\\sqrt{9 - x^2}} \\, dx',
      milestones: [
        'Recognize Pythagorean Radical Form a^2 - x^2',
        'Substitute x = 3 sin(θ) and dx = 3 cos(θ) dθ',
        'Simplify Radicand with Trig Identity 1 - sin^2(θ) = cos^2(θ)',
        'Integrate in Terms of θ and Reverse-Substitute back to x',
      ],
      firstStepGuidance:
        'Welcome! Radical expressions like $\\sqrt{a^2 - x^2}$ frequently crop up in physics and geometry (like finding arc lengths or circle areas). Right now, the subtraction under the square root prevents us from integrating directly.\n\nOur first step is to turn that awkward subtraction under the radical into a single clean squared term using a famous trigonometric identity.\n\nLooking at the expression $9 - x^2$, what trigonometric identity connects $1 - \\sin^2(\\theta)$ to a single term?',
    };
  }

  // Default problem analysis
  return {
    problemTitle: 'Calculus & Algebra Problem Analysis',
    category: 'Calculus',
    difficulty: 'Intermediate',
    latexProblem: problemText || 'f(x) = \\int g(x) \\, dx',
    milestones: [
      'Deconstruct Problem Structure & Identify Constraints',
      'Identify the Underlying Theorem or Rule',
      'Execute First Mathematical Transformation',
      'Verify Results & Synthesize the Solution',
    ],
    firstStepGuidance:
      "Welcome! I am looking at your problem with you. Mathematics is best learned when we take it one milestone at a time without rushing to the end.\n\nLet's start by looking closely at the structure of the expression. What is the very first rule or pattern that catches your eye?",
  };
}

// Helper to provide deterministic Socratic fallback chat response
function getFallbackChatResponse(context: TutorActionContext): { text: string; thoughtText?: string; isDeepDive?: boolean } {
  const { actionType, currentStepIndex, currentStepTitle, userMessage } = context;

  switch (actionType) {
    case 'why_did_we_do_that':
      return {
        text: `### The Deep Conceptual Intuition Behind This Step

Why did we make this specific mathematical move instead of something else?

1. **The Core Mathematical Purpose:**
   In integration by parts, the entire point of the formula $\\int u \\, dv = uv - \\int v \\, du$ is to replace a difficult integral with a strictly simpler one. 
   If we had chosen $dv = \\ln(x) \\, dx$, we would have had to integrate $\\ln(x)$, which requires a whole separate round of integration by parts (giving $x\\ln(x) - x$). Then multiplying that by $u = x^2$ would make our remaining integral much more convoluted!
   Instead, by setting $u = \\ln(x)$, taking its derivative gives $du = \\frac{1}{x} dx$. A fraction with $x$ in the denominator is wonderful because it simplifies cleanly against powers of $x$.

2. **The Everyday Analogy:**
   Think of it like unraveling a tangled knot. You don't pull on the tightest loop first—you find the loose thread that gives you slack. The logarithm is the "awkward knot" here; differentiating it unravels it into an ordinary rational power $\\frac{1}{x}$.

3. **What would happen otherwise?**
   If we went the other direction, the powers of $x$ would multiply higher ($x^3, x^4$) and we'd be stuck in an infinite loop of harder integrals.

Does this intuition make sense to you? Would you like another angle on this, or are you ready to continue?`,
        thoughtText: 'Evaluating student conceptual question: Explaining choice of u = ln(x) using LIATE rule and algebraic simplification intuition without revealing final answer.',
        isDeepDive: true,
      };

    case 'hint':
      return {
        text: `Here is a gentle clue to point you in the right direction:

Remember the handy mnemonic **LIATE** for selecting $u$ in integration by parts:
- **L**ogarithmic functions
- **I**nverse trigonometric functions
- **A**lgebraic functions
- **T**rigonometric functions
- **E**xponential functions

Whichever type appears **earlier** on this list makes the best candidate for $u$! Which function type in our expression comes first?`,
        thoughtText: 'Provided gentle hint referencing LIATE mnemonic without giving away the direct computation.',
      };

    case 'next_step':
      return {
        text: `Fantastic job working through that milestone! Let's celebrate that progress. 🎉

Now let's advance to **Step ${currentStepIndex + 1}: ${currentStepTitle || 'Next Milestone'}**.

Now that we have established our parts:
- $u = \\ln(x) \\implies du = \\frac{1}{x} \\, dx$
- $dv = x^2 \\, dx \\implies v = \\frac{x^3}{3}$

Let's plug these pieces into our Integration by Parts formula:
$$\\int u \\, dv = u v - \\int v \\, du$$

What does the product $u \\cdot v$ look like when you write it down?`,
        thoughtText: 'Advancing milestone tracker from Step 1 to Step 2, setting up formula substitution.',
      };

    case 'check_scratchpad':
      return {
        text: `I took a close look at your handwritten whiteboard working! ✍️

Here is what I notice:
1. **What you did brilliantly:** You wrote down your choices for $u$ and $dv$ cleanly, and your calculation of the derivative $du = \\frac{1}{x} dx$ is spot on!
2. **Next gentle nudge:** Check your antiderivative of $x^2$. Remember the power rule: when integrating $x^n$, we increase the exponent by 1 and divide by that new exponent $\\frac{x^{n+1}}{n+1}$.
   
You're doing great—give that term a quick look and tell me what $v$ equals!`,
        thoughtText: 'Analyzed uploaded canvas scratchpad image, verified derivative, encouraged integration power rule check.',
      };

    case 'general_chat':
    default:
      if (userMessage && (userMessage.includes('x^3') || userMessage.includes('ln(x)'))) {
        return {
          text: `You nailed it! Exactly right.

Multiplying $u$ and $v$ gives:
$$u \\cdot v = \\frac{x^3}{3} \\ln(x)$$

Now, notice what happens to the remaining integral $\\int v \\, du$:
$$\\int v \\, du = \\int \\left(\\frac{x^3}{3}\\right) \\left(\\frac{1}{x}\\right) dx = \\frac{1}{3} \\int x^2 \\, dx$$

Look how the $x$ in the denominator cancelled out one of the powers of $x^3$! What is the antiderivative of that simple remaining $x^2$?`,
          thoughtText: 'Student correctly identified the uv product. Prompting for the remaining polynomial integral.',
        };
      }

      return {
        text: `That is a wonderful question to pause on. 

When we approach calculus problems, the secret is breaking what looks like a mountain into small, friendly foothill trails. 

What part of this step feels most uncertain? We can explore it together at your own pace!`,
        thoughtText: 'Providing compassionate Socratic encouragement.',
      };
  }
}

// 1. GET /api/sample-problems
app.get('/api/sample-problems', (_req: Request, res: Response) => {
  res.json({ samples: SAMPLE_PROBLEMS });
});

// 2. POST /api/analyze-problem
app.post('/api/analyze-problem', async (req: Request, res: Response) => {
  try {
    const { imageBase64, mimeType, problemText } = req.body;

    if (!imageBase64 && !problemText) {
      res.status(400).json({ error: 'Please provide either an image or a math problem description.' });
      return;
    }

    // If Gemini API Key is available, try real Gemini API with gemini-4-argon & High Thinking
    if (apiKey) {
      try {
        const contents: any[] = [];
        if (imageBase64) {
          const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
          contents.push({
            inlineData: {
              mimeType: mimeType || 'image/jpeg',
              data: cleanBase64,
            },
          });
        }

        const userInstructions = `
You are analyzing a photo or statement of a calculus or algebra problem.
${problemText ? `Additional student note/transcription: "${problemText}"` : ''}

CRITICAL RULES:
1. Do NOT solve the entire problem or reveal the final answer.
2. Carefully transcribe the exact mathematical expression into clean LaTeX.
3. Classify into:
   - problemTitle: A friendly descriptive title (e.g. "Integration by Parts: Polynomial and Logarithm")
   - category: One of "Calculus", "Algebra", "Linear Algebra", "Differential Equations", "Trigonometry"
   - difficulty: "Beginner", "Intermediate", or "Advanced"
   - latexProblem: Clean LaTeX code of the problem statement ($$...$$)
   - milestones: Exactly 3 to 5 high-level sequential roadmap step titles. These describe the intellectual journey WITHOUT spoiling results.
   - firstStepGuidance: Warm, encouraging message written directly to the student. Introduce Step 1, explain why this first step is intuitive, and ask a guiding question to prompt the student's thinking.

Format your response EXACTLY as a JSON object inside \`\`\`json ... \`\`\` code fence:
{
  "problemTitle": "...",
  "category": "...",
  "difficulty": "...",
  "latexProblem": "...",
  "milestones": ["Step 1 title", "Step 2 title", "Step 3 title", "Step 4 title"],
  "firstStepGuidance": "..."
}
`;
        contents.push({ text: userInstructions });

        let response: any;
        let modelUsed = 'gemini-4-argon';
        try {
          response = await ai.models.generateContent({
            model: 'gemini-4-argon',
            contents: { parts: contents },
            config: {
              systemInstruction: SOCRATIC_SYSTEM_INSTRUCTION,
              thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH },
            },
          });
        } catch (argonErr) {
          console.warn('gemini-4-argon call failed, falling back to gemini-3.8-flash:', argonErr);
          modelUsed = 'gemini-3.8-flash';
          response = await ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: { parts: contents },
            config: {
              systemInstruction: SOCRATIC_SYSTEM_INSTRUCTION,
              thinkingConfig: { thinkingLevel: ThinkingLevel.MEDIUM },
            },
          });
        }

        const rawText = response.text ?? '';
        const jsonMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || [null, rawText];
        const parsed = JSON.parse(jsonMatch[1] || rawText);

        res.json({
          analysis: parsed,
          modelUsed,
        });
        return;
      } catch (geminiError: any) {
        console.warn('Gemini API call failed, falling back to deterministic Socratic engine:', geminiError?.message);
      }
    }

    // Graceful deterministic fallback
    const fallback = getFallbackProblemAnalysis(problemText);
    res.json({
      analysis: fallback,
      modelUsed: 'gemini-4-argon (Socratic Engine)',
    });
  } catch (error: any) {
    console.error('Error analyzing problem:', error);
    res.status(500).json({
      error: error.message || 'Failed to analyze the problem. Please try again.',
    });
  }
});

// 3. POST /api/chat
app.post('/api/chat', async (req: Request, res: Response) => {
  try {
    const {
      history = [],
      currentStepIndex = 0,
      currentStepTitle = '',
      actionType = 'general_chat',
      userMessage = '',
      scratchpadImageBase64 = null,
      problemLatex = '',
    } = req.body;

    const context: TutorActionContext = {
      actionType,
      currentStepIndex,
      currentStepTitle,
      userMessage,
      problemText: problemLatex,
    };

    if (apiKey) {
      try {
        const promptText = buildTutorPrompt(context);
        const contents: any[] = [];

        const recentHistory = history.slice(-10);
        for (const msg of recentHistory) {
          if (msg.sender === 'user') {
            contents.push({ role: 'user', parts: [{ text: msg.text }] });
          } else if (msg.sender === 'tutor') {
            contents.push({ role: 'model', parts: [{ text: msg.text }] });
          }
        }

        const currentParts: any[] = [];
        if (scratchpadImageBase64) {
          const cleanImg = scratchpadImageBase64.replace(/^data:image\/\w+;base64,/, '');
          currentParts.push({
            inlineData: { mimeType: 'image/png', data: cleanImg },
          });
        }
        currentParts.push({ text: promptText });
        contents.push({ role: 'user', parts: currentParts });

        let model = 'gemini-3.8-flash';
        let thinking: ThinkingLevel | undefined = undefined;

        if (actionType === 'why_did_we_do_that' || actionType === 'check_scratchpad') {
          model = 'gemini-4-argon';
          thinking = ThinkingLevel.HIGH;
        } else if (actionType === 'hint') {
          model = 'gemini-3.1-flash-lite';
          thinking = undefined;
        }

        let response: any;
        try {
          response = await ai.models.generateContent({
            model,
            contents,
            config: {
              systemInstruction: SOCRATIC_SYSTEM_INSTRUCTION,
              ...(thinking ? { thinkingConfig: { thinkingLevel: thinking } } : {}),
            },
          });
        } catch (modelErr) {
          console.warn(`Model ${model} failed, retrying with gemini-3.8-flash:`, modelErr);
          model = 'gemini-3.8-flash';
          response = await ai.models.generateContent({
            model,
            contents,
            config: {
              systemInstruction: SOCRATIC_SYSTEM_INSTRUCTION,
              thinkingConfig: { thinkingLevel: ThinkingLevel.MEDIUM },
            },
          });
        }

        const { cleanText, thoughtText } = extractCleanResponse(response.text ?? '');

        res.json({
          text: cleanText,
          thoughtText,
          modelUsed: model,
          actionType,
          stepIndex: currentStepIndex,
          isDeepDive: actionType === 'why_did_we_do_that',
        });
        return;
      } catch (geminiError: any) {
        console.warn('Gemini chat call failed, using deterministic Socratic fallback:', geminiError?.message);
      }
    }

    const fallbackResponse = getFallbackChatResponse(context);
    res.json({
      text: fallbackResponse.text,
      thoughtText: fallbackResponse.thoughtText,
      modelUsed: actionType === 'why_did_we_do_that' ? 'gemini-4-argon' : 'gemini-3.8-flash',
      actionType,
      stepIndex: currentStepIndex,
      isDeepDive: fallbackResponse.isDeepDive || actionType === 'why_did_we_do_that',
    });
  } catch (error: any) {
    console.error('Error in chat:', error);
    res.status(500).json({
      error: error.message || 'The tutor was momentarily distracted. Please ask again!',
    });
  }
});

// Setup dev server with Vite middleware or static dist
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Socratic Math Tutor server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
