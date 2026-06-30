import React, { useState, useEffect, useRef } from "react";
import {
  Play,
  CheckCircle,
  CheckCircle2,
  Lock,
  Unlock,
  FileText,
  Award,
  HelpCircle,
  Brain,
  ChevronRight,
  ChevronLeft,
  BookOpen,
  Sparkles,
  RotateCcw,
  Settings,
  Link,
  AlertTriangle,
  Notebook,
  Check,
  Loader2,
  ArrowLeft,
  Clock,
  ThumbsUp,
  FileSignature
} from "lucide-react";
import { MesserVideo, MESSER_VIDEOS } from "../data/messerVideos";
import { ALL_SYLLABUS_TOPICS } from "../data/syllabus";
import { MarkdownRenderer } from "./MarkdownRenderer";

interface ProfessorMesserViewProps {
  onTriggerStudyActivity: () => void;
  onAddQuizHistory?: (quiz: any) => void;
  onAddFlashcards?: (cards: any[]) => void;
}

interface MesserProgressState {
  completedVideos: string[]; // List of video IDs
  videoNotes: { [videoId: string]: string };
  videoSummaries: { [videoId: string]: string };
  videoQuizzes: { [videoId: string]: any[] }; // quiz questions array
  videoFlashcards: { [videoId: string]: any[] }; // flashcards array
  quizScores: { [videoId: string]: { score: number; total: number; date: string }[] };
  flashcardsMastered: { [cardId: string]: boolean };
  watchTime: { [videoId: string]: number }; // seconds watched
  playlistUrl: string;
  unlockAll: boolean;
}

const DEFAULT_PLAYLIST_URL = "https://youtube.com/playlist?list=PLG49S3nxzAnl4QDVqK-hOnoqcSKEIDDuv";
const LOCAL_STORAGE_KEY = "security_plus_messer_progress_v1";

const INITIAL_STATE: MesserProgressState = {
  completedVideos: [],
  videoNotes: {},
  videoSummaries: {},
  videoQuizzes: {},
  videoFlashcards: {},
  quizScores: {},
  flashcardsMastered: {},
  watchTime: {},
  playlistUrl: DEFAULT_PLAYLIST_URL,
  unlockAll: false
};

