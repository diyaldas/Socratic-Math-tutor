import React from 'react';
import { CheckCircle2, Lock, ArrowRight, Sparkles, BookOpen } from 'lucide-react';
import { StepMilestone } from '../utils/mathParser';

interface MilestoneTrackerProps {
  milestones: StepMilestone[];
  currentStepIndex: number;
  onSelectStep?: (index: number) => void;
  onWhyDidWeDoThat: () => void;
  onRequestHint: () => void;
  onNextStep: () => void;
  isLoading: boolean;
}

export const MilestoneTracker: React.FC<MilestoneTrackerProps> = ({
  milestones,
  currentStepIndex,
  onSelectStep,
  onWhyDidWeDoThat,
  onRequestHint,
  onNextStep,
  isLoading,
}) => {
  const isLastStep = currentStepIndex >= milestones.length - 1;

  return (
    <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-4 md:p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-semibold text-sm">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-semibold text-stone-900 text-sm">Socratic Roadmap</h3>
            <p className="text-xs text-stone-500">
              Step {currentStepIndex + 1} of {milestones.length} • No spoilers, one milestone at a time
            </p>
          </div>
        </div>

        {/* Milestone action chips */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={onWhyDidWeDoThat}
            disabled={isLoading}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-amber-500/10 text-amber-800 border border-amber-300 hover:bg-amber-500/20 active:scale-95 transition-all disabled:opacity-50 cursor-pointer shadow-xs"
            title="Ask why this mathematical move is necessary"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
            <span>Why did we do that?</span>
          </button>
        </div>
      </div>

      {/* Steps List */}
      <div className="space-y-2">
        {milestones.map((m, idx) => {
          const isCurrent = idx === currentStepIndex;
          const isPast = idx < currentStepIndex;
          const isLocked = idx > currentStepIndex;

          return (
            <div
              key={m.stepNumber}
              onClick={() => {
                if (isPast && onSelectStep) onSelectStep(idx);
              }}
              className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all ${
                isCurrent
                  ? 'bg-amber-50/70 border-amber-300 shadow-xs'
                  : isPast
                  ? 'bg-stone-50/60 border-stone-200 text-stone-700 cursor-pointer hover:bg-stone-100'
                  : 'bg-stone-50/30 border-stone-100 text-stone-400 opacity-70'
              }`}
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 transition-transform ${
                  isCurrent
                    ? 'bg-amber-600 text-white ring-4 ring-amber-100 scale-105'
                    : isPast
                    ? 'bg-emerald-600 text-white'
                    : 'bg-stone-200 text-stone-500'
                }`}
              >
                {isPast ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : isLocked ? (
                  <Lock className="w-3.5 h-3.5" />
                ) : (
                  m.stepNumber
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-medium truncate ${
                      isCurrent ? 'text-amber-950 font-semibold' : isPast ? 'text-stone-800' : 'text-stone-400'
                    }`}
                  >
                    Step {m.stepNumber}: {m.title}
                  </span>
                  {isCurrent && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-200/70 text-amber-900 font-semibold uppercase tracking-wider">
                      Current
                    </span>
                  )}
                  {isPast && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-medium">
                      Mastered
                    </span>
                  )}
                </div>
              </div>

              {isCurrent && (
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRequestHint();
                    }}
                    disabled={isLoading}
                    className="text-[11px] px-2 py-1 rounded-md text-stone-600 hover:text-stone-900 bg-white border border-stone-200 hover:border-stone-300 transition-colors cursor-pointer"
                  >
                    Need Hint?
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onNextStep();
                    }}
                    disabled={isLoading}
                    className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-md bg-stone-900 text-white hover:bg-stone-800 transition-all cursor-pointer shadow-xs disabled:opacity-50"
                  >
                    <span>{isLastStep ? 'Wrap Up' : 'Next Step'}</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
