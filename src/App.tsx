import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  Sparkles,
  BookOpen,
  PenTool,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  Lightbulb,
} from 'lucide-react';
import { Header } from './components/Header';
import { ProblemUploader } from './components/ProblemUploader';
import { MilestoneTracker } from './components/MilestoneTracker';
import { ChatThread } from './components/ChatThread';
import { ScratchpadModal } from './components/ScratchpadModal';
import { DeepDiveExplainer } from './components/DeepDiveExplainer';
import { MathView } from './components/MathView';
import { formatMilestones, StepMilestone } from './utils/mathParser';
import {
  ChatMessage,
  ProblemAnalysis,
  SampleProblem,
  TutorActionType,
} from './types/mathTutor';

export default function App() {
  const [sampleProblems, setSampleProblems] = useState<SampleProblem[]>([]);
  const [currentProblem, setCurrentProblem] = useState<ProblemAnalysis | null>(null);
  const [uploadedImagePreview, setUploadedImagePreview] = useState<string | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modals state
  const [isScratchpadOpen, setIsScratchpadOpen] = useState(false);
  const [deepDiveData, setDeepDiveData] = useState<{
    isOpen: boolean;
    stepNumber: number;
    stepTitle: string;
    text: string;
  }>({
    isOpen: false,
    stepNumber: 1,
    stepTitle: '',
    text: '',
  });

  // Fetch sample problems on initial mount
  useEffect(() => {
    fetch('/api/sample-problems')
      .then((res) => res.json())
      .then((data) => {
        if (data.samples) {
          setSampleProblems(data.samples);
        }
      })
      .catch((err) => console.error('Failed to load sample problems:', err));
  }, []);

  // Format milestones for visual tracker
  const milestones: StepMilestone[] = formatMilestones(
    currentProblem?.milestones || [],
    currentStepIndex
  );

  // 1. Analyze Problem (Image or Text)
  const handleAnalyzeProblem = async (options: {
    imageBase64?: string;
    mimeType?: string;
    problemText?: string;
  }) => {
    setIsLoading(true);
    setErrorMessage(null);

    if (options.imageBase64) {
      setUploadedImagePreview(options.imageBase64);
    } else {
      setUploadedImagePreview(null);
    }

    try {
      const response = await fetch('/api/analyze-problem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(options),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to analyze the problem.');
      }

      const data = await response.json();
      const analysis: ProblemAnalysis = data.analysis;

      setCurrentProblem(analysis);
      setCurrentStepIndex(0);

      // Create opening tutor message
      const initialMessage: ChatMessage = {
        id: `msg-${Date.now()}`,
        sender: 'tutor',
        text: analysis.firstStepGuidance,
        timestamp: Date.now(),
        actionType: 'start',
        stepIndex: 0,
        modelUsed: data.modelUsed,
      };

      setMessages([initialMessage]);
    } catch (err: any) {
      console.error('Error analyzing problem:', err);
      setErrorMessage(err.message || 'Something went wrong while analyzing the problem.');
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Send multi-turn chat message
  const handleSendMessage = async (
    userText: string,
    actionType: TutorActionType = 'general_chat',
    scratchpadImageBase64?: string
  ) => {
    if (!currentProblem) return;

    setIsLoading(true);
    setErrorMessage(null);

    const stepTitle = currentProblem.milestones[currentStepIndex] || `Step ${currentStepIndex + 1}`;

    // Append student message to state (unless it's an internal system action button like hint/next_step without text)
    const newMessages = [...messages];
    const userMsgId = `user-${Date.now()}`;

    let displayedUserText = userText;
    if (actionType === 'why_did_we_do_that' && !userText) {
      displayedUserText = `Why did we do that in Step ${currentStepIndex + 1}? What is the conceptual intuition?`;
    } else if (actionType === 'hint' && !userText) {
      displayedUserText = `Can I get a gentle hint on Step ${currentStepIndex + 1}?`;
    } else if (actionType === 'next_step' && !userText) {
      displayedUserText = `I understand this step! How do we proceed to the next milestone?`;
    }

    if (displayedUserText) {
      newMessages.push({
        id: userMsgId,
        sender: 'user',
        text: displayedUserText,
        timestamp: Date.now(),
        actionType,
        stepIndex: currentStepIndex,
        scratchpadThumbnail: scratchpadImageBase64,
      });
      setMessages(newMessages);
    }

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          history: newMessages,
          currentStepIndex,
          currentStepTitle: stepTitle,
          actionType,
          userMessage: displayedUserText,
          scratchpadImageBase64: scratchpadImageBase64 || null,
          problemLatex: currentProblem.latexProblem,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to communicate with tutor.');
      }

      const data = await response.json();

      const tutorMessage: ChatMessage = {
        id: `tutor-${Date.now()}`,
        sender: 'tutor',
        text: data.text,
        timestamp: Date.now(),
        actionType: data.actionType,
        stepIndex: currentStepIndex,
        isDeepDive: data.isDeepDive,
        thoughtSummary: data.thoughtText,
        modelUsed: data.modelUsed,
      };

      setMessages((prev) => [...prev, tutorMessage]);

      // If user asked "why_did_we_do_that", offer quick Spotlight view option
      if (actionType === 'why_did_we_do_that') {
        setDeepDiveData({
          isOpen: true,
          stepNumber: currentStepIndex + 1,
          stepTitle,
          text: data.text,
        });
      }

      // If action was next_step, advance milestone index
      if (actionType === 'next_step' && currentStepIndex < (currentProblem.milestones.length - 1)) {
        setCurrentStepIndex((prev) => prev + 1);
        confetti({
          particleCount: 40,
          spread: 60,
          origin: { y: 0.8 },
        });
      }
    } catch (err: any) {
      console.error('Error during chat:', err);
      setErrorMessage(err.message || 'The tutor encountered an issue. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Handle scratchpad submission
  const handleScratchpadSubmit = (imageBase64: string, studentNote: string) => {
    setIsScratchpadOpen(false);
    handleSendMessage(studentNote, 'check_scratchpad', imageBase64);
  };

  // 4. Quick Actions
  const handleWhyDidWeDoThat = () => {
    const stepTitle = currentProblem?.milestones[currentStepIndex] || `Step ${currentStepIndex + 1}`;
    handleSendMessage(
      `Why did we do that in Step ${currentStepIndex + 1} (${stepTitle})? What is the deep mathematical intuition?`,
      'why_did_we_do_that'
    );
  };

  const handleRequestHint = () => {
    handleSendMessage('', 'hint');
  };

  const handleNextStep = () => {
    handleSendMessage('', 'next_step');
  };

  const handleResetProblem = () => {
    setCurrentProblem(null);
    setUploadedImagePreview(null);
    setMessages([]);
    setCurrentStepIndex(0);
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen bg-stone-100/60 flex flex-col text-stone-900 font-sans selection:bg-amber-200">
      <Header
        onNewProblem={handleResetProblem}
        onOpenScratchpad={() => setIsScratchpadOpen(true)}
        hasActiveProblem={!!currentProblem}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 flex flex-col">
        {errorMessage && (
          <div className="mb-4 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-rose-600 font-medium hover:underline text-xs"
            >
              Dismiss
            </button>
          </div>
        )}

        {!currentProblem ? (
          <div className="flex-1 flex items-center justify-center py-6">
            <ProblemUploader
              onAnalyze={handleAnalyzeProblem}
              isLoading={isLoading}
              sampleProblems={sampleProblems}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1 min-h-[calc(100vh-8rem)]">
            {/* Left Column: Problem Overview & Socratic Roadmap */}
            <div className="lg:col-span-5 flex flex-col gap-4">
              {/* Problem Statement Card */}
              <div className="bg-white rounded-3xl border border-stone-200 shadow-xs p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 uppercase tracking-wider">
                      {currentProblem.category}
                    </span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-stone-100 text-stone-600">
                      {currentProblem.difficulty}
                    </span>
                  </div>
                  <button
                    onClick={handleResetProblem}
                    className="text-xs text-stone-500 hover:text-stone-900 underline cursor-pointer"
                  >
                    Change Problem
                  </button>
                </div>

                <div>
                  <h3 className="font-bold text-stone-900 text-base font-serif-math">
                    {currentProblem.problemTitle}
                  </h3>
                </div>

                {/* Mathematical Equation Display */}
                <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80 text-center">
                  <MathView content={`$$${currentProblem.latexProblem}$$`} />
                </div>

                {/* Uploaded photo thumbnail if any */}
                {uploadedImagePreview && (
                  <div>
                    <span className="text-[11px] font-medium text-stone-500 block mb-1">
                      Uploaded Photo Source:
                    </span>
                    <div className="rounded-xl overflow-hidden border border-stone-200 max-h-36 bg-stone-900 flex items-center justify-center">
                      <img
                        src={uploadedImagePreview}
                        alt="Original math problem source"
                        className="max-h-36 object-contain"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Roadmap Milestone Stepper */}
              <MilestoneTracker
                milestones={milestones}
                currentStepIndex={currentStepIndex}
                onWhyDidWeDoThat={handleWhyDidWeDoThat}
                onRequestHint={handleRequestHint}
                onNextStep={handleNextStep}
                isLoading={isLoading}
              />

              {/* Socratic Pedagogy Guarantee */}
              <div className="bg-amber-500/10 border border-amber-300/60 rounded-2xl p-4 text-xs text-amber-950 flex items-start gap-3">
                <Lightbulb className="w-4 h-4 text-amber-700 mt-0.5 shrink-0" />
                <div className="space-y-1">
                  <span className="font-bold block">The Socratic Promise</span>
                  <p className="text-amber-900/90 leading-relaxed text-[11px]">
                    We will never skip steps or dump numerical outputs. If any line feels abstract, hit{' '}
                    <strong className="text-amber-950 font-semibold underline decoration-amber-500">"Why did we do that?"</strong>{' '}
                    to understand the conceptual heart of the technique.
                  </p>
                </div>
              </div>
            </div>

            {/* Right Column: Multi-turn Chat Thread */}
            <div className="lg:col-span-7 flex flex-col h-[700px] lg:h-auto">
              <ChatThread
                messages={messages}
                onSendMessage={handleSendMessage}
                onOpenScratchpad={() => setIsScratchpadOpen(true)}
                onOpenDeepDiveModal={(msg) => {
                  setDeepDiveData({
                    isOpen: true,
                    stepNumber: currentStepIndex + 1,
                    stepTitle: currentProblem.milestones[currentStepIndex] || `Step ${currentStepIndex + 1}`,
                    text: msg.text,
                  });
                }}
                isLoading={isLoading}
                currentStepIndex={currentStepIndex}
                currentStepTitle={currentProblem.milestones[currentStepIndex]}
                totalSteps={currentProblem.milestones.length}
              />
            </div>
          </div>
        )}
      </main>

      {/* Modals */}
      <ScratchpadModal
        isOpen={isScratchpadOpen}
        onClose={() => setIsScratchpadOpen(false)}
        onSubmitScratchpad={handleScratchpadSubmit}
        isLoading={isLoading}
        currentStepTitle={
          currentProblem ? currentProblem.milestones[currentStepIndex] : undefined
        }
      />

      <DeepDiveExplainer
        isOpen={deepDiveData.isOpen}
        onClose={() => setDeepDiveData((prev) => ({ ...prev, isOpen: false }))}
        stepNumber={deepDiveData.stepNumber}
        stepTitle={deepDiveData.stepTitle}
        explanationText={deepDiveData.text}
        onReturnToProblem={() => setDeepDiveData((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
