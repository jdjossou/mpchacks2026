'use client'

import { useState, useRef, useEffect, useSyncExternalStore, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertCircle,
  Search,
  ArrowLeft,
  Play
} from 'lucide-react';
import {
  parsePDFAction,
  parseImageAction,
  parseTextAction,
  getLoadingMessagesAction,
  generateTeacherVoiceoversAction,
} from '@/lib/parsing/actions';
import {
  GENERATED_GAME_STORAGE_KEY,
  gameConfigFromParsedDocument,
  type GeneratedGameStoragePayload,
} from '@/lib/game/generatedGame';
import { listSharedLevelsAction } from '@/lib/game/sharedLevelActions';
import type { SharedLevelSummary } from '@/lib/game/sharedLevelTypes';
import { playSound } from '@/lib/sound';
import { playMusic } from '@/lib/music';
import { isMuted, toggleMuted, subscribe } from '@/lib/audioSettings';
import {
  isVoiceActingEnabled,
  toggleVoiceActing,
  subscribe as subscribeToVoiceActing,
} from '@/lib/voiceActingSettings';

function getDialogueText(value: unknown): string | null {
  if (typeof value === 'string') return value;
  if (!value || typeof value !== 'object') return null;

  const candidate = value as Record<string, unknown>;
  return typeof candidate.text === 'string' ? candidate.text : null;
}

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
  const [menuView, setMenuView] = useState<'main' | 'settings' | 'browse'>('main');
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filePickerRequest, setFilePickerRequest] = useState<number>(0);
  const [fileInputResetRequest, setFileInputResetRequest] = useState<number>(0);
  const [sharedLevels, setSharedLevels] = useState<SharedLevelSummary[]>([]);
  const [isLoadingSharedLevels, setIsLoadingSharedLevels] = useState<boolean>(false);
  const [sharedLevelsError, setSharedLevelsError] = useState<string | null>(null);
  const [loadingDescription, setLoadingDescription] = useState<string | null>(null);
  const muted = useSyncExternalStore(subscribe, isMuted, () => false);
  const voiceActingEnabled = useSyncExternalStore(
    subscribeToVoiceActing,
    isVoiceActingEnabled,
    () => true
  );

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadSharedLevels = useCallback(async () => {
    setIsLoadingSharedLevels(true);
    setSharedLevelsError(null);

    try {
      const response = await listSharedLevelsAction();
      if (!response.success) {
        setSharedLevels([]);
        setSharedLevelsError(response.error);
        return;
      }

      setSharedLevels(response.data);
    } catch (err) {
      setSharedLevels([]);
      setSharedLevelsError(err instanceof Error ? err.message : 'Failed to load shared levels.');
    } finally {
      setIsLoadingSharedLevels(false);
    }
  }, []);

  const addTeacherVoiceovers = async (
    payload: GeneratedGameStoragePayload
  ): Promise<GeneratedGameStoragePayload> => {
    if (!voiceActingEnabled) {
      const textOnlyPayload = { ...payload };
      delete textOnlyPayload.voiceovers;
      return textOnlyPayload;
    }

    const candidate = payload.json;
    if (!candidate || typeof candidate !== 'object') return payload;

    const fields = candidate as Record<string, unknown>;
    const intro = getDialogueText(fields.intro);
    const conclusion = getDialogueText(fields.conclusion);

    if (!intro || !conclusion) {
      return payload;
    }

    setCurrentMessage('Recording teacher voice...');

    try {
      const response = await generateTeacherVoiceoversAction({
        intro,
        conclusion,
      });

      if (!response.success) {
        console.warn('Teacher voiceover generation skipped:', response.error);
        return payload;
      }

      const voiceovers = response.data;
      if (!voiceovers?.introAudioUrl && !voiceovers?.conclusionAudioUrl) {
        return payload;
      }

      return {
        ...payload,
        voiceovers,
      };
    } catch (err) {
      console.warn('Teacher voiceover generation failed; continuing text-only.', err);
      return payload;
    }
  };

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

    const timer = window.setTimeout(() => {
      loadSharedLevels();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadSharedLevels]);

  useEffect(() => {
    if (menuView !== 'browse') return;

    const timer = window.setTimeout(() => {
      loadSharedLevels();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadSharedLevels, menuView]);

  useEffect(() => {
    if (filePickerRequest === 0) return;
    fileInputRef.current?.click();
  }, [filePickerRequest]);

  useEffect(() => {
    if (fileInputResetRequest === 0) return;
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [fileInputResetRequest]);



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
    setFilePickerRequest((request) => request + 1);
  };

  const handleFileSelection = (selectedFile: File) => {
    setError(null);
    setLoadingDescription(null);
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
    setHasLoadedGame(false);
    setLoadingDescription(null);
    sessionStorage.removeItem(GENERATED_GAME_STORAGE_KEY);
    localStorage.removeItem(GENERATED_GAME_STORAGE_KEY);
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

      const gameConfig = gameConfigFromParsedDocument(structuredJson, selectedFile.name);

      const responseData: GeneratedGameStoragePayload = {
        json: gameConfig,
        version: 'unknown',
        size: selectedFile.size,
        name: selectedFile.name,
      };

      const enrichedResponseData = await addTeacherVoiceovers(responseData);
      sessionStorage.setItem(GENERATED_GAME_STORAGE_KEY, JSON.stringify(enrichedResponseData));
      localStorage.setItem(GENERATED_GAME_STORAGE_KEY, JSON.stringify(enrichedResponseData));
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
    setHasLoadedGame(false);
    setLoadingDescription(null);
    sessionStorage.removeItem(GENERATED_GAME_STORAGE_KEY);
    localStorage.removeItem(GENERATED_GAME_STORAGE_KEY);

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
        if (activeInterval) {
          clearInterval(activeInterval);
          activeInterval = null;
        }
        const enrichedResponseData = await addTeacherVoiceovers(response.data);
        sessionStorage.setItem(GENERATED_GAME_STORAGE_KEY, JSON.stringify(enrichedResponseData));
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

  const handleSelectSharedLevel = async (level: SharedLevelSummary) => {
    playSound('menu_select');
    setError(null);
    setHasLoadedGame(false);
    sessionStorage.removeItem(GENERATED_GAME_STORAGE_KEY);
    localStorage.removeItem(GENERATED_GAME_STORAGE_KEY);

    const responseData: GeneratedGameStoragePayload = {
      json: level.gameConfig,
      version: 'shared',
      size: 0,
      name: `${level.title}.clashroom`,
    };

    if (!voiceActingEnabled) {
      sessionStorage.setItem(GENERATED_GAME_STORAGE_KEY, JSON.stringify(responseData));
      localStorage.setItem(GENERATED_GAME_STORAGE_KEY, JSON.stringify(responseData));
      setHasLoadedGame(true);
      router.push('/game');
      return;
    }

    setIsParsing(true);
    setLoadingDescription(`Mizue Sensei is loading "${level.title}"...`);
    setCurrentMessage('Loading shared level...');

    try {
      const enrichedResponseData = await addTeacherVoiceovers(responseData);
      sessionStorage.setItem(GENERATED_GAME_STORAGE_KEY, JSON.stringify(enrichedResponseData));
      localStorage.setItem(GENERATED_GAME_STORAGE_KEY, JSON.stringify(enrichedResponseData));
      setHasLoadedGame(true);
      router.push('/game');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load shared level.');
    } finally {
      setIsParsing(false);
      setLoadingDescription(null);
    }
  };

  const menuItems = menuView === 'main' ? [
    {
      id: 'browse',
      name: 'Browse Levels',
      onClick: () => {
        playSound('menu_select');
        setMenuView('browse');
      }
    },
    {
      id: 'play_upload',
      name: 'Upload Level',
      onClick: () => {
        playSound('menu_select');
        handleUploadClick();
      }
    },
    ...(hasLoadedGame ? [{
      id: 'play_loaded',
      name: 'Play',
      onClick: () => {
        playSound('menu_select');
        router.push('/game');
      }
    }] : []),
    ...(hasLoadedGame ? [{
      id: 'unload',
      name: 'Unload Level',
      onClick: () => {
        playSound('menu_select');
        localStorage.removeItem(GENERATED_GAME_STORAGE_KEY);
        sessionStorage.removeItem(GENERATED_GAME_STORAGE_KEY);
        setHasLoadedGame(false);
        setFile(null);
        setError(null);
        setFileInputResetRequest((request) => request + 1);
      }
    }] : []),
    {
      id: 'settings',
      name: 'Settings',
      onClick: () => {
        playSound('menu_select');
        setMenuView('settings');
      }
    },
  ] : [
    {
      id: 'sound',
      name: `Sound: ${muted ? 'Off' : 'On'}`,
      onClick: () => {
        playSound('menu_select');
        toggleMuted();
      }
    },
    {
      id: 'difficulty',
      name: `Difficulty: ${difficulty}`,
      onClick: () => {
        playSound('menu_select');
        setDifficulty((prev) => {
          if (prev === 'Easy') return 'Medium';
          if (prev === 'Medium') return 'Hard';
          return 'Easy';
        });
      }
    },
    {
      id: 'voice_acting',
      name: `Voice Acting: ${voiceActingEnabled ? 'On' : 'Off'}`,
      onClick: () => {
        playSound('menu_select');
        toggleVoiceActing();
      }
    },
    {
      id: 'language',
      name: 'Language (EN)',
    },
    {
      id: 'back',
      name: 'Back',
      onClick: () => {
        playSound('menu_select');
        setMenuView('main');
      }
    }
  ];
  const mid = (menuItems.length - 1) / 2;

  const filteredLevels = sharedLevels.filter(level =>
    level.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    level.topicName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    level.topicSummary.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div
      onDragEnter={handleDrag}
      onDragOver={handleDrag}
      onDragLeave={handleDrag}
      onDrop={handleDrop}
      className={`min-h-screen text-slate-100 flex flex-col font-sans relative selection:bg-sky-400 selection:text-white transition-all duration-300 overflow-x-hidden ${isDragActive ? 'brightness-110 contrast-95 ring-8 ring-sky-400/50 ring-inset' : ''
        }`}
      style={{
        backgroundImage: "linear-gradient(rgba(255, 255, 255, 0), rgba(255, 255, 255, 0)), url('/backgrounds/frutiger.jpg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >




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

                    {menuView === 'browse' ? (
                      <div className="w-full flex flex-col h-[340px] gap-4">
                        {/* Search bar & Back Button */}
                        <div className="flex items-center gap-3 w-full pr-4">
                          <button
                            onClick={() => {
                              playSound('menu_select');
                              setMenuView('main');
                              setSearchQuery('');
                            }}
                            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 transition-all text-white flex items-center justify-center cursor-pointer shadow-md hover:scale-105 active:scale-95 shrink-0"
                            aria-label="Back to main menu"
                          >
                            <ArrowLeft className="w-5 h-5" />
                          </button>
                          <div className="relative flex-1">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 pointer-events-none" />
                            <input
                              type="text"
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              placeholder="Search levels..."
                              className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-xl text-sm text-white placeholder-slate-300 focus:outline-none focus:border-sky-400 focus:bg-white/15 transition-all shadow-inner"
                            />
                          </div>
                        </div>

                        {/* Level cards list */}
                        <div className="flex-1 overflow-y-auto pr-3 space-y-3 scrollbar-thin scrollbar-thumb-sky-500/50 scrollbar-track-transparent">
                          {isLoadingSharedLevels ? (
                            <div className="text-center py-10 text-sm text-slate-300 font-semibold bg-white/5 border border-white/10 rounded-2xl">
                              Loading shared levels...
                            </div>
                          ) : sharedLevelsError ? (
                            <div className="space-y-3 text-center py-8 px-4 text-sm text-red-200 font-semibold bg-red-500/10 border border-red-400/20 rounded-2xl">
                              <p>{sharedLevelsError}</p>
                              <button
                                type="button"
                                onClick={() => {
                                  playSound('menu_select');
                                  loadSharedLevels();
                                }}
                                className="inline-flex items-center justify-center rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-xs font-black text-white transition-all hover:bg-white/20"
                              >
                                Try Again
                              </button>
                            </div>
                          ) : filteredLevels.length > 0 ? (
                            filteredLevels.map((level) => (
                              <motion.div
                                key={level.id}
                                whileHover={{ scale: 1.02, x: 4 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => handleSelectSharedLevel(level)}
                                onMouseEnter={() => playSound('menu_hover')}
                                className="glass-panel p-4 shadow-md border border-white/25 hover:border-white/45 rounded-2xl relative overflow-hidden bg-white/10 hover:bg-white/15 cursor-pointer flex flex-col justify-between transition-all group"
                              >
                                <div className="flex justify-between items-start gap-2">
                                  <div className="space-y-0.5">
                                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-sky-200 group-hover:text-sky-300 transition-colors">
                                      {level.topicName}
                                    </span>
                                    <h4 className="font-extrabold text-base text-white text-shadow-sm group-hover:text-sky-100 transition-colors">
                                      {level.title}
                                    </h4>
                                    <p className="line-clamp-2 text-xs font-semibold leading-relaxed text-slate-200/80">
                                      {level.topicSummary}
                                    </p>
                                  </div>
                                </div>

                                <div className="flex justify-end items-center mt-3 pt-2 border-t border-white/10 text-[10px] text-slate-300 font-bold">
                                  <div className="flex items-center gap-1 text-sky-200 group-hover:text-sky-100 font-black">
                                    <span>Play Level</span>
                                    <Play className="w-3 h-3 fill-sky-200 group-hover:fill-sky-100 transition-all group-hover:translate-x-0.5" />
                                  </div>
                                </div>
                              </motion.div>
                            ))
                          ) : (
                            <div className="text-center py-10 text-sm text-slate-300 font-semibold bg-white/5 border border-white/10 rounded-2xl">
                              {searchQuery
                                ? `No levels found matching "${searchQuery}"`
                                : 'No shared levels found yet.'}
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-5 items-start justify-center h-[340px] w-full">
                        {menuItems.map((item, index) => {
                          const baseX = (2.0 - Math.pow(Math.abs(mid - index), 1.5)) * 18;
                          const baseRotate = (index - mid) * 6.0;
                          const isActive = !!item.onClick;

                          return (
                            <motion.button
                              key={item.id}
                              onClick={item.onClick}
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
                    )}
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
                  <div className="relative h-24 w-24 flex items-center justify-center">
                    {/* Outer spinner ring */}
                    <div className="absolute inset-0 rounded-full border-4 border-white/20" />
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                      className="absolute inset-0 rounded-full border-4 border-sky-400 border-t-transparent"
                    />
                    {/* Floating Mascot in center */}
                    <motion.img
                      src="/characters/mascot.png"
                      alt="Loading Mascot"
                      animate={{
                        y: [0, -6, 0],
                        rotate: [0, 4, -4, 0]
                      }}
                      transition={{
                        repeat: Infinity,
                        duration: 3,
                        ease: "easeInOut"
                      }}
                      className="h-16 w-16 object-contain z-10 filter drop-shadow-[0_4px_10px_rgba(56,189,248,0.5)]"
                    />
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
                      {loadingDescription ?? (file?.name?.toLowerCase().endsWith('.clashroom')
                        ? `Mizue Sensei is parsing level data from "${file?.name}"...`
                        : `Mizue Sensei is reviewing "${file?.name}"...`)}
                    </p>
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </div>

          {/* RIGHT HALF: TEACHER WITH FLOATING MASCOT */}
          <div className="flex flex-col w-full h-full min-h-[500px] items-center lg:items-end justify-end relative pb-4">

            {/* Glowing background aura */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-sky-400/15 blur-3xl pointer-events-none animate-pulse z-0" />

            {/* Characters Container (holds teacher and floating mascot, shifted slightly lower and to the right) */}
            <div className="relative w-full max-w-md lg:max-w-lg flex items-end justify-center z-10 translate-x-10 md:translate-x-20 lg:translate-x-28 translate-y-6 md:translate-y-10">

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
                className="h-[400px] md:h-[500px] lg:h-[600px] w-auto object-contain select-none filter drop-shadow-[0_10px_25px_rgba(0,0,0,0.3)] transition-all duration-300"
                whileHover={{ scale: 1.02 }}
              />

              {/* Floating Mascot */}
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
                className="absolute top-[30px] md:top-[40px] right-[15px] md:right-[25px] z-20 flex flex-col items-center gap-1"
              >
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
