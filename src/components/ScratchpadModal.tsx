import React, { useRef, useState, useEffect } from 'react';
import {
  X,
  RotateCcw,
  Trash2,
  Send,
  PenTool,
  Pencil,
  Highlighter,
  Eraser,
  Sparkles,
} from 'lucide-react';

interface ScratchpadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitScratchpad: (imageBase64: string, studentNote: string) => void;
  isLoading: boolean;
  currentStepTitle?: string;
}

export const ScratchpadModal: React.FC<ScratchpadModalProps> = ({
  isOpen,
  onClose,
  onSubmitScratchpad,
  isLoading,
  currentStepTitle,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState<'pen' | 'pencil' | 'highlighter' | 'eraser'>('pen');
  const [color, setColor] = useState('#1e293b');
  const [lineWidth, setLineWidth] = useState(3);
  const [history, setHistory] = useState<ImageData[]>([]);
  const [studentNote, setStudentNote] = useState('');

  // Initialize canvas
  useEffect(() => {
    if (!isOpen) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Resize for crisp rendering
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    ctx.scale(2, 2);

    // Initial fill with clean whiteboard background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, rect.width, rect.height);

    // Draw subtle math grid dots
    ctx.fillStyle = '#e2e8f0';
    for (let x = 20; x < rect.width; x += 20) {
      for (let y = 20; y < rect.height; y += 20) {
        ctx.fillRect(x, y, 1.5, 1.5);
      }
    }

    // Save initial state
    const initialImg = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setHistory([initialImg]);
  }, [isOpen]);

  if (!isOpen) return null;

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);

    if (tool === 'eraser') {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 24;
      ctx.globalAlpha = 1.0;
    } else if (tool === 'highlighter') {
      ctx.strokeStyle = color;
      ctx.lineWidth = 18;
      ctx.globalAlpha = 0.35;
    } else if (tool === 'pencil') {
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.globalAlpha = 0.85;
    } else {
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.globalAlpha = 1.0;
    }

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.closePath();
    const current = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setHistory((prev) => [...prev.slice(-15), current]);
  };

  const handleUndo = () => {
    if (history.length <= 1) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const newHistory = [...history];
    newHistory.pop(); // Remove current
    const previous = newHistory[newHistory.length - 1];
    ctx.putImageData(previous, 0, 0);
    setHistory(newHistory);
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, rect.width, rect.height);

    ctx.fillStyle = '#e2e8f0';
    for (let x = 20; x < rect.width; x += 20) {
      for (let y = 20; y < rect.height; y += 20) {
        ctx.fillRect(x, y, 1.5, 1.5);
      }
    }

    const cleared = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setHistory((prev) => [...prev, cleared]);
  };

  const handleSend = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    onSubmitScratchpad(dataUrl, studentNote || 'Here is my scratchpad work. How does this look?');
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="scratchpad-heading"
      className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 md:p-6"
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 w-full max-w-4xl flex flex-col h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-stone-200 bg-stone-50">
          <div>
            <h2 id="scratchpad-heading" className="font-semibold text-stone-900 text-sm flex items-center gap-2">
              <PenTool className="w-4 h-4 text-amber-600" />
              <span>Student Math Scratchpad</span>
              {currentStepTitle && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-normal">
                  Working on: {currentStepTitle}
                </span>
              )}
            </h2>
            <p className="text-xs text-stone-500">
              Draw formulas, sketch curves, or write out your working. The tutor will inspect your exact handwriting!
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close scratchpad"
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2 bg-stone-100/70 border-b border-stone-200 text-xs">
          {/* Tools */}
          <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-stone-200 shadow-xs">
            <button
              onClick={() => setTool('pen')}
              className={`p-1.5 rounded-lg flex items-center gap-1 font-medium transition-colors cursor-pointer ${
                tool === 'pen' ? 'bg-stone-900 text-white' : 'text-stone-600 hover:bg-stone-100'
              }`}
              title="Smooth Pen"
            >
              <PenTool className="w-3.5 h-3.5" />
              <span>Pen</span>
            </button>
            <button
              onClick={() => setTool('pencil')}
              className={`p-1.5 rounded-lg flex items-center gap-1 font-medium transition-colors cursor-pointer ${
                tool === 'pencil' ? 'bg-stone-900 text-white' : 'text-stone-600 hover:bg-stone-100'
              }`}
              title="Fine Pencil"
            >
              <Pencil className="w-3.5 h-3.5" />
              <span>Pencil</span>
            </button>
            <button
              onClick={() => setTool('highlighter')}
              className={`p-1.5 rounded-lg flex items-center gap-1 font-medium transition-colors cursor-pointer ${
                tool === 'highlighter' ? 'bg-stone-900 text-white' : 'text-stone-600 hover:bg-stone-100'
              }`}
              title="Highlighter"
            >
              <Highlighter className="w-3.5 h-3.5" />
              <span>Highlight</span>
            </button>
            <button
              onClick={() => setTool('eraser')}
              className={`p-1.5 rounded-lg flex items-center gap-1 font-medium transition-colors cursor-pointer ${
                tool === 'eraser' ? 'bg-stone-900 text-white' : 'text-stone-600 hover:bg-stone-100'
              }`}
              title="Eraser"
            >
              <Eraser className="w-3.5 h-3.5" />
              <span>Eraser</span>
            </button>
          </div>

          {/* Color palette */}
          <div className="flex items-center gap-1.5 bg-white px-2 py-1.5 rounded-xl border border-stone-200 shadow-xs">
            {[
              { label: 'Charcoal', val: '#1e293b' },
              { label: 'Navy Blue', val: '#1d4ed8' },
              { label: 'Amber Gold', val: '#d97706' },
              { label: 'Forest Green', val: '#059669' },
              { label: 'Ruby Red', val: '#dc2626' },
            ].map((c) => (
              <button
                key={c.val}
                onClick={() => {
                  setColor(c.val);
                  if (tool === 'eraser') setTool('pen');
                }}
                className={`w-5 h-5 rounded-full border transition-transform cursor-pointer ${
                  color === c.val && tool !== 'eraser' ? 'scale-125 ring-2 ring-stone-400 ring-offset-1' : 'hover:scale-110'
                }`}
                style={{ backgroundColor: c.val }}
                title={c.label}
              />
            ))}
          </div>

          {/* Line width */}
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-stone-200 shadow-xs">
            <span className="text-stone-500 font-medium">Size</span>
            <input
              type="range"
              min="1"
              max="10"
              value={lineWidth}
              onChange={(e) => setLineWidth(Number(e.target.value))}
              className="w-20 accent-stone-800 cursor-pointer"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1">
            <button
              onClick={handleUndo}
              disabled={history.length <= 1}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white border border-stone-200 text-stone-700 hover:bg-stone-50 disabled:opacity-40 transition-colors cursor-pointer shadow-xs"
              title="Undo stroke"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Undo</span>
            </button>
            <button
              onClick={handleClear}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white border border-stone-200 text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer shadow-xs"
              title="Clear entire whiteboard"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          </div>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 bg-white relative cursor-crosshair overflow-hidden touch-none">
          <canvas
            ref={canvasRef}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
            className="w-full h-full block"
          />
        </div>

        {/* Footer with note & submit */}
        <div className="p-3.5 bg-stone-50 border-t border-stone-200 flex flex-col sm:flex-row items-center gap-3 justify-between">
          <div className="flex-1 w-full">
            <input
              type="text"
              value={studentNote}
              onChange={(e) => setStudentNote(e.target.value)}
              placeholder="Add an optional question (e.g. 'Did I integrate the cosine term correctly?')"
              className="w-full text-xs px-3 py-2 rounded-xl bg-white border border-stone-300 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none text-stone-900 placeholder:text-stone-400"
            />
          </div>
          <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-200/60 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSend}
              disabled={isLoading}
              className="flex items-center justify-center gap-2 px-5 py-2 text-xs font-semibold rounded-xl bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <span>Tutor analyzing...</span>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Send to Socratic Tutor</span>
                  <Send className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
