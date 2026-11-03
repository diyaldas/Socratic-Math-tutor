import React, { useState, useRef } from 'react';
import {
  Upload,
  Camera,
  BookOpen,
  Sparkles,
  ArrowRight,
  Brain,
  FileText,
  CheckCircle,
  HelpCircle,
} from 'lucide-react';
import { SampleProblem } from '../types/mathTutor';
import { MathView } from './MathView';

interface ProblemUploaderProps {
  onAnalyze: (options: {
    imageBase64?: string;
    mimeType?: string;
    problemText?: string;
  }) => void;
  isLoading: boolean;
  sampleProblems: SampleProblem[];
}

export const ProblemUploader: React.FC<ProblemUploaderProps> = ({
  onAnalyze,
  isLoading,
  sampleProblems,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'samples' | 'type'>('upload');
  const [dragActive, setDragActive] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [customText, setCustomText] = useState('');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (PNG, JPG, WebP).');
      return;
    }
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const startCamera = async () => {
    try {
      setIsCameraActive(true);
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      console.error('Camera access denied or unavailable:', err);
      alert('Unable to access camera. Please upload an image file instead.');
      setIsCameraActive(false);
    }
  };

  const captureCamera = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg');
      setImagePreview(dataUrl);
      // stop stream
      const stream = videoRef.current.srcObject as MediaStream;
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      setIsCameraActive(false);
    }
  };

  const handleAnalyzeSubmit = () => {
    if (activeTab === 'upload') {
      if (!imagePreview) return;
      onAnalyze({
        imageBase64: imagePreview,
        mimeType: imageFile?.type || 'image/jpeg',
        problemText: customText.trim() || undefined,
      });
    } else if (activeTab === 'type') {
      if (!customText.trim()) return;
      onAnalyze({
        problemText: customText.trim(),
      });
    }
  };

  const handleSelectSample = (sample: SampleProblem) => {
    onAnalyze({
      problemText: `Problem Title: ${sample.title}\nCategory: ${sample.category}\nFormula: ${sample.latex}\nContext: ${sample.description}`,
    });
  };

  return (
    <div className="bg-white rounded-3xl border border-stone-200/90 shadow-xl overflow-hidden max-w-4xl mx-auto">
      {/* Hero Welcome banner */}
      <div className="bg-gradient-to-br from-stone-900 via-stone-850 to-stone-950 p-6 md:p-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 text-amber-200 border border-amber-400/30 text-xs font-semibold mb-4">
            <Brain className="w-3.5 h-3.5 text-amber-300" />
            <span>High Thinking Mode • Socratic Dialogue</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold font-serif-math tracking-tight mb-2">
            Sit Down with Your Patient Math Tutor
          </h1>
          <p className="text-stone-300 text-sm leading-relaxed">
            Snap a photo of any thorny calculus or algebra problem. We will never rush you or blurt out the answer. Instead, we will walk through the first step together, pause whenever you wonder{' '}
            <span className="text-amber-300 font-semibold italic">"Why did we do that?"</span>, and build genuine intuition.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-stone-200 bg-stone-50/70 px-6 pt-3 gap-2">
        <button
          onClick={() => setActiveTab('upload')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'upload'
              ? 'bg-white text-stone-900 border-t-2 border-amber-600 shadow-xs'
              : 'text-stone-500 hover:text-stone-900 hover:bg-stone-100'
          }`}
        >
          <Camera className="w-4 h-4 text-amber-600" />
          <span>Upload Problem Photo</span>
        </button>
        <button
          onClick={() => setActiveTab('samples')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'samples'
              ? 'bg-white text-stone-900 border-t-2 border-amber-600 shadow-xs'
              : 'text-stone-500 hover:text-stone-900 hover:bg-stone-100'
          }`}
        >
          <BookOpen className="w-4 h-4 text-amber-600" />
          <span>Explore Classic Challenges</span>
        </button>
        <button
          onClick={() => setActiveTab('type')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'type'
              ? 'bg-white text-stone-900 border-t-2 border-amber-600 shadow-xs'
              : 'text-stone-500 hover:text-stone-900 hover:bg-stone-100'
          }`}
        >
          <FileText className="w-4 h-4 text-amber-600" />
          <span>Type or Paste Problem</span>
        </button>
      </div>

      {/* Tab Panels */}
      <div className="p-6 md:p-8">
        {activeTab === 'upload' && (
          <div className="space-y-6">
            {!imagePreview && !isCameraActive && (
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition-all ${
                  dragActive
                    ? 'border-amber-500 bg-amber-50/50 scale-[1.01]'
                    : 'border-stone-300 hover:border-amber-400 hover:bg-stone-50/60'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto mb-4 shadow-xs">
                  <Upload className="w-8 h-8" />
                </div>
                <h3 className="text-base font-semibold text-stone-900 mb-1">
                  Upload a photo of your math problem
                </h3>
                <p className="text-xs text-stone-500 max-w-md mx-auto mb-4">
                  Drag and drop a clear photo of your calculus textbook, handwritten homework, or worksheet (PNG, JPG, WebP)
                </p>

                <div className="flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-stone-900 text-white hover:bg-stone-800 transition-colors shadow-xs"
                  >
                    Browse Photo
                  </button>
                  <span className="text-xs text-stone-400">or</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      startCamera();
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 transition-colors"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Take with Camera</span>
                  </button>
                </div>
              </div>
            )}

            {isCameraActive && (
              <div className="rounded-3xl border border-stone-200 p-4 bg-stone-950 text-white text-center space-y-4">
                <video ref={videoRef} className="w-full max-h-80 object-contain rounded-2xl mx-auto" />
                <div className="flex justify-center gap-3">
                  <button
                    onClick={captureCamera}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 font-semibold text-xs text-white"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Capture Problem Photo</span>
                  </button>
                  <button
                    onClick={() => {
                      const stream = videoRef.current?.srcObject as MediaStream;
                      if (stream) stream.getTracks().forEach((t) => t.stop());
                      setIsCameraActive(false);
                    }}
                    className="px-4 py-2 rounded-xl bg-stone-800 text-stone-300 text-xs font-medium hover:bg-stone-700"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {imagePreview && (
              <div className="space-y-4">
                <div className="relative rounded-2xl overflow-hidden border border-stone-300 bg-stone-900 flex items-center justify-center max-h-80">
                  <img
                    src={imagePreview}
                    alt="Uploaded math problem"
                    className="max-h-80 object-contain"
                  />
                  <button
                    onClick={() => {
                      setImagePreview(null);
                      setImageFile(null);
                    }}
                    className="absolute top-3 right-3 px-3 py-1.5 rounded-xl bg-stone-900/80 hover:bg-stone-900 text-white text-xs font-medium backdrop-blur-xs transition-colors cursor-pointer"
                  >
                    Choose Different Photo
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Any specific part you want to focus on? (Optional)
                  </label>
                  <input
                    type="text"
                    value={customText}
                    onChange={(e) => setCustomText(e.target.value)}
                    placeholder="e.g. 'I am particularly confused about how to set up the limits of integration'"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-stone-300 bg-stone-50/50 focus:bg-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={handleAnalyzeSubmit}
                    disabled={isLoading}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white font-semibold text-sm shadow-md transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Socrates is reading your problem...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Analyze & Walk Me Through Step 1</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'samples' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-stone-500">
                Pick a classic calculus or algebra problem to start exploring right away:
              </p>
              <span className="text-[11px] font-medium text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                8 Curated Socratic Presets
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {sampleProblems.map((sp) => (
                <button
                  type="button"
                  key={sp.id}
                  aria-label={`Select ${sp.title} problem`}
                  onClick={() => !isLoading && handleSelectSample(sp)}
                  className="p-4 rounded-2xl border border-stone-200 bg-white hover:border-amber-400 hover:bg-amber-50/20 hover:shadow-sm transition-all cursor-pointer flex flex-col justify-between group text-left w-full"
                >
                  <div className="w-full">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 uppercase tracking-wider">
                        {sp.category}
                      </span>
                      <span className="text-[10px] font-medium text-stone-500">
                        {sp.difficulty}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-stone-900 group-hover:text-amber-800 mb-1">
                      {sp.title}
                    </h4>
                    <p className="text-[11px] text-stone-500 mb-3 line-clamp-2">
                      {sp.description}
                    </p>
                  </div>

                  <div className="bg-stone-50 p-2 rounded-xl border border-stone-100 group-hover:border-amber-200 text-center w-full">
                    <MathView content={`$$${sp.latex}$$`} />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'type' && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Enter your mathematical statement or problem description:
              </label>
              <textarea
                rows={5}
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                placeholder="e.g. Compute the integral of x^3 * sqrt(x^2 + 1) dx, or type LaTeX like \int x e^{2x} dx"
                className="w-full p-4 rounded-2xl border border-stone-300 font-mono text-xs text-stone-900 bg-stone-50/50 focus:bg-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none leading-relaxed"
              />
            </div>

            {customText.trim() && (
              <div className="p-3.5 rounded-2xl bg-amber-50/50 border border-amber-200">
                <span className="text-[11px] font-semibold text-amber-900 block mb-1">
                  Live Preview:
                </span>
                <MathView content={customText} />
              </div>
            )}

            <div className="flex justify-end">
              <button
                onClick={handleAnalyzeSubmit}
                disabled={!customText.trim() || isLoading}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-sm shadow-md transition-all cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Start Step 1 with Tutor</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer Guarantee */}
      <div className="bg-stone-100/70 border-t border-stone-200 px-6 py-3 text-xs text-stone-600 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span>No answers spoiled. Active learning guarantee.</span>
        </div>
        <div className="flex items-center gap-1.5 text-stone-500">
          <HelpCircle className="w-3.5 h-3.5" />
          <span>Ask "Why did we do that?" at any point.</span>
        </div>
      </div>
    </div>
  );
};
