'use client'

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertCircle,
  Globe
} from 'lucide-react';
import { parsePDFAction, parseImageAction, parseTextAction, getLoadingMessagesAction } from '@/lib/parsing/actions';
import { GENERATED_GAME_STORAGE_KEY } from '@/lib/game/generatedGame';
import { playSound } from '@/lib/sound';
import { playMusic } from '@/lib/music';

const GOOFY_GREETINGS = [
  "FEED ME FILES! I consume knowledge and spit out gaming! 👁️👄👁️",
  "Goooood day! Ready to crash some learning? Let's go! 💥📚",
  "Beep boop! If you drop a level .clashroom, I promise not to eat it... mostly. 🤖",
  "I'm Mizue! I'm here to review your papers and judge your decisions! 📐🏫",
  "Got a PDF? A text file? A JPEG of your homework? Chuck it in!",
  "Oops! Did you click me? That tickles! 😆✨",
  "Don't worry, the grade I give you is only 90% based on my mood! 👩‍🏫"
];

export default function Home() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [isDragActive, setIsDragActive] = useState<boolean>(false);
  const [isParsing, setIsParsing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<string[]>([]);
  const [currentMessage, setCurrentMessage] = useState<string>('AI Structuring in Progress');
  const [showSecret, setShowSecret] = useState<boolean>(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [hasLoadedGame, setHasLoadedGame] = useState<boolean>(false);
  const [speechIndex, setSpeechIndex] = useState<number>(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Loop the landing-page theme while on this screen
  useEffect(() => {
    playMusic('landing_page');
  }, []);

  // Load loading messages on mount
  useEffect(() => {
    getLoadingMessagesAction().then((msgs) => {
      setMessages(msgs);
    });

    const saved = sessionStorage.getItem(GENERATED_GAME_STORAGE_KEY);
    if (saved) {
      setTimeout(() => {
        setHasLoadedGame(true);
      }, 0);
    }
  }, []);

  // Auto-cycle mascot speech bubbles
  useEffect(() => {
    const timer = setInterval(() => {
      setSpeechIndex((prev) => (prev + 1) % GOOFY_GREETINGS.length);
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  /* File size formatter (unused but preserved)
  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };
  */

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
      handleFileSelection(droppedFile);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelection(e.target.files[0]);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelection = (selectedFile: File) => {
    setError(null);
    if (selectedFile.size > 15 * 1024 * 1024) {
      setError('File size must be under 15MB.');
      return;
    }

    setFile(selectedFile);

    const nameLower = selectedFile.name.toLowerCase();
    const isClashroom = nameLower.endsWith('.clashroom');
    const isPdf = selectedFile.type === 'application/pdf' || nameLower.endsWith('.pdf');
    const isImg = selectedFile.type.startsWith('image/') || /\.(png|jpe?g|webp)$/i.test(nameLower);
    const isTxt = selectedFile.type === 'text/plain' || nameLower.endsWith('.txt');

    if (isClashroom) {
      handleClashroomParse(selectedFile);
    } else if (isPdf || isImg || isTxt) {
      handleParse(selectedFile);
    } else {
      setError('Only PDF, TXT, .clashroom level files, and supported images (PNG, JPG, WEBP) are supported.');
    }
  };

  const handleClashroomParse = async (selectedFile: File) => {
    setError(null);
    if (!selectedFile.name.toLowerCase().endsWith('.clashroom')) {
      setError('Only .clashroom files are supported for loading levels.');
      return;
    }
    if (selectedFile.size > 15 * 1024 * 1024) {
      setError('File size must be under 15MB.');
      return;
    }

    setIsParsing(true);
    setCurrentMessage('Loading level data...');

    try {
      const text = await selectedFile.text();
      const structuredJson = JSON.parse(text);

      const requiredKeys = [
        'id',
        'title',
        'topic',
        'characters',
        'intro',
        'debate',
        'conclusion'
      ];

      const missingKeys = requiredKeys.filter(key => !(key in structuredJson));
      if (missingKeys.length > 0) {
        throw new Error(`Invalid .clashroom level file: missing fields ${missingKeys.join(', ')}`);
      }

      if (typeof structuredJson.topic !== 'object' || !structuredJson.topic || !('name' in structuredJson.topic)) {
        throw new Error(`Invalid .clashroom level file: "topic" must be an object containing "name".`);
      }
      if (typeof structuredJson.debate !== 'object' || !structuredJson.debate || !Array.isArray(structuredJson.debate.statements)) {
        throw new Error(`Invalid .clashroom level file: "debate" must be an object containing "statements" array.`);
      }

      const responseData = {
        json: structuredJson,
        version: 'unknown',
        size: selectedFile.size,
        name: selectedFile.name,
      };

      sessionStorage.setItem(GENERATED_GAME_STORAGE_KEY, JSON.stringify(responseData));
      setHasLoadedGame(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to parse .clashroom level file.');
    } finally {
      setIsParsing(false);
    }
  };

  // Parsing trigger calling Gemini Action
  const handleParse = async (selectedFile?: File) => {
    const fileToParse = selectedFile || file;
    if (!fileToParse) return;
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
      formData.append('file', fileToParse);

      const isImg = fileToParse.type.startsWith('image/') || /\.(png|jpe?g|webp)$/i.test(fileToParse.name);
      const isTxt = fileToParse.type === 'text/plain' || fileToParse.name.toLowerCase().endsWith('.txt');

      let response;
      if (isImg) {
        response = await parseImageAction(formData);
      } else if (isTxt) {
        response = await parseTextAction(formData);
      } else {
        response = await parsePDFAction(formData);
      }

      if (response.success && response.data) {
        console.log('Parsed document JSON:', response.data.json);
        sessionStorage.setItem(GENERATED_GAME_STORAGE_KEY, JSON.stringify(response.data));
        setHasLoadedGame(true);
      } else {
        const fileTypeLabel = isImg ? 'image' : isTxt ? 'TXT' : 'PDF';
        setError(response.error || `An error occurred while converting the ${fileTypeLabel}.`);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setIsParsing(false);
      if (activeInterval) {
        clearInterval(activeInterval);
      }
    }
  };

  return (
    <div
      onDragEnter={handleDrag}
      onDragOver={handleDrag}
      onDragLeave={handleDrag}
      onDrop={handleDrop}
      className={`min-h-screen text-slate-100 flex flex-col font-sans relative selection:bg-sky-400 selection:text-white transition-all duration-300 ${isDragActive ? 'brightness-110 contrast-95 ring-8 ring-sky-400/50 ring-inset' : ''
        }`}
      style={{
        backgroundImage: "linear-gradient(rgba(255, 255, 255, 0), rgba(255, 255, 255, 0)), url('/backgrounds/frutiger.jpg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      {/* Floating Glass Bubbles for Aero Vibe */}
      <div className="absolute top-[15%] right-[20%] w-32 h-32 rounded-full bg-white/20 border border-white/40 shadow-[inset_-10px_-10px_20px_rgba(255,255,255,0.2),_0_10px_20px_rgba(0,0,0,0.05)] pointer-events-none backdrop-blur-[2px] z-0" />
      <div className="absolute bottom-[25%] left-[10%] w-24 h-24 rounded-full bg-white/25 border border-white/50 shadow-[inset_-8px_-8px_15px_rgba(255,255,255,0.25),_0_8px_15px_rgba(0,0,0,0.05)] pointer-events-none backdrop-blur-[1px] z-0" />



      {/* Main Content Layout Split */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8 z-10 flex items-center justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full items-stretch">

          {/* LEFT HALF: CURRENT PARSER UI */}
          <div className="flex flex-col w-full h-full justify-center">
            <AnimatePresence mode="wait">

              {/* MENU SELECTIONS & UPLOADER */}
              {!isParsing && (
                <motion.div
                  key="menu"
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ duration: 0.4 }}
                  className="w-full flex flex-col gap-6"
                >
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-red-500/10 border border-red-500/30 text-red-300 p-4 rounded-2xl flex items-start gap-3 text-sm backdrop-blur-md max-w-md mb-4"
                    >
                      <AlertCircle className="h-5 w-5 shrink-0 mt-0.5 text-red-400" />
                      <div className="space-y-1">
                        <span className="font-bold block">Failed to convert:</span>
                        <span className="text-xs text-red-200 block leading-relaxed">{error}</span>
                      </div>
                    </motion.div>
                  )}

                  <div className="flex flex-col items-start justify-center py-8 pl-4 md:pl-8">
                    {/* <h1
                      style={{
                        fontFamily: "var(--font-sans)",
                        WebkitTextStroke: '1.5px black',
                      }}
                      className="text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-wider text-left"
                    >
                      Clashroom : Crash n Learn
                    </h1> */}
                    {/* Header Divider Line */}
                    <div className="w-80 h-[2px] bg-gradient-to-r from-white/40 via-white/15 to-transparent mt-6 mb-16" />

                    <div className="flex flex-col gap-5 items-start justify-center h-[340px] w-full">
                      {[
                        { name: 'Browse Levels' },
                        { name: hasLoadedGame ? 'Play' : 'Upload Level' },
                        { name: 'Settings' },
                      ].map((item, index) => {
                        const baseX = (2.0 - Math.pow(Math.abs(1 - index), 1.5)) * 18;
                        const baseRotate = (index - 1) * 6.0;
                        const isPlay = item.name === 'Play';
                        const isUpload = item.name === 'Upload Level';
                        const isActive = isPlay || isUpload;

                        return (
                          <motion.button
                            key={index === 1 ? 'upload-play' : item.name}
                            onClick={
                              index === 1
                                ? () => {
                                  playSound('menu_select');
                                  if (hasLoadedGame) router.push('/game');
                                  else handleUploadClick();
                                }
                                : undefined
                            }
                            onMouseEnter={() => {
                              if (isActive) playSound('menu_hover');
                              setHoveredIndex(index);
                            }}
                            onMouseLeave={() => setHoveredIndex(null)}
                            whileTap={isActive ? { scale: 0.98 } : undefined}
                            animate={{
                              scale: hoveredIndex === index ? 1.45 : 1.0,
                              x: hoveredIndex === index ? baseX + 20 : baseX,
                              rotate: baseRotate,
                              paddingTop: hoveredIndex === index ? 12 : 0,
                              paddingBottom: hoveredIndex === index ? 12 : 0,
                              opacity: hoveredIndex === null ? (isActive ? 1 : 0.4) : (hoveredIndex === index ? 1 : 0.25)
                            }}
                            transition={{ type: "spring", stiffness: 350, damping: 20 }}
                            style={{
                              fontFamily: "var(--font-sans)",
                              WebkitTextStroke: '1px black',
                              transformOrigin: 'left center'
                            }}
                            className={`text-left font-black tracking-wide relative text-4xl md:text-5xl ${isActive
                              ? 'text-white cursor-pointer hover:text-sky-300'
                              : 'text-white cursor-default'
                              }`}
                          >
                            <span>{item.name}</span>
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>

                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="application/pdf,image/*,text/plain,.txt,.clashroom"
                    className="hidden"
                  />
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
                      {file?.name?.toLowerCase().endsWith('.clashroom')
                        ? `Mizue Sensei is parsing level data from "${file?.name}"...`
                        : `Mizue Sensei is reviewing "${file?.name}"...`}
                    </p>
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </div>

          {/* RIGHT HALF: TEACHER WITH FLOATING MASCOT AND SPEECH BUBBLE OVER MASCOT */}
          <div className="flex flex-col w-full h-full min-h-[500px] items-center justify-end relative pb-4">

            {/* Glowing background aura */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-sky-400/15 blur-3xl pointer-events-none animate-pulse z-0" />

            {/* Characters Container (holds teacher and floating mascot with text bubble over mascot) */}
            <div className="relative w-full max-w-md flex items-end justify-center z-10">

              {/* Teacher (Big Size, centered, breathing animation) */}
              <motion.img
                src="/characters/teacher.png"
                alt="Teacher (Mizue Sensei)"
                animate={{
                  y: [0, -6, 0]
                }}
                transition={{
                  repeat: Infinity,
                  duration: 6,
                  ease: "easeInOut"
                }}
                className="h-[360px] md:h-[450px] w-auto object-contain select-none cursor-pointer filter drop-shadow-[0_10px_25px_rgba(0,0,0,0.3)] transition-all duration-300"
                whileHover={{ scale: 1.02 }}
                onClick={() => setSpeechIndex((prev) => (prev + 1) % GOOFY_GREETINGS.length)}
              />

              {/* Floating Mascot & Speech Bubble */}
              <motion.div
                animate={{
                  y: [0, -15, 0],
                  rotate: [0, 2, -2, 0]
                }}
                transition={{
                  repeat: Infinity,
                  duration: 4,
                  ease: "easeInOut"
                }}
                className="absolute top-[-90px] md:top-[-110px] right-[-25px] md:right-[-45px] z-20 cursor-pointer flex flex-col items-center gap-1"
                onClick={() => setSpeechIndex((prev) => (prev + 1) % GOOFY_GREETINGS.length)}
              >
                {/* Speech Bubble */}
                <div className="h-32 flex items-end justify-center relative mb-1">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={speechIndex}
                      initial={{ opacity: 0, scale: 0.8, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.8, y: -10 }}
                      transition={{ type: "spring", stiffness: 250, damping: 18 }}
                      className="bg-white/25 border border-white/45 shadow-[0_8px_32px_rgba(0,0,0,0.15)] backdrop-blur-md px-4 py-3 rounded-2xl max-w-[200px] md:max-w-[240px] text-center text-xs font-semibold text-slate-100 flex flex-col items-center gap-1 cursor-pointer select-none transition-all hover:bg-white/35 hover:border-white/55 relative"
                    >
                      <p className="leading-relaxed">&ldquo;{GOOFY_GREETINGS[speechIndex]}&rdquo;</p>
                      <span className="text-[9px] uppercase font-bold text-sky-200 mt-1 tracking-wider animate-pulse">Click to poke us 👈</span>
                      {/* Speech bubble arrow pointing down */}
                      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-white/30" />
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* Mascot Image */}
                <motion.img
                  src="/characters/mascot.png"
                  alt="Mascot"
                  className="h-28 w-28 md:h-36 md:w-36 object-contain select-none mix-blend-screen filter drop-shadow-[0_8px_16px_rgba(56,189,248,0.3)]"
                  style={{ mixBlendMode: 'screen' }}
                  whileHover={{ scale: 1.15, rotate: [0, -5, 5, 0] }}
                  whileTap={{ scale: 0.9 }}
                />
              </motion.div>

            </div>

          </div>

        </div>
      </main>



      {/* Secret Toast/Alert Popup */}
      <AnimatePresence>
        {showSecret && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-6 right-6 z-[100] max-w-sm"
          >
            <div className="glass-panel p-6 shadow-2xl border border-white/50 rounded-2xl relative overflow-hidden glass-reflection-container bg-white/40 backdrop-blur-xl">
              <div className="glass-reflection-shine" />
              <div className="flex flex-col gap-3 relative z-10">
                <div className="flex items-center gap-2 text-sky-500">
                  <span className="text-2xl filter drop-shadow-[0_2px_4px_rgba(14,165,233,0.3)]">🌊</span>
                  <h4 className="font-extrabold text-sky-950 text-shadow-sm text-sm uppercase tracking-wider">Secret Message</h4>
                </div>
                <p className="text-xs font-semibold text-slate-800 leading-relaxed">
                  You discovered a hidden portal! 🔮
                  <br /><br />
                  &ldquo;Nique ta mere&rdquo;
                  <br /><br />
                  Zebiiiiii
                </p>
                <button
                  onClick={() => setShowSecret(false)}
                  className="mt-2 py-2 px-4 glossy-button-blue font-bold text-xs uppercase tracking-wider transition-all duration-200 cursor-pointer shadow-md text-center"
                >
                  Close Portal
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Invisible Clickable Button in Bottom Right */}
      <button
        onClick={() => setShowSecret(true)}
        className="fixed bottom-0 right-0 w-12 h-12 z-50 cursor-default opacity-0"
        aria-label="Secret Easter Egg"
      />
    </div>
  );
}