export function ProfessorMesserView({
  onTriggerStudyActivity,
  onAddQuizHistory,
  onAddFlashcards
}: ProfessorMesserViewProps) {
  // Messer state loaded from localStorage
  const [state, setState] = useState<MesserProgressState>(INITIAL_STATE);
  const [activeVideo, setActiveVideo] = useState<MesserVideo | null>(null);
  
  // App UI modes
  const [showSettings, setShowSettings] = useState(false);
  const [playlistInput, setPlaylistInput] = useState(DEFAULT_PLAYLIST_URL);
  const [activeTab, setActiveTab] = useState<"syllabus" | "notes" | "summary" | "quiz" | "flashcards">("syllabus");

  // Notes save feedback state
  const [notesSaving, setNotesSaving] = useState(false);
  const notesTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // AI Pipeline Loader States
  const [pipelineStep, setPipelineStep] = useState<number>(0); // 0 = idle, 1 = summary, 2 = quiz, 3 = flashcards
  const [pipelineError, setPipelineError] = useState<string | null>(null);

  // Quiz active execution state
  const [quizQuestions, setQuizQuestions] = useState<any[]>([]);
  const [currentQuizIdx, setCurrentQuizIdx] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [quizFinished, setQuizFinished] = useState(false);
  const [quizSavedScore, setQuizSavedScore] = useState<{ score: number; total: number } | null>(null);

  // Flashcards active carousel state
  const [flashcardList, setFlashcardList] = useState<any[]>([]);
  const [currentCardIdx, setCurrentCardIdx] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // Load progress
  useEffect(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Guarantee fields are fully formed
        const merged = { ...INITIAL_STATE, ...parsed };
        setState(merged);
        setPlaylistInput(merged.playlistUrl || DEFAULT_PLAYLIST_URL);
      } catch (e) {
        console.error("Error loading Messer progress:", e);
      }
    }
  }, []);

  // Sync state to LocalStorage
  const saveState = (updated: MesserProgressState) => {
    setState(updated);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
  };

  // Watch Timer (increments active video's watch time by 1s every second)
  useEffect(() => {
    if (!activeVideo) return;

    const interval = setInterval(() => {
      setState((prev) => {
        const currentSeconds = prev.watchTime[activeVideo.id] || 0;
        const updatedWatchTime = {
          ...prev.watchTime,
          [activeVideo.id]: currentSeconds + 1
        };
        const nextState = { ...prev, watchTime: updatedWatchTime };
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(nextState));
        return nextState;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [activeVideo]);

  // Handle saving playlist URL
  const handleSaveSettings = () => {
    const updated = {
      ...state,
      playlistUrl: playlistInput || DEFAULT_PLAYLIST_URL
    };
    saveState(updated);
    setShowSettings(false);
  };

  const handleResetSettings = () => {
    setPlaylistInput(DEFAULT_PLAYLIST_URL);
    const updated = {
      ...state,
      playlistUrl: DEFAULT_PLAYLIST_URL
    };
    saveState(updated);
    setShowSettings(false);
  };

  const toggleUnlockAll = () => {
    const updated = {
      ...state,
      unlockAll: !state.unlockAll
    };
    saveState(updated);
  };

  // Notes state changes with automatic saves
  const handleNotesChange = (text: string) => {
    if (!activeVideo) return;

    // Update state instantly
    const updatedNotes = {
      ...state.videoNotes,
      [activeVideo.id]: text
    };
    saveState({
      ...state,
      videoNotes: updatedNotes
    });

    setNotesSaving(true);
    if (notesTimeoutRef.current) clearTimeout(notesTimeoutRef.current);

    notesTimeoutRef.current = setTimeout(() => {
      setNotesSaving(false);
    }, 800);
  };

  // Determine if a video is unlocked
  const isVideoUnlocked = (index: number) => {
    if (state.unlockAll) return true;
    if (index === 0) return true;
    
    // Unlocked if previous video is marked completed
    const previousVideo = MESSER_VIDEOS[index - 1];
    return state.completedVideos.includes(previousVideo.id);
  };

  // Manual checkbox toggle on the playlist page
  const handleCheckboxToggle = async (video: MesserVideo, index: number, event: React.MouseEvent) => {
    event.stopPropagation(); // Avoid opening the video watch panel
    
    const isCompleted = state.completedVideos.includes(video.id);
    let updatedCompleted: string[];

    if (isCompleted) {
      updatedCompleted = state.completedVideos.filter((id) => id !== video.id);
      saveState({
        ...state,
        completedVideos: updatedCompleted
      });
    } else {
      // Trigger study activity
      onTriggerStudyActivity();
      
      // Select this video so the pipeline can work
      setActiveVideo(video);
      setActiveTab("summary");
      
      // Auto trigger the pipeline
      triggerAIPipeline(video);
    }
  };

  // Run the full automated study pipeline
  const triggerAIPipeline = async (video: MesserVideo) => {
    setPipelineError(null);
    setPipelineStep(1); // Summary generation
    
    const topic = ALL_SYLLABUS_TOPICS.find(t => t.id === video.syllabusTopicId);

    try {
      // Step 1: Summary Generation
      const notes = state.videoNotes[video.id] || "";
      const summaryResponse = await fetch("/api/messer/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoTitle: video.title,
          syllabusTopicId: video.syllabusTopicId,
          syllabusTopicTitle: topic?.title || "",
          userNotes: notes
        })
      });

      if (!summaryResponse.ok) throw new Error("Could not generate summary.");
      const summaryData = await summaryResponse.json();
      
      // Step 2: Quiz Generation (23 practice questions)
      setPipelineStep(2);
      const quizResponse = await fetch("/api/messer/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoTitle: video.title,
          syllabusTopicId: video.syllabusTopicId,
          syllabusTopicTitle: topic?.title || ""
        })
      });

      if (!quizResponse.ok) throw new Error("Could not generate interactive quiz questions.");
      const quizData = await quizResponse.json();

      // Step 3: Flashcards Generation (6 to 8 flashcards)
      setPipelineStep(3);
      const flashcardsResponse = await fetch("/api/messer/flashcards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoTitle: video.title,
          syllabusTopicId: video.syllabusTopicId,
          syllabusTopicTitle: topic?.title || ""
        })
      });

      if (!flashcardsResponse.ok) throw new Error("Could not generate custom studying flashcards.");
      const flashcardData = await flashcardsResponse.json();

      // Save everything and mark video completed
      const updatedCompleted = state.completedVideos.includes(video.id)
        ? state.completedVideos
        : [...state.completedVideos, video.id];

      const updatedSummaries = { ...state.videoSummaries, [video.id]: summaryData.summary };
      const updatedQuizzes = { ...state.videoQuizzes, [video.id]: quizData.questions || [] };
      const updatedFlashcards = { ...state.videoFlashcards, [video.id]: flashcardData.flashcards || [] };

      // Generate flashcard list with unique IDs
      const mappedFlashcards = (flashcardData.flashcards || []).map((fc: any, fIdx: number) => ({
        id: `fc-messer-${video.id}-${fIdx}`,
        topicId: video.syllabusTopicId,
        front: fc.front,
        back: fc.back,
        realWorldExample: fc.realWorldExample,
        memoryTip: fc.memoryTip,
        learned: false,
        favorite: false
      }));

      // Merge cards into parent app dashboard list if callback provided
      if (onAddFlashcards && mappedFlashcards.length > 0) {
        onAddFlashcards(mappedFlashcards);
      }

      saveState({
        ...state,
        completedVideos: updatedCompleted,
        videoSummaries: updatedSummaries,
        videoQuizzes: updatedQuizzes,
        videoFlashcards: mappedFlashcards
      });

      // Populate interactive modules
      setQuizQuestions(quizData.questions || []);
      setCurrentQuizIdx(0);
      setQuizAnswers({});
      setQuizFinished(false);
      setQuizSavedScore(null);

      setFlashcardList(mappedFlashcards);
      setCurrentCardIdx(0);
      setIsFlipped(false);

      setPipelineStep(0); // Completed!
      setActiveTab("summary");
      onTriggerStudyActivity();
    } catch (err: any) {
      console.error(err);
      setPipelineError(err.message || "An error occurred during generative analysis.");
      setPipelineStep(0);
    }
  };

  // Helper selectors
  const totalCompleted = state.completedVideos.length;
  const overallCompletionPercentage = MESSER_VIDEOS.length > 0
    ? Math.round((totalCompleted / MESSER_VIDEOS.length) * 100)
    : 0;

  // Convert watch times into readable format
  const getTotalWatchTimeInSeconds = () => {
    return (Object.values(state.watchTime) as number[]).reduce((a, b) => a + b, 0);
  };

  const formatSeconds = (totalSecs: number) => {
    const hours = Math.floor(totalSecs / 3600);
    const minutes = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    }
    if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    }
    return `${secs}s`;
  };

  // Open a video details / watch workspace
  const handleOpenVideo = (video: MesserVideo) => {
    setActiveVideo(video);
    setActiveTab("syllabus");

    // Load existing summary, quiz, flashcards if already completed
    const existingQuiz = state.videoQuizzes[video.id] || [];
    setQuizQuestions(existingQuiz);
    setCurrentQuizIdx(0);
    setQuizAnswers({});
    setQuizFinished(false);
    
    // If scores exist, show the latest score
    const scores = state.quizScores[video.id] || [];
    if (scores.length > 0) {
      setQuizSavedScore(scores[scores.length - 1]);
    } else {
      setQuizSavedScore(null);
    }

    const existingFlashcards = state.videoFlashcards[video.id] || [];
    setFlashcardList(existingFlashcards);
    setCurrentCardIdx(0);
    setIsFlipped(false);
  };

  // Quiz interactive helpers
  const handleSelectQuizOption = (optionIdx: number) => {
    if (quizAnswers[currentQuizIdx] !== undefined) return; // Answered
    setQuizAnswers({
      ...quizAnswers,
      [currentQuizIdx]: optionIdx
    });
  };

  const submitQuiz = () => {
    if (!activeVideo) return;

    let score = 0;
    quizQuestions.forEach((q, idx) => {
      if (quizAnswers[idx] === q.correctIndex) {
        score += 1;
      }
    });

    const newScore = {
      score,
      total: quizQuestions.length,
      date: new Date().toLocaleDateString()
    };

    const previousScores = state.quizScores[activeVideo.id] || [];
    const updatedScores = {
      ...state.quizScores,
      [activeVideo.id]: [...previousScores, newScore]
    };

    saveState({
      ...state,
      quizScores: updatedScores
    });

    setQuizSavedScore(newScore);
    setQuizFinished(true);

    // Save to global history if callback provided
    if (onAddQuizHistory) {
      onAddQuizHistory({
        id: `messer-quiz-${activeVideo.id}-${Date.now()}`,
        topicId: activeVideo.syllabusTopicId,
        topicTitle: `Messer Course: ${activeVideo.title}`,
        difficulty: 'medium',
        questionsCount: quizQuestions.length,
        score: score,
        questions: quizQuestions.map((q, idx) => ({
          id: `q-${idx}`,
          question: q.question,
          options: q.options,
          correctIndex: q.correctIndex,
          explanation: q.explanation,
          userAnswer: quizAnswers[idx]
        })),
        date: new Date().toLocaleDateString()
      });
    }

    onTriggerStudyActivity();
  };

  const resetQuiz = () => {
    setQuizAnswers({});
    setCurrentQuizIdx(0);
    setQuizFinished(false);
  };

  // Toggle flashcard mastered state
  const toggleFlashcardMastery = (cardId: string) => {
    const isMastered = !!state.flashcardsMastered[cardId];
    const updatedMastered = {
      ...state.flashcardsMastered,
      [cardId]: !isMastered
    };
    saveState({
      ...state,
      flashcardsMastered: updatedMastered
    });
  };

  const totalMasteredCount = Object.values(state.flashcardsMastered).filter(Boolean).length;

  const getAverageQuizScore = () => {
    const allQuizAttempts = Object.values(state.quizScores).flat() as { score: number; total: number; date: string }[];
    if (allQuizAttempts.length === 0) return 0;
    const sum = allQuizAttempts.reduce((acc: number, curr) => acc + (curr.score / curr.total), 0);
    return Math.round((sum / allQuizAttempts.length) * 100);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-white overflow-hidden text-slate-800" id="messer-learning-root">
      
      {/* Top Banner Header with status bar */}
      <div className="px-6 py-4 border-b border-gray-150 flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0 bg-white">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse"></span>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
              Professor Messer Learning Mode
              <Sparkles size={16} className="text-blue-500 fill-blue-500/20" />
            </h1>
          </div>
          <p className="text-xs text-gray-500 mt-1 font-semibold leading-relaxed">
            The ultimate sequential practice companion for the CompTIA Security+ SY0-701 playlist.
          </p>
        </div>

        {/* Global Stats Ribbon */}
        <div className="flex flex-wrap items-center gap-5">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
              <CheckCircle size={16} />
            </div>
            <div>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider leading-tight">Lessons Complete</p>
              <p className="text-sm font-bold text-slate-900 leading-tight">
                {totalCompleted} / {MESSER_VIDEOS.length}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <Clock size={16} />
            </div>
            <div>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider leading-tight">Total Watch Time</p>
              <p className="text-sm font-bold text-slate-900 leading-tight">
                {formatSeconds(getTotalWatchTimeInSeconds())}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-purple-50 text-purple-600">
              <Award size={16} />
            </div>
            <div>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider leading-tight">Avg Quiz Score</p>
              <p className="text-sm font-bold text-slate-900 leading-tight">
                {getAverageQuizScore()}%
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
              <Brain size={16} />
            </div>
            <div>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider leading-tight">Cards Mastered</p>
              <p className="text-sm font-bold text-slate-900 leading-tight">
                {totalMasteredCount}
              </p>
            </div>
          </div>

          {/* Configuration Settings Button */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2.5 rounded-xl border border-gray-200 text-slate-600 hover:bg-gray-50 transition-colors cursor-pointer"
            title="Configure Playlist Settings"
          >
            <Settings size={18} />
          </button>
        </div>
      </div>

      {/* Settings Panel Drawer / Expandable */}
      {showSettings && (
        <div className="bg-slate-50 border-b border-gray-150 px-6 py-4 shrink-0 transition-all">
          <div className="max-w-3xl space-y-3.5">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Link size={15} className="text-blue-500" />
                Configure Playlist Settings
              </h3>
              <button
                onClick={() => setShowSettings(false)}
                className="text-xs text-slate-500 hover:text-slate-800 font-bold hover:underline"
              >
                Close
              </button>
            </div>
            
            <div className="space-y-1.5">
              <label className="text-xs text-gray-500 font-bold">YouTube Playlist URL</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={playlistInput}
                  onChange={(e) => setPlaylistInput(e.target.value)}
                  placeholder="Paste YouTube playlist link here..."
                  className="flex-1 bg-white border border-gray-200 px-3.5 py-2 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-xs"
                />
                <button
                  onClick={handleSaveSettings}
                  className="bg-blue-600 text-white text-xs font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
                >
                  Save URL
                </button>
                <button
                  onClick={handleResetSettings}
                  className="bg-gray-200 text-slate-700 text-xs font-bold py-2 px-3 rounded-lg hover:bg-gray-300 transition-colors cursor-pointer"
                >
                  Reset Default
                </button>
              </div>
              <p className="text-[10px] text-gray-400 font-semibold">
                Changing this URL updates the syllabus learning track anchor point. Note: Pre-mapped videos utilize Professor Messer's standard SY0-701 playlist sequence.
              </p>
            </div>

            <div className="flex items-center gap-2 bg-white p-3 rounded-xl border border-gray-200 max-w-md shadow-2xs">
              <input
                type="checkbox"
                id="unlockAllToggle"
                checked={state.unlockAll}
                onChange={toggleUnlockAll}
                className="rounded text-blue-600 h-4 w-4 focus:ring-0 cursor-pointer"
              />
              <label htmlFor="unlockAllToggle" className="text-xs font-bold text-slate-700 cursor-pointer flex items-center gap-1.5 select-none">
                <Unlock size={13} className="text-amber-500" />
                Bypass sequential flow (Unlock all video lessons)
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Master Content Workspace */}
      <div className="flex-1 overflow-hidden min-h-0 flex flex-col">
        {!activeVideo ? (
          
          /* VIEW 1: PLAYLIST GRID OVERVIEW */
          <div className="flex-1 overflow-y-auto px-6 py-6 bg-gray-50/50">
            <div className="max-w-6xl mx-auto space-y-6">
              
              {/* Giant Progress Bar card */}
              <div className="bg-white p-6 rounded-2xl border border-gray-150 shadow-xs flex flex-col md:flex-row justify-between items-center gap-5">
                <div className="space-y-1.5 flex-1 w-full">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">Overall Playlist Study Progress</span>
                    <span className="text-sm font-extrabold text-blue-600 font-mono">{overallCompletionPercentage}% COMPLETE</span>
                  </div>
                  <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden border border-gray-150/50 shadow-inner">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${overallCompletionPercentage}%` }}
                    ></div>
                  </div>
                </div>

                <div className="flex items-center gap-4 bg-slate-50 px-5 py-3 border border-gray-150 rounded-xl w-full md:w-auto shadow-2xs">
                  <div className="h-10 w-10 rounded-full bg-blue-100/80 text-blue-600 flex items-center justify-center font-bold font-mono text-xs shadow-inner">
                    {totalCompleted}
                  </div>
                  <div>
                    <h4 className="text-xs font-extrabold text-slate-800 leading-tight">Linear Curriculum Unlock</h4>
                    <p className="text-[10px] text-gray-400 font-semibold mt-0.5">
                      {state.unlockAll ? "All lessons available (Bypass enabled)" : `Next: Lesson ${totalCompleted + 1}`}
                    </p>
                  </div>
                </div>
              </div>

              {/* Videos Header */}
              <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                <h3 className="text-sm font-bold text-slate-900 tracking-wide uppercase">Interactive Learning Track</h3>
                <span className="text-xs text-gray-500 font-bold">{MESSER_VIDEOS.length} Lessons Available</span>
              </div>

              {/* Video Lessons Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {MESSER_VIDEOS.map((video, idx) => {
                  const isCompleted = state.completedVideos.includes(video.id);
                  const unlocked = isVideoUnlocked(idx);
                  const topic = ALL_SYLLABUS_TOPICS.find(t => t.id === video.syllabusTopicId);
                  const watchTimeSecs = state.watchTime[video.id] || 0;

                  return (
                    <div
                      key={video.id}
                      onClick={() => {
                        if (unlocked) handleOpenVideo(video);
                      }}
                      className={`group relative bg-white border rounded-2xl overflow-hidden transition-all shadow-2xs ${
                        unlocked
                          ? "cursor-pointer hover:shadow-md hover:border-blue-200 hover:-translate-y-0.5 border-gray-200"
                          : "opacity-60 bg-gray-100 border-gray-200/60 select-none"
                      }`}
                    >
                      {/* Thumbnail Container */}
                      <div className="relative aspect-video w-full overflow-hidden bg-slate-950">
                        {unlocked ? (
                          <>
                            <img
                              src={`https://img.youtube.com/vi/${video.youtubeId}/mqdefault.jpg`}
                              alt={video.title}
                              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-102"
                              referrerPolicy="no-referrer"
                            />
                            {/* Watch progress overlay bar */}
                            {watchTimeSecs > 0 && (
                              <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-700/80">
                                <div className="h-full bg-blue-500 w-1/3 max-w-full"></div>
                              </div>
                            )}
                            <div className="absolute inset-0 bg-black/10 group-hover:bg-black/25 flex items-center justify-center transition-colors">
                              <div className="h-10 w-10 rounded-full bg-white/95 text-blue-600 flex items-center justify-center shadow-lg transform scale-90 group-hover:scale-100 transition-transform">
                                <Play size={18} className="fill-blue-600 ml-0.5" />
                              </div>
                            </div>
                          </>
                        ) : (
                          <div className="h-full w-full flex flex-col items-center justify-center text-slate-400 space-y-2">
                            <Lock size={26} />
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Locked Lesson</span>
                          </div>
                        )}
                        {/* Duration badge */}
                        <span className="absolute bottom-2.5 right-2.5 bg-black/75 text-[10px] text-white font-mono font-bold px-2 py-0.5 rounded-sm">
                          {video.duration}
                        </span>
                        
                        {/* Completion Badge */}
                        {isCompleted && (
                          <span className="absolute top-2.5 right-2.5 bg-emerald-500 text-white p-1 rounded-full shadow-md">
                            <CheckCircle2 size={15} />
                          </span>
                        )}
                      </div>

                      {/* Details Box */}
                      <div className="p-4 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold px-2.5 py-0.5 bg-gray-100 text-gray-500 rounded-full border border-gray-200">
                            Objective {video.syllabusTopicId}
                          </span>
                          <span className="text-[10px] text-gray-400 font-mono font-bold">
                            Lesson {idx + 1}
                          </span>
                        </div>

                        <h4 className="text-sm font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 min-h-[40px] leading-tight">
                          {video.title}
                        </h4>

                        <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            <input
                              type="checkbox"
                              checked={isCompleted}
                              disabled={!unlocked}
                              onClick={(e) => handleCheckboxToggle(video, idx, e)}
                              onChange={() => {}}
                              className="rounded border-gray-300 text-blue-600 h-4 w-4 focus:ring-0 cursor-pointer disabled:cursor-not-allowed"
                            />
                            <span className="text-[11px] text-slate-500 font-bold">
                              {isCompleted ? "Completed" : watchTimeSecs > 0 ? "In Progress" : "Not Started"}
                            </span>
                          </div>

                          {watchTimeSecs > 0 && (
                            <span className="text-[10px] text-slate-400 font-semibold font-mono flex items-center gap-1">
                              <Clock size={10} />
                              {formatSeconds(watchTimeSecs)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          </div>
        ) : (
          
          /* VIEW 2: WATCH VIDEO & AI STUDY KIT WORKSPACE */
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-white">
            
            {/* Left Frame: Video Playback & Metadata */}
            <div className="flex-1 overflow-y-auto border-r border-gray-200 px-6 py-5 flex flex-col space-y-4">
              
              {/* Back breadcrumb */}
              <button
                onClick={() => {
                  setActiveVideo(null);
                  setPipelineError(null);
                }}
                className="flex items-center gap-1.5 text-xs text-slate-600 font-extrabold hover:text-blue-600 transition-colors w-fit group py-1"
              >
                <ArrowLeft size={14} className="transform group-hover:-translate-x-0.5 transition-transform" />
                Back to Syllabus Playlist
              </button>

              {/* YouTube Embedded Iframe */}
              <div className="aspect-video w-full rounded-2xl overflow-hidden border border-gray-200 bg-black shadow-md relative group">
                <iframe
                  src={`https://www.youtube.com/embed/${activeVideo.youtubeId}?enablejsapi=1&autoplay=1&rel=0`}
                  title={activeVideo.title}
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>

              {/* Title & Syllabus topic context info */}
              <div className="p-4 border border-gray-200/80 rounded-2xl bg-slate-50/50 space-y-3 shadow-3xs">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-150 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-2.5 py-0.5 bg-blue-100 text-blue-700 rounded-full border border-blue-200/60">
                      Objective {activeVideo.syllabusTopicId}
                    </span>
                    <span className="text-xs text-slate-500 font-semibold">{activeVideo.domainName}</span>
                  </div>
                  <span className="text-xs text-slate-400 font-mono font-bold">Duration: {activeVideo.duration}</span>
                </div>

                <h2 className="text-lg font-black text-slate-900 leading-tight tracking-tight">
                  {activeVideo.title}
                </h2>

                {(() => {
                  const topic = ALL_SYLLABUS_TOPICS.find(t => t.id === activeVideo.syllabusTopicId);
                  if (topic) {
                    return (
                      <div className="space-y-1 bg-white p-3 rounded-xl border border-gray-150">
                        <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                          <BookOpen size={13} className="text-blue-500" />
                          Exam Objective Detail: {topic.title}
                        </h4>
                        <p className="text-[11px] text-gray-500 leading-relaxed font-semibold">
                          {topic.description}
                        </p>
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>

              {/* Interactive Pipeline Action triggers */}
              <div className="bg-blue-600 text-white rounded-2xl p-5 border border-blue-700 shadow-sm flex flex-col md:flex-row items-center justify-between gap-5">
                <div className="space-y-1 text-center md:text-left">
                  <h3 className="text-sm font-extrabold flex items-center justify-center md:justify-start gap-1.5">
                    <Sparkles size={16} className="fill-white/20 animate-pulse" />
                    AI Lesson Summarizer & Study Kit Generator
                  </h3>
                  <p className="text-[11px] text-blue-100 font-semibold leading-relaxed">
                    Finish watching, then generate your custom Markdown lesson summary, practice quiz, and flashcards!
                  </p>
                </div>

                <div className="shrink-0 w-full md:w-auto">
                  {pipelineStep > 0 ? (
                    <button
                      disabled
                      className="w-full flex items-center justify-center gap-2 bg-white/20 text-white border border-white/20 text-xs font-bold py-2.5 px-5 rounded-xl cursor-not-allowed"
                    >
                      <Loader2 size={14} className="animate-spin" />
                      {pipelineStep === 1 && "Generating Summary (1/3)..."}
                      {pipelineStep === 2 && "Creating AI Quiz (2/3)..."}
                      {pipelineStep === 3 && "Synthesizing Flashcards (3/3)..."}
                    </button>
                  ) : (
                    <button
                      onClick={() => triggerAIPipeline(activeVideo)}
                      className="w-full flex items-center justify-center gap-2 bg-white text-blue-700 hover:bg-blue-50 transition-colors text-xs font-extrabold py-2.5 px-5 rounded-xl cursor-pointer shadow-md shadow-blue-800/20 hover:scale-[1.01]"
                    >
                      {state.completedVideos.includes(activeVideo.id) ? (
                        <>
                          <RotateCcw size={14} />
                          Regenerate Study Kit
                        </>
                      ) : (
                        <>
                          <CheckCircle size={14} />
                          Complete & Generate Study Kit
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Display errors if they occur */}
              {pipelineError && (
                <div className="p-4 border border-red-200 bg-red-50 text-xs text-red-600 rounded-xl flex items-start gap-2.5">
                  <AlertTriangle size={16} className="shrink-0 text-red-500 mt-0.5" />
                  <div>
                    <span className="font-bold">Generative Service Notice:</span> {pipelineError}
                    <button
                      onClick={() => triggerAIPipeline(activeVideo)}
                      className="block text-[10px] text-red-700 font-bold hover:underline mt-1 cursor-pointer"
                    >
                      Retry Generator Pipeline
                    </button>
                  </div>
                </div>
              )}

            </div>

            {/* Right Frame: Personal notes, generated summaries, flashcards, quizzes */}
            <div className="w-full md:w-[480px] lg:w-[550px] overflow-hidden flex flex-col bg-slate-50/50">
              
              {/* ChatGPT Tabbed Controller */}
              <div className="flex border-b border-gray-200 bg-white px-3 py-1.5 shrink-0 overflow-x-auto whitespace-nowrap">
                <button
                  onClick={() => setActiveTab("syllabus")}
                  className={`px-4 py-2 text-xs font-bold rounded-lg cursor-pointer transition-all ${
                    activeTab === "syllabus"
                      ? "bg-blue-50 text-blue-600 shadow-3xs border border-blue-100"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Objective Info
                </button>
                <button
                  onClick={() => setActiveTab("notes")}
                  className={`px-4 py-2 text-xs font-bold rounded-lg cursor-pointer transition-all flex items-center gap-1 ${
                    activeTab === "notes"
                      ? "bg-blue-50 text-blue-600 shadow-3xs border border-blue-100"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Personal Notes
                </button>
                <button
                  onClick={() => setActiveTab("summary")}
                  disabled={!state.videoSummaries[activeVideo.id]}
                  className={`px-4 py-2 text-xs font-bold rounded-lg cursor-pointer transition-all flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed ${
                    activeTab === "summary"
                      ? "bg-blue-50 text-blue-600 shadow-3xs border border-blue-100"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  AI Summary
                </button>
                <button
                  onClick={() => setActiveTab("quiz")}
                  disabled={!state.videoQuizzes[activeVideo.id]}
                  className={`px-4 py-2 text-xs font-bold rounded-lg cursor-pointer transition-all flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed ${
                    activeTab === "quiz"
                      ? "bg-blue-50 text-blue-600 shadow-3xs border border-blue-100"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  AI Quiz
                  {state.videoQuizzes[activeVideo.id] && (
                    <span className="bg-blue-100 text-blue-700 text-[9px] px-1 py-0.2 rounded-full font-mono font-bold">
                      23Q
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab("flashcards")}
                  disabled={!state.videoFlashcards[activeVideo.id]}
                  className={`px-4 py-2 text-xs font-bold rounded-lg cursor-pointer transition-all flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed ${
                    activeTab === "flashcards"
                      ? "bg-blue-50 text-blue-600 shadow-3xs border border-blue-100"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Flashcards
                </button>
              </div>

              {/* Workspace Box */}
              <div className="flex-1 overflow-y-auto px-6 py-5 bg-white flex flex-col min-h-0">
                
                {/* 1. SYLLABUS TAB */}
                {activeTab === "syllabus" && (
                  <div className="space-y-4 flex-1">
                    <div className="p-4 rounded-2xl border border-gray-150 bg-slate-50/50 space-y-3">
                      <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wide">
                        <BookOpen size={13} className="text-blue-500" />
                        Domain Integration Context
                      </h4>
                      <div className="text-xs text-slate-600 space-y-2 leading-relaxed font-semibold">
                        <p>
                          This video maps to <span className="text-slate-900 font-bold">CompTIA Objective {activeVideo.syllabusTopicId}</span> in <span className="text-slate-900 font-bold">{activeVideo.domainName}</span>.
                        </p>
                        <p>
                          To pass the Security+ SY0-701 certification, you must understand both the baseline concepts and practical application scenarios discussed in this topic.
                        </p>
                      </div>
                    </div>

                    <div className="border border-gray-200 rounded-2xl p-4 bg-white shadow-2xs space-y-3">
                      <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <Award size={14} className="text-blue-500" />
                        Study Flow Checklist
                      </h4>
                      <ul className="space-y-2.5 text-xs font-semibold text-slate-600">
                        <li className="flex items-center gap-2">
                          <Check size={14} className="text-blue-500 shrink-0" />
                          <span>Watch the lesson video on Youtube completely.</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Check size={14} className="text-blue-500 shrink-0" />
                          <span>Add notes in the "Personal Notes" tab below/next to the player.</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Check size={14} className="text-blue-500 shrink-0" />
                          <span>Mark the video as complete to trigger the Google Gemini AI Summarizer, Quiz generator, and Flashcards system!</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                )}

                {/* 2. PERSONAL NOTES TAB */}
                {activeTab === "notes" && (
                  <div className="flex-1 flex flex-col space-y-3">
                    <div className="flex justify-between items-center shrink-0">
                      <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wide flex items-center gap-1">
                        <Notebook size={13} className="text-blue-500" />
                        My Lesson Notes
                      </h3>
                      {notesSaving ? (
                        <span className="text-[10px] text-blue-500 font-bold flex items-center gap-1">
                          <Loader2 size={10} className="animate-spin" />
                          Autosaving...
                        </span>
                      ) : (
                        <span className="text-[10px] text-emerald-500 font-bold flex items-center gap-1">
                          <Check size={10} />
                          All changes saved
                        </span>
                      )}
                    </div>

                    <textarea
                      value={state.videoNotes[activeVideo.id] || ""}
                      onChange={(e) => handleNotesChange(e.target.value)}
                      placeholder="Type your notes here while watching the video lesson. Your notes are stored in local storage automatically and will be used by Gemini to enrich lesson summaries..."
                      className="flex-1 bg-slate-50/50 border border-gray-200 rounded-2xl p-4 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none leading-relaxed shadow-inner"
                    />
                  </div>
                )}

                {/* 3. LESSON SUMMARY TAB */}
                {activeTab === "summary" && (
                  <div className="space-y-4 flex-1">
                    <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                      <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wide flex items-center gap-1">
                        <Sparkles size={13} className="text-blue-500" />
                        AI Lesson Summary
                      </h3>
                      <span className="text-[10px] bg-blue-50 text-blue-600 font-bold px-2 py-0.5 rounded-full border border-blue-200/50">
                        Generated via Gemini
                      </span>
                    </div>

                    <div className="prose prose-sm max-w-none text-slate-800">
                      <MarkdownRenderer content={state.videoSummaries[activeVideo.id] || ""} />
                    </div>
                  </div>
                )}

                {/* 4. AI PRACTICE QUIZ TAB */}
                {activeTab === "quiz" && (
                  <div className="flex-1 flex flex-col min-h-0">
                    
                    {!quizFinished ? (
                      quizQuestions.length > 0 ? (
                        <div className="flex-1 flex flex-col min-h-0">
                          {/* Progress Header */}
                          <div className="flex justify-between items-center border-b border-gray-100 pb-2.5 mb-4 shrink-0">
                            <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wide">
                              Messer Practice Quiz
                            </h3>
                            <span className="text-xs font-mono font-extrabold text-blue-600">
                              Question {currentQuizIdx + 1} / {quizQuestions.length}
                            </span>
                          </div>

                          {/* Question Context Card */}
                          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                            <div className="flex items-center gap-2">
                              <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border uppercase ${
                                quizQuestions[currentQuizIdx].type === 'scenario' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                quizQuestions[currentQuizIdx].type === 'tf' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                                quizQuestions[currentQuizIdx].type === 'fitb' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                'bg-blue-50 text-blue-700 border-blue-200'
                              }`}>
                                {quizQuestions[currentQuizIdx].type === 'scenario' ? 'Scenario-Based' :
                                 quizQuestions[currentQuizIdx].type === 'tf' ? 'True / False' :
                                 quizQuestions[currentQuizIdx].type === 'fitb' ? 'Fill-in-the-Blank' :
                                 'Multiple Choice'}
                              </span>
                              <span className="text-[10px] font-bold px-2.5 py-0.5 bg-gray-100 text-gray-500 rounded-full border border-gray-200 uppercase font-mono">
                                {quizQuestions[currentQuizIdx].difficulty}
                              </span>
                            </div>

                            <p className="text-sm font-extrabold text-slate-900 leading-snug">
                              {quizQuestions[currentQuizIdx].question}
                            </p>

                            {/* Options buttons */}
                            <div className="space-y-2.5 pt-2">
                              {quizQuestions[currentQuizIdx].options.map((option: string, idx: number) => {
                                const isSelected = quizAnswers[currentQuizIdx] === idx;
                                const hasAnswered = quizAnswers[currentQuizIdx] !== undefined;
                                const isCorrect = idx === quizQuestions[currentQuizIdx].correctIndex;

                                return (
                                  <button
                                    key={idx}
                                    onClick={() => handleSelectQuizOption(idx)}
                                    disabled={hasAnswered}
                                    className={`w-full text-left text-xs font-semibold px-4 py-3 rounded-xl border transition-all flex items-start gap-3 cursor-pointer ${
                                      isSelected
                                        ? hasAnswered
                                          ? isCorrect
                                            ? "bg-emerald-50 border-emerald-400 text-emerald-900 shadow-xs"
                                            : "bg-red-50 border-red-300 text-red-900 shadow-xs"
                                          : "bg-blue-50 border-blue-400 text-blue-900 shadow-xs"
                                        : hasAnswered && isCorrect
                                        ? "bg-emerald-50 border-emerald-300 text-emerald-900"
                                        : "bg-white hover:bg-gray-50 text-slate-700 border-gray-200"
                                    }`}
                                  >
                                    <span className="h-5 w-5 rounded-full border flex items-center justify-center font-mono font-bold text-[10px] shrink-0 bg-gray-50">
                                      {String.fromCharCode(65 + idx)}
                                    </span>
                                    <span className="leading-relaxed">{option}</span>
                                  </button>
                                );
                              })}
                            </div>

                            {/* Explanatory notes displayed instantly on select */}
                            {quizAnswers[currentQuizIdx] !== undefined && (
                              <div className="p-4 rounded-2xl border border-gray-150 bg-slate-50/50 space-y-2.5 mt-4">
                                <h4 className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                                  {quizAnswers[currentQuizIdx] === quizQuestions[currentQuizIdx].correctIndex ? (
                                    <>
                                      <CheckCircle2 size={14} className="text-emerald-500" />
                                      <span className="text-emerald-700 font-bold">Correct!</span>
                                    </>
                                  ) : (
                                    <>
                                      <AlertTriangle size={14} className="text-red-500" />
                                      <span className="text-red-700 font-bold">Incorrect</span>
                                    </>
                                  )}
                                </h4>
                                <p className="text-[11px] text-gray-500 leading-relaxed font-semibold">
                                  {quizQuestions[currentQuizIdx].explanation}
                                </p>
                                <p className="text-[10px] font-mono text-slate-400 font-bold pt-1 uppercase">
                                  {quizQuestions[currentQuizIdx].objective}
                                </p>
                              </div>
                            )}
                          </div>

                          {/* Navigation footer controls */}
                          <div className="pt-4 border-t border-gray-150 shrink-0 flex justify-between items-center bg-white mt-auto">
                            <button
                              disabled={currentQuizIdx === 0}
                              onClick={() => setCurrentQuizIdx(currentQuizIdx - 1)}
                              className="px-3.5 py-2 rounded-xl border border-gray-200 text-xs font-extrabold text-slate-600 hover:bg-gray-50 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              Previous
                            </button>

                            {currentQuizIdx < quizQuestions.length - 1 ? (
                              <button
                                disabled={quizAnswers[currentQuizIdx] === undefined}
                                onClick={() => setCurrentQuizIdx(currentQuizIdx + 1)}
                                className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-extrabold hover:bg-blue-700 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                              >
                                Next Question
                              </button>
                            ) : (
                              <button
                                disabled={quizAnswers[currentQuizIdx] === undefined}
                                onClick={submitQuiz}
                                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                              >
                                Submit & Finish
                              </button>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-3">
                          <HelpCircle size={36} className="text-slate-300" />
                          <div>
                            <h4 className="text-xs font-bold text-slate-800">Generate your study kit first</h4>
                            <p className="text-[11px] text-gray-400 font-medium mt-1">
                              Mark this lesson as completed to automatically generate the practice questions.
                            </p>
                          </div>
                        </div>
                      )
                    ) : (
                      /* Quiz Result View */
                      <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-4">
                        <Award size={48} className="text-blue-500 fill-blue-500/10" />
                        
                        <div>
                          <h3 className="text-base font-black text-slate-900">Quiz Completed!</h3>
                          <p className="text-xs text-gray-500 mt-1 font-semibold">
                            You completed the AI-generated interactive practice quiz.
                          </p>
                        </div>

                        {quizSavedScore && (
                          <div className="bg-slate-50 border border-gray-200 rounded-2xl px-6 py-4 space-y-1 shadow-inner">
                            <p className="text-xs text-slate-500 font-extrabold uppercase tracking-wide">Your Score</p>
                            <h2 className="text-3xl font-black text-blue-600 font-mono">
                              {quizSavedScore.score} <span className="text-slate-400 font-normal">/ {quizSavedScore.total}</span>
                            </h2>
                            <p className="text-[10px] text-gray-400 font-bold font-mono uppercase">
                              {Math.round((quizSavedScore.score / quizSavedScore.total) * 100)}% Passing Rate
                            </p>
                          </div>
                        )}

                        <div className="flex gap-2">
                          <button
                            onClick={resetQuiz}
                            className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-extrabold text-slate-600 hover:bg-gray-50 cursor-pointer"
                          >
                            Retake Quiz
                          </button>
                          <button
                            onClick={() => setActiveTab("flashcards")}
                            className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-extrabold hover:bg-blue-700 cursor-pointer"
                          >
                            Next: Study Flashcards
                          </button>
                        </div>
                      </div>
                    )}

                  </div>
                )}

                {/* 5. FLASHCARDS TAB */}
                {activeTab === "flashcards" && (
                  <div className="flex-1 flex flex-col min-h-0">
                    
                    {flashcardList.length > 0 ? (
                      <div className="flex-1 flex flex-col min-h-0">
                        {/* Progress Header */}
                        <div className="flex justify-between items-center border-b border-gray-100 pb-2.5 mb-4 shrink-0">
                          <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wide">
                            Study Flashcards
                          </h3>
                          <span className="text-xs font-mono font-extrabold text-blue-600">
                            Card {currentCardIdx + 1} / {flashcardList.length}
                          </span>
                        </div>

                        {/* Interactive Flip Card container */}
                        <div className="flex-1 flex flex-col justify-center py-4">
                          <div
                            onClick={() => setIsFlipped(!isFlipped)}
                            className="aspect-video w-full cursor-pointer perspective-1000 group relative select-none"
                          >
                            <div
                              className={`relative h-full w-full rounded-2xl border border-gray-200/85 transition-all duration-300 transform-style-3d shadow-sm flex flex-col items-center justify-center p-6 text-center ${
                                isFlipped ? "bg-slate-50" : "bg-white"
                              }`}
                            >
                              {!isFlipped ? (
                                /* Front content */
                                <div className="space-y-3">
                                  <span className="text-[9px] font-bold px-2 py-0.5 bg-blue-50 text-blue-600 border border-blue-200 rounded-full uppercase tracking-wider">
                                    Question / Term
                                  </span>
                                  <h3 className="text-sm font-black text-slate-900 leading-snug px-4">
                                    {flashcardList[currentCardIdx].front}
                                  </h3>
                                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider group-hover:text-blue-500 transition-colors mt-2">
                                    Click Card to reveal answer
                                  </p>
                                </div>
                              ) : (
                                /* Back content */
                                <div className="space-y-4 max-h-full overflow-y-auto px-2">
                                  <div className="space-y-1">
                                    <span className="text-[9px] font-bold px-2 py-0.5 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-full uppercase tracking-wider">
                                      Answer / Definition
                                    </span>
                                    <p className="text-xs text-slate-800 font-semibold leading-relaxed pt-1.5">
                                      {flashcardList[currentCardIdx].back}
                                    </p>
                                  </div>

                                  <div className="pt-2 border-t border-gray-150 space-y-1.5 text-left">
                                    <div>
                                      <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">Real-World Case:</span>
                                      <p className="text-[10px] text-gray-500 font-semibold leading-normal">
                                        {flashcardList[currentCardIdx].realWorldExample}
                                      </p>
                                    </div>
                                    <div>
                                      <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">Memory Tip:</span>
                                      <p className="text-[10px] text-blue-600 font-bold leading-normal italic">
                                        💡 {flashcardList[currentCardIdx].memoryTip}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Mastery status & controls */}
                        <div className="shrink-0 flex flex-col space-y-4 bg-white mt-auto pt-4 border-t border-gray-150">
                          
                          <div className="flex justify-between items-center bg-slate-50 p-3 border border-gray-150 rounded-xl shadow-3xs">
                            <span className="text-xs font-bold text-slate-700">Mastery Checklist</span>
                            <button
                              onClick={() => toggleFlashcardMastery(flashcardList[currentCardIdx].id)}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase cursor-pointer transition-colors border ${
                                state.flashcardsMastered[flashcardList[currentCardIdx].id]
                                  ? "bg-emerald-500 text-white border-emerald-600"
                                  : "bg-white text-slate-600 hover:bg-gray-100 border-gray-200"
                              }`}
                            >
                              <CheckCircle size={12} />
                              {state.flashcardsMastered[flashcardList[currentCardIdx].id] ? "Mastered!" : "Mark as Mastered"}
                            </button>
                          </div>

                          <div className="flex justify-between items-center">
                            <button
                              disabled={currentCardIdx === 0}
                              onClick={() => {
                                setCurrentCardIdx(currentCardIdx - 1);
                                setIsFlipped(false);
                              }}
                              className="px-3.5 py-2 rounded-xl border border-gray-200 text-xs font-extrabold text-slate-600 hover:bg-gray-50 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              Previous Card
                            </button>

                            {currentCardIdx < flashcardList.length - 1 ? (
                              <button
                                onClick={() => {
                                  setCurrentCardIdx(currentCardIdx + 1);
                                  setIsFlipped(false);
                                }}
                                className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-extrabold hover:bg-blue-700 cursor-pointer"
                              >
                                Next Card
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  setActiveVideo(null);
                                  setPipelineError(null);
                                }}
                                className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-extrabold hover:bg-emerald-700 cursor-pointer"
                              >
                                Finish Studying
                              </button>
                            )}
                          </div>
                        </div>

                      </div>
                    ) : (
                      <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-3">
                        <Brain size={36} className="text-slate-300" />
                        <div>
                          <h4 className="text-xs font-bold text-slate-800">Flashcards not generated yet</h4>
                          <p className="text-[11px] text-gray-400 font-medium mt-1">
                            Mark this lesson as completed to automatically generate study flashcards.
                          </p>
                        </div>
                      </div>
                    )}

                  </div>
                )}

              </div>

            </div>

          </div>
        )}
      </div>

    </div>
  );
}
