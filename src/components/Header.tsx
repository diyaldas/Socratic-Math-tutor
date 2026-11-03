import React from 'react';
import {
  Sparkles,
  BookOpen,
  RotateCcw,
  PenTool,
  Brain,
  GraduationCap,
} from 'lucide-react';

interface HeaderProps {
  onNewProblem: () => void;
  onOpenScratchpad: () => void;
  hasActiveProblem: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onNewProblem,
  onOpenScratchpad,
  hasActiveProblem,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-600 to-amber-500 text-white flex items-center justify-center shadow-xs">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-stone-900 tracking-tight text-sm sm:text-base font-serif-math">
                Socrates Rowan
              </span>
              <span className="hidden sm:inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                Socratic AI Math Mentor
              </span>
            </div>
            <p className="text-[11px] text-stone-500 hidden sm:block">
              Calculus & Algebra with Deep Intuition • Never a Calculator
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-100 text-stone-600 text-xs font-medium">
            <Brain className="w-3.5 h-3.5 text-amber-600" />
            <span>High Thinking Mode (gemini-4-argon)</span>
          </div>

          {hasActiveProblem && (
            <>
              <button
                onClick={onOpenScratchpad}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-stone-100 hover:bg-stone-200 text-stone-800 transition-colors cursor-pointer"
                title="Open math whiteboard scratchpad"
              >
                <PenTool className="w-3.5 h-3.5 text-stone-600" />
                <span className="hidden sm:inline">Scratchpad</span>
              </button>

              <button
                onClick={onNewProblem}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-stone-900 text-white hover:bg-stone-800 transition-all cursor-pointer shadow-xs"
                title="Start or upload a new math problem"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>New Problem</span>
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
