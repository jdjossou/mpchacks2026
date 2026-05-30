'use client'

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  FileText,
  Search,
  Download,
  RefreshCw,
  Shield,
  Cpu,
  Layers,
  AlertCircle,
  FileCheck,
  Code,
  Copy,
  Check,
  Eye,
  ChevronDown,
  ChevronRight,
  Globe,
  Sparkles,
  ArrowRight,
  Database
} from 'lucide-react';
import { parsePDFAction, parseImageAction, getLoadingMessagesAction, PDFParseResult } from '@/lib/parsing/actions';

// Collapsible JSON Tree Node Component styled for Frutiger Aero
function JsonTreeNode({ label, value, depth = 0 }: { label: string | number; value: any; depth?: number }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const isObject = value !== null && typeof value === 'object';

  const toggleExpand = () => {
    if (isObject) setIsExpanded(!isExpanded);
  };

  const getRenderedValue = (val: any) => {
    if (typeof val === 'string') return <span className="text-emerald-600 font-semibold">"{val}"</span>;
    if (typeof val === 'number') return <span className="text-sky-600 font-bold">{val}</span>;
    if (typeof val === 'boolean') return <span className="text-indigo-600 font-bold">{val ? 'true' : 'false'}</span>;
    if (val === null) return <span className="text-zinc-400">null</span>;
    return null;
  };

  const indentStyle = { paddingLeft: `${depth * 16}px` };

  if (!isObject) {
    return (
      <div style={indentStyle} className="flex py-1.5 text-xs font-mono border-b border-white/20 hover:bg-white/20 transition-colors">
        <span className="text-sky-700 font-bold select-none mr-2">{label}:</span>
        <span className="select-text break-words max-w-[70%] text-zinc-800">{getRenderedValue(value)}</span>
      </div>
    );
  }

  const isArray = Array.isArray(value);
  const childKeys = Object.keys(value);

  return (
    <div className="text-xs font-mono">
      <div
        style={indentStyle}
        onClick={toggleExpand}
        className="flex items-center py-2 cursor-pointer hover:bg-white/30 border-b border-white/20 transition-colors select-none group"
      >
        <span className="text-sky-600 group-hover:text-sky-800 mr-1.5">
          {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
        </span>
        <span className="text-sky-800 font-extrabold mr-2">{label}:</span>
        <span className="text-emerald-600 font-semibold bg-emerald-100/60 px-2 py-0.5 rounded-full border border-emerald-200/50 text-[10px]">
          {isArray ? `Array[${value.length}]` : `Object{${childKeys.length}}`}
        </span>
      </div>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-l-2 border-sky-300/40 ml-3"
          >
            {childKeys.map((key) => (
              <JsonTreeNode
                key={key}
                label={isArray ? parseInt(key) : key}
                value={value[key]}
                depth={depth + 1}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [isDragActive, setIsDragActive] = useState<boolean>(false);
  const [isParsing, setIsParsing] = useState<boolean>(false);
  const [result, setResult] = useState<PDFParseResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'visual' | 'raw'>('visual');
  const [copied, setCopied] = useState<boolean>(false);
  const [chatInput, setChatInput] = useState<string>('');
  const [messages, setMessages] = useState<string[]>([]);
  const [currentMessage, setCurrentMessage] = useState<string>('AI Structuring in Progress');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load loading messages on mount
  useEffect(() => {
    getLoadingMessagesAction().then((msgs) => {
      setMessages(msgs);
    });
  }, []);

  // File size formatter
  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  // Drag handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true);
    } else if (e.type === 'dragleave') {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      validateAndSetFile(droppedFile);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (selectedFile: File) => {
    setError(null);
    const isPdf = selectedFile.type === 'application/pdf' || selectedFile.name.toLowerCase().endsWith('.pdf');
    const isImg = selectedFile.type.startsWith('image/') || /\.(png|jpe?g|webp)$/i.test(selectedFile.name);
    if (!isPdf && !isImg) {
      setError('Only PDF files and supported images (PNG, JPG, WEBP) are supported.');
      return;
    }
    if (selectedFile.size > 15 * 1024 * 1024) {
      setError('File size must be under 15MB.');
      return;
    }
    setFile(selectedFile);
  };

  // Parsing trigger calling Gemini Action
  const handleParse = async () => {
    if (!file) return;
    setIsParsing(true);
    setError(null);

    const defaultMsg = 'AI Structuring in Progress';
    let activeInterval: NodeJS.Timeout | null = null;

    if (messages.length > 0) {
      const initialMsg = messages[Math.floor(Math.random() * messages.length)];
      setCurrentMessage(initialMsg);

      // Cycle message every 2.5 seconds
      activeInterval = setInterval(() => {
        setCurrentMessage((prev) => {
          const filtered = messages.filter((m) => m !== prev);
          const nextMsg = filtered.length > 0 
            ? filtered[Math.floor(Math.random() * filtered.length)]
            : prev;
          return nextMsg;
        });
      }, 2500);
    } else {
      setCurrentMessage(defaultMsg);
    }

    try {
      const formData = new FormData();
      formData.append('file', file);

      const isImg = file.type.startsWith('image/') || /\.(png|jpe?g|webp)$/i.test(file.name);
      const response = isImg ? await parseImageAction(formData) : await parsePDFAction(formData);

      if (response.success && response.data) {
        setResult(response.data);
      } else {
        setError(response.error || `An error occurred while converting the ${isImg ? 'image' : 'PDF'}.`);
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsParsing(false);
      if (activeInterval) {
        clearInterval(activeInterval);
      }
    }
  };

  const handleReset = () => {
    setFile(null);
    setResult(null);
    setError(null);
  };

  // Copy Action
  const handleCopy = () => {
    if (!result) return;
    navigator.clipboard.writeText(JSON.stringify(result.json, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Download Action
  const handleDownload = () => {
    if (!result) return;
    const blob = new Blob([JSON.stringify(result.json, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${result.name.replace(/\.[^/.]+$/, "")}_extracted.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className="min-h-screen text-slate-100 flex flex-col font-sans relative selection:bg-sky-400 selection:text-white"
      style={{
        backgroundImage: "linear-gradient(rgba(255, 255, 255, 0.3), rgba(255, 255, 255, 0.3)), url('/backgrounds/frutiger.jpg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      {/* Floating Glass Bubbles for Aero Vibe */}
      <div className="absolute top-[15%] right-[20%] w-32 h-32 rounded-full bg-white/20 border border-white/40 shadow-[inset_-10px_-10px_20px_rgba(255,255,255,0.2),_0_10px_20px_rgba(0,0,0,0.05)] pointer-events-none backdrop-blur-[2px] z-0" />
      <div className="absolute bottom-[25%] left-[10%] w-24 h-24 rounded-full bg-white/25 border border-white/50 shadow-[inset_-8px_-8px_15px_rgba(255,255,255,0.25),_0_8px_15px_rgba(0,0,0,0.05)] pointer-events-none backdrop-blur-[1px] z-0" />

      {/* Header */}
      <header className="border-b border-white/20 bg-white/10 backdrop-blur-lg sticky top-0 z-50 px-6 py-4 flex items-center justify-between shadow-[0_4px_20px_rgba(0,0,0,0.15)] glass-reflection-container">
        <div className="glass-reflection-shine" />
        <div className="flex items-center gap-3 relative z-10">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-sky-400 via-sky-500 to-sky-600 border border-sky-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.4),_0_4px_10px_rgba(14,165,233,0.2)] flex items-center justify-center">
            <FileText className="h-5 w-5 text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.2)]" />
          </div>
          <div>
            <h1 className="font-extrabold text-xl tracking-tight text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]">DocSense</h1>
            <p className="text-[10px] font-bold text-emerald-300 tracking-wide uppercase">AI-powered PDF & Image to JSON converter</p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs relative z-10">
          <div className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-400/90 to-teal-500/90 border border-emerald-300 text-white px-3.5 py-2 rounded-full shadow-[inset_0_1px_0_rgba(255,255,255,0.4),_0_4px_8px_rgba(16,185,129,0.15)] font-bold text-shadow-sm">
            <Cpu className="h-3.5 w-3.5 animate-pulse text-emerald-100" />
            <span>Gemini 2.5 Flash</span>
          </div>
        </div>
      </header>

      {/* Main Content Layout Split */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8 z-10 flex items-center justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full items-stretch">

          {/* LEFT HALF: CURRENT PARSER UI */}
          <div className="flex flex-col w-full h-full justify-center">
            <AnimatePresence mode="wait">

              {/* UPLOAD & INITIAL STATE */}
              {!result && !isParsing && (
                <motion.div
                  key="uploader"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.3 }}
                  className="w-full flex flex-col gap-6"
                >
                  <div className="space-y-2">
                    <h2 className="text-3xl font-black tracking-tight text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)]">
                      Transform PDF or Image to Structured JSON
                    </h2>
                    <p className="text-sky-100 font-medium text-sm drop-shadow-[0_1px_1px_rgba(0,0,0,0.3)]">
                      Drag and drop your PDF or image file below. Gemini will analyze the contents and compile them into a clean JSON output.
                    </p>
                  </div>

                  {/* Error Alert */}
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-red-500/10 border border-red-500/30 text-red-300 p-4 rounded-2xl flex items-start gap-3 text-sm backdrop-blur-md"
                    >
                      <AlertCircle className="h-5 w-5 shrink-0 mt-0.5 text-red-400" />
                      <div className="space-y-1">
                        <span className="font-bold block">Failed to convert:</span>
                        <span className="text-xs text-red-200 block leading-relaxed">{error}</span>
                      </div>
                    </motion.div>
                  )}

                  {/* Uploader Drag Area */}
                  <div
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 relative overflow-hidden glass-panel glass-reflection-container group ${isDragActive
                      ? 'border-sky-500 bg-sky-100/40 shadow-xl'
                      : 'border-sky-300/60 hover:border-sky-400 hover:bg-white/60 shadow-[0_8px_32px_rgba(31,38,135,0.06)]'
                      }`}
                  >
                    <div className="glass-reflection-shine" />
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="application/pdf,image/*"
                      className="hidden"
                    />

                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-sky-400 via-emerald-400 to-teal-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                    <div className="p-4 bg-gradient-to-tr from-sky-100 to-white rounded-2xl border border-sky-200 shadow-[inset_0_2px_4px_rgba(255,255,255,0.9),_0_4px_8px_rgba(2,132,199,0.08)] mb-4 transition-transform group-hover:scale-110 duration-300">
                      {file ? (
                        <FileCheck className="h-8 w-8 text-emerald-500 drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)]" />
                      ) : (
                        <Upload className="h-8 w-8 text-sky-500 group-hover:text-sky-600 transition-colors" />
                      )}
                    </div>

                    <div className="text-center space-y-1 relative z-10">
                      <p className="font-bold text-sky-950">
                        {file ? file.name : 'Select or drop a PDF or Image file'}
                      </p>
                      <p className="text-xs text-sky-850 font-medium">
                        {file ? formatBytes(file.size) : 'PDF or Image up to 15MB'}
                      </p>
                    </div>
                  </div>

                  {/* Action Button */}
                  {file && (
                    <motion.button
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      onClick={handleParse}
                      className="w-full py-4 px-6 glossy-button-blue glossy-shimmer font-bold text-base hover:scale-[1.005] active:scale-[0.99] cursor-pointer"
                    >
                      Convert with Gemini API
                    </motion.button>
                  )}

                  {/* Badges */}
                  <div className="grid grid-cols-3 gap-4 pt-6 border-t border-sky-200/50">
                    <div className="flex flex-col items-center text-center p-3 rounded-2xl bg-white/30 border border-white/50 backdrop-blur-md shadow-sm">
                      <Shield className="h-5 w-5 text-sky-600 mb-2" />
                      <span className="text-xs font-bold text-sky-950">Secure API</span>
                      <span className="text-[10px] text-sky-850 font-semibold">Encrypted send</span>
                    </div>
                    <div className="flex flex-col items-center text-center p-3 rounded-2xl bg-white/30 border border-white/50 backdrop-blur-md shadow-sm">
                      <Cpu className="h-5 w-5 text-emerald-600 mb-2" />
                      <span className="text-xs font-bold text-sky-950">AI Transforming</span>
                      <span className="text-[10px] text-sky-850 font-semibold">Structure mapping</span>
                    </div>
                    <div className="flex flex-col items-center text-center p-3 rounded-2xl bg-white/30 border border-white/50 backdrop-blur-md shadow-sm">
                      <Layers className="h-5 w-5 text-teal-600 mb-2" />
                      <span className="text-xs font-bold text-sky-950">Clean JSON</span>
                      <span className="text-[10px] text-sky-850 font-semibold">Direct download</span>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* PARSING / LOADING STATE */}
              {isParsing && (
                <motion.div
                  key="loader"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="flex flex-col items-center justify-center p-12 text-center space-y-6"
                >
                  <div className="relative h-20 w-20">
                    <div className="absolute inset-0 rounded-full border-4 border-sky-100" />
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                      className="absolute inset-0 rounded-full border-4 border-emerald-500 border-t-transparent"
                    />
                    <div className="absolute inset-2 bg-white/80 rounded-full flex items-center justify-center shadow-inner border border-white">
                      <Globe className="h-6 w-6 text-sky-500 animate-pulse" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="h-8 flex items-center justify-center overflow-hidden">
                      <AnimatePresence mode="wait">
                        <motion.h3
                          key={currentMessage}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.25, ease: "easeInOut" }}
                          className="text-lg font-bold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]"
                        >
                          {currentMessage}
                        </motion.h3>
                      </AnimatePresence>
                    </div>
                    <p className="text-xs font-semibold text-sky-200 max-w-xs mx-auto mt-2">
                      Gemini is analyzing and structuring details of &ldquo;{file?.name}&rdquo;...
                    </p>
                  </div>
                </motion.div>
              )}

              {result && (
                <motion.div
                  key="results"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="w-full flex flex-col gap-6"
                >
                  {/* Dashboard Header Bar */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl glass-panel glass-reflection-container shadow-[0_12px_40px_rgba(2,132,199,0.08)]">
                    <div className="glass-reflection-shine" />
                    <div className="flex items-center gap-3 relative z-10">
                      <div className="h-12 w-12 rounded-xl bg-gradient-to-tr from-sky-400 to-sky-600 border border-sky-300 flex items-center justify-center shadow-md">
                        <FileText className="h-6 w-6 text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.2)]" />
                      </div>
                      <div>
                        <h3 className="font-black text-sky-950 truncate max-w-xs">{result.name}</h3>
                        <p className="text-xs font-bold text-sky-700/80">
                          {formatBytes(result.size)} • Structured
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 relative z-10">
                      <button
                        onClick={handleCopy}
                        className="flex items-center gap-2 px-5 py-3 glossy-button-silver glossy-shimmer font-bold text-sm cursor-pointer"
                      >
                        {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                        <span>{copied ? 'Copied!' : 'Copy'}</span>
                      </button>
                      <button
                        onClick={handleDownload}
                        className="flex items-center gap-2 px-5 py-3 glossy-button-green glossy-shimmer font-bold text-sm cursor-pointer"
                      >
                        <Download className="h-4 w-4" />
                        <span>Download</span>
                      </button>
                      <button
                        onClick={handleReset}
                        className="flex items-center gap-2 px-5 py-3 glossy-button-silver glossy-shimmer font-bold text-sm cursor-pointer"
                      >
                        <RefreshCw className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Tabs Control */}
                  <div className="flex border-b border-sky-200/50">
                    <button
                      onClick={() => setActiveTab('visual')}
                      className={`flex items-center gap-2 px-6 py-4 text-sm font-bold border-b-3 transition-colors ${activeTab === 'visual'
                        ? 'border-sky-500 text-sky-850'
                        : 'border-transparent text-sky-700/60 hover:text-sky-850'
                        }`}
                    >
                      <Eye className="h-4 w-4" />
                      <span>Visual Inspector</span>
                    </button>
                    <button
                      onClick={() => setActiveTab('raw')}
                      className={`flex items-center gap-2 px-6 py-4 text-sm font-bold border-b-3 transition-colors ${activeTab === 'raw'
                        ? 'border-sky-500 text-sky-850'
                        : 'border-transparent text-sky-700/60 hover:text-sky-850'
                        }`}
                    >
                      <Code className="h-4 w-4" />
                      <span>Raw JSON Code</span>
                    </button>
                  </div>

                  {/* View Panel */}
                  <div className="glass-panel glass-reflection-container p-6 min-h-[50vh] flex flex-col justify-between shadow-[0_12px_40px_rgba(2,132,199,0.08)]">
                    <div className="glass-reflection-shine" />

                    {activeTab === 'visual' ? (
                      <div className="flex-1 space-y-2 max-h-[60vh] overflow-y-auto pr-2 relative z-10">
                        {Object.keys(result.json).map((key) => (
                          <JsonTreeNode
                            key={key}
                            label={key}
                            value={result.json[key]}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="flex-1 font-mono text-xs leading-relaxed text-sky-950 whitespace-pre overflow-x-auto max-h-[60vh] overflow-y-auto pr-2 relative z-10 select-text selection:bg-sky-400 selection:text-white">
                        {JSON.stringify(result.json, null, 2)}
                      </div>
                    )}

                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </div>

          {/* RIGHT HALF: 2 EMPTY GLOSSY AERO PANELS */}
          <div className="flex flex-col gap-6 w-full h-full min-h-[500px]">

            {/* Div 1 */}
            <div className="glass-panel glass-reflection-container p-6 flex-1 relative overflow-hidden">
              <div className="glass-reflection-shine" />
            </div>

            {/* Div 2 */}
            <div className="flex-1 relative overflow-hidden flex items-center justify-center">
              <div className="relative z-10 flex items-center justify-center h-full w-full">
                <motion.img
                  src="/characters/mascot.png"
                  alt="Mascot"
                  className="max-h-full max-w-full object-contain select-none mix-blend-screen"
                  style={{ mixBlendMode: 'screen' }}
                  animate={{
                    y: [0, -8, 0]
                  }}
                  transition={{
                    repeat: Infinity,
                    duration: 4,
                    ease: "easeInOut"
                  }}
                />
              </div>
            </div>

          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-6 px-6 text-center text-xs font-bold text-sky-200/50 z-10 bg-black/20 backdrop-blur-md">
        <p>© {new Date().getFullYear()} DocSense. Integrated with Google Gemini.</p>
      </footer>
    </div>
  );
}
