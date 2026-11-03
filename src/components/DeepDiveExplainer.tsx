import React from 'react';
import { Sparkles, X, Lightbulb, Compass, ArrowRight, BookOpen } from 'lucide-react';
import { MathView } from './MathView';

interface DeepDiveExplainerProps {
  isOpen: boolean;
  onClose: () => void;
  stepNumber: number;
  stepTitle: string;
  explanationText: string;
  onReturnToProblem: () => void;
}

export const DeepDiveExplainer: React.FC<DeepDiveExplainerProps> = ({
  isOpen,
  onClose,
  stepNumber,
  stepTitle,
  explanationText,
  onReturnToProblem,
}) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="deep-dive-heading"
      className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 md:p-6"
    >
      <div className="bg-white rounded-3xl shadow-2xl border border-amber-200/80 w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Amber Spotlight Header */}
        <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 px-6 py-5 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-inner">
              <Lightbulb className="w-5 h-5 text-amber-100 animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-wider font-semibold text-amber-100">
                  Step {stepNumber} Intuition Spotlight
                </span>
                <span className="text-[10px] bg-white/25 px-2 py-0.5 rounded-full font-mono font-medium">
                  Deep Concept
                </span>
              </div>
              <h2 id="deep-dive-heading" className="text-lg font-bold text-white font-serif-math">
                Why Did We Do That?
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close deep dive spotlight"
            className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/20 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1 bg-amber-50/20">
          <div className="flex items-center gap-2 p-3 bg-white rounded-xl border border-amber-100 shadow-xs">
            <Compass className="w-4 h-4 text-amber-700 shrink-0" />
            <span className="text-xs font-medium text-stone-700">
              Examining Milestone: <strong className="text-stone-950 font-semibold">{stepTitle}</strong>
            </span>
          </div>

          <div className="prose prose-stone max-w-none text-sm text-stone-800 leading-relaxed bg-white p-5 rounded-2xl border border-stone-200/80 shadow-xs">
            <MathView content={explanationText} />
          </div>

          <div className="bg-amber-100/60 rounded-2xl p-4 border border-amber-200 text-xs text-amber-950 flex items-start gap-3">
            <BookOpen className="w-4 h-4 text-amber-800 mt-0.5 shrink-0" />
            <div>
              <h4 className="font-semibold mb-0.5">The Socratic Takeaway</h4>
              <p className="text-amber-900/90 leading-relaxed">
                Math is rarely about memorizing rules in the dark. Every substitution or algebra trick was invented by a human seeking to turn an unfamiliar puzzle into something familiar.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-stone-50 border-t border-stone-200 flex items-center justify-between shrink-0">
          <button
            onClick={onClose}
            className="text-xs font-medium text-stone-500 hover:text-stone-800 cursor-pointer"
          >
            Keep reading later
          </button>
          <button
            onClick={onReturnToProblem}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white font-semibold text-xs shadow-sm hover:shadow transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Got it, back to the problem!</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
