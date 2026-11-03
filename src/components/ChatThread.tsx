import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Sparkles,
  HelpCircle,
  PenTool,
  Volume2,
  VolumeX,
  ArrowRight,
  Brain,
  Lightbulb,
  CheckCircle,
  Clock,
  Compass,
} from 'lucide-react';
import { ChatMessage, TutorActionType } from '../types/mathTutor';
import { MathView } from './MathView';

interface ChatThreadProps {
  messages: ChatMessage[];
  onSendMessage: (text: string, actionType?: TutorActionType) => void;
  onOpenScratchpad: () => void;
  onOpenDeepDiveModal: (message: ChatMessage) => void;
  isLoading: boolean;
  currentStepIndex: number;
  currentStepTitle?: string;
  totalSteps: number;
}

export const ChatThread: React.FC<ChatThreadProps> = ({
  messages,
  onSendMessage,
  onOpenScratchpad,
  onOpenDeepDiveModal,
  isLoading,
  currentStepIndex,
  currentStepTitle,
  totalSteps,
}) => {
  const [inputText, setInputText] = useState('');
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Auto scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Clean up speech synthesis
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleSpeak = (msg: ChatMessage) => {
    if (!('speechSynthesis' in window)) {
      alert('Speech synthesis is not supported in this browser.');
      return;
    }

    if (speakingMessageId === msg.id) {
      window.speechSynthesis.cancel();
      setSpeakingMessageId(null);
      return;
    }

    window.speechSynthesis.cancel();
    // Clean text of raw math delimiters for more natural speech
    const cleanForSpeech = msg.text
      .replace(/\$\$[\s\S]*?\$\$/g, ' mathematical expression ')
      .replace(/\$([^\$]+)\$/g, ' $1 ')
      .replace(/\\int/g, 'integral of')
      .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '$1 over $2')
      .replace(/\\sqrt\{([^}]+)\}/g, 'square root of $1');

    const utterance = new SpeechSynthesisUtterance(cleanForSpeech);
    utterance.rate = 0.95; // Slightly slower, calm teacher cadence
    utterance.pitch = 1.0;

    utterance.onend = () => {
      setSpeakingMessageId(null);
    };
    utterance.onerror = () => {
      setSpeakingMessageId(null);
    };

    setSpeakingMessageId(msg.id);
    window.speechSynthesis.speak(utterance);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;
    onSendMessage(inputText.trim(), 'general_chat');
    setInputText('');
  };

  const handleQuickAction = (actionType: TutorActionType, customPrompt?: string) => {
    if (isLoading) return;
    onSendMessage(customPrompt || '', actionType);
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
      {/* Thread Header */}
      <div className="px-5 py-3.5 bg-stone-50/90 border-b border-stone-200 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-2xl bg-amber-600 text-white flex items-center justify-center font-bold text-base shadow-xs">
              S
            </div>
            <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-stone-900">Socrates Rowan</h2>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900">
                Socratic Math Mentor
              </span>
            </div>
            <p className="text-xs text-stone-500">
              Guiding you step-by-step • Current: Step {currentStepIndex + 1} of {totalSteps}
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2">
          <button
            onClick={onOpenScratchpad}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-stone-900 text-white hover:bg-stone-800 transition-all cursor-pointer shadow-xs"
          >
            <PenTool className="w-3.5 h-3.5" />
            <span>Open Scratchpad</span>
          </button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5 bg-stone-50/30">
        {messages.map((msg) => {
          const isTutor = msg.sender === 'tutor';
          const isDeepDive = msg.isDeepDive || msg.actionType === 'why_did_we_do_that';

          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isTutor ? 'items-start' : 'items-end'} animate-in fade-in duration-200`}
            >
              <div className="flex items-center gap-2 mb-1 px-1">
                <span className="text-[11px] font-medium text-stone-500">
                  {isTutor ? 'Professor Socrates' : 'You'}
                </span>
                <span className="text-[10px] text-stone-400">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                {msg.modelUsed && (
                  <span className="text-[10px] font-mono px-1.5 py-0.2 bg-stone-100 text-stone-500 rounded">
                    {msg.modelUsed}
                  </span>
                )}
              </div>

              <div
                className={`max-w-[92%] sm:max-w-[85%] rounded-3xl p-4 md:p-5 text-sm shadow-xs transition-all ${
                  isTutor
                    ? isDeepDive
                      ? 'bg-amber-50/90 border-2 border-amber-300/80 text-amber-950 shadow-md'
                      : 'bg-white border border-stone-200 text-stone-900'
                    : 'bg-stone-900 text-white'
                }`}
              >
                {/* Deep Dive Badge */}
                {isDeepDive && (
                  <div className="flex items-center justify-between gap-2 pb-3 mb-3 border-b border-amber-200">
                    <div className="flex items-center gap-2 text-amber-800 font-semibold text-xs">
                      <Lightbulb className="w-4 h-4 text-amber-600 animate-pulse" />
                      <span>Deep Dive Intuition Spotlight</span>
                    </div>
                    <button
                      onClick={() => onOpenDeepDiveModal(msg)}
                      className="text-[11px] font-medium text-amber-900 bg-amber-200/80 hover:bg-amber-200 px-2 py-0.5 rounded-lg transition-colors cursor-pointer"
                    >
                      Focus View
                    </button>
                  </div>
                )}

                {/* Scratchpad thumbnail if user submitted working */}
                {msg.scratchpadThumbnail && (
                  <div className="mb-3 rounded-xl overflow-hidden border border-stone-300 bg-white">
                    <img
                      src={msg.scratchpadThumbnail}
                      alt="Student scratchpad work"
                      className="max-h-48 w-full object-contain bg-white"
                    />
                    <div className="p-1.5 bg-stone-100 text-[10px] text-stone-600 font-medium text-center">
                      Submitted Handwritten Scratchpad
                    </div>
                  </div>
                )}

                {/* Thought summary dropdown if tutor reasoned */}
                {msg.thoughtSummary && (
                  <details className="mb-3 p-2 rounded-xl bg-stone-100/80 text-xs text-stone-600 border border-stone-200">
                    <summary className="cursor-pointer font-medium text-[11px] text-stone-700 flex items-center gap-1.5">
                      <Brain className="w-3.5 h-3.5 text-stone-500" />
                      <span>Socratic Reasoning & Thought Process</span>
                    </summary>
                    <p className="mt-2 text-[11px] text-stone-600 whitespace-pre-wrap pl-5 border-l-2 border-stone-300">
                      {msg.thoughtSummary}
                    </p>
                  </details>
                )}

                {/* Message text with KaTeX support */}
                <MathView
                  content={msg.text}
                  className={!isTutor ? 'text-stone-100' : 'text-stone-900'}
                />

                {/* Tutor message controls (read aloud) */}
                {isTutor && (
                  <div className="mt-3 pt-2 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
                    <button
                      onClick={() => handleSpeak(msg)}
                      className="flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-stone-100 text-stone-600 transition-colors cursor-pointer"
                      title={speakingMessageId === msg.id ? 'Stop audio' : 'Listen to teacher explanation'}
                    >
                      {speakingMessageId === msg.id ? (
                        <>
                          <VolumeX className="w-3.5 h-3.5 text-amber-600" />
                          <span className="text-[11px] font-medium text-amber-700">Stop Voice</span>
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-3.5 h-3.5" />
                          <span className="text-[11px]">Read Aloud</span>
                        </>
                      )}
                    </button>
                    {isDeepDive && (
                      <span className="text-[10px] text-amber-700 font-medium">
                        Concept Explained Without Spoilers
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Loading state with thinking indicator */}
        {isLoading && (
          <div className="flex flex-col items-start animate-in fade-in">
            <div className="flex items-center gap-2 mb-1 px-1">
              <span className="text-[11px] font-medium text-stone-500">Professor Socrates</span>
              <span className="text-[10px] text-amber-600 font-mono animate-pulse">
                Reflecting carefully...
              </span>
            </div>
            <div className="bg-white border border-amber-200/80 rounded-3xl p-4 shadow-xs flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-700">
                <Brain className="w-4 h-4 animate-spin text-amber-600" />
              </div>
              <div>
                <p className="text-xs font-semibold text-stone-900">
                  Formulating compassionate Socratic guidance...
                </p>
                <p className="text-[11px] text-stone-500">
                  Setting up the next intuitive puzzle without revealing the final answer.
                </p>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Socratic Action Chips Bar */}
      <div className="p-3 bg-white border-t border-stone-200">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
          {/* Hero Action: "Why did we do that?" */}
          <button
            onClick={() =>
              handleQuickAction(
                'why_did_we_do_that',
                `Why did we do that specific step in ${currentStepTitle || 'this milestone'}? What is the intuition behind it?`
              )
            }
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-white font-semibold text-xs shadow-xs hover:from-amber-600 hover:to-amber-700 active:scale-95 transition-all shrink-0 cursor-pointer disabled:opacity-50"
          >
            <Lightbulb className="w-3.5 h-3.5" />
            <span>Why did we do that?</span>
          </button>

          {/* Hint Action */}
          <button
            onClick={() => handleQuickAction('hint', "I'm a little stuck on this step. Could you give me a gentle hint?")}
            disabled={isLoading}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 font-medium text-xs transition-colors shrink-0 cursor-pointer disabled:opacity-50"
          >
            <HelpCircle className="w-3.5 h-3.5 text-stone-500" />
            <span>Give me a small hint</span>
          </button>

          {/* Analogy Action */}
          <button
            onClick={() =>
              handleQuickAction(
                'why_did_we_do_that',
                'Can you explain this step with an everyday real-world analogy?'
              )
            }
            disabled={isLoading}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 font-medium text-xs transition-colors shrink-0 cursor-pointer disabled:opacity-50"
          >
            <Compass className="w-3.5 h-3.5 text-stone-500" />
            <span>Explain with analogy</span>
          </button>

          {/* Scratchpad Action */}
          <button
            onClick={onOpenScratchpad}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 font-medium text-xs transition-colors shrink-0 cursor-pointer"
          >
            <PenTool className="w-3.5 h-3.5 text-stone-500" />
            <span>Scratchpad</span>
          </button>

          {/* Next Step Action */}
          <button
            onClick={() => handleQuickAction('next_step', "I understand this step now! What's our next milestone?")}
            disabled={isLoading}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-stone-900 hover:bg-stone-800 text-white font-medium text-xs transition-colors shrink-0 cursor-pointer disabled:opacity-50"
          >
            <span>Next milestone</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {/* Input Form */}
        <form onSubmit={handleFormSubmit} className="flex items-center gap-2 mt-1">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isLoading}
            placeholder={`Ask Socrates anything about Step ${currentStepIndex + 1} (e.g. "Is my thought right? $u = 2x$")`}
            className="flex-1 px-4 py-2.5 rounded-2xl bg-stone-50 border border-stone-300 text-stone-900 text-xs focus:bg-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-all placeholder:text-stone-400"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isLoading}
            aria-label="Send message to Socratic tutor"
            className="p-2.5 rounded-2xl bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white shadow-xs transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
