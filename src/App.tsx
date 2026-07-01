import React, { useState, useEffect } from "react";
import {
  LayoutDashboard,
  BookOpen,
  MessageSquare,
  HelpCircle,
  Brain,
  TrendingUp,
  Flame,
  Menu,
  X,
  Sparkles,
  RefreshCw,
  CheckCircle,
  CheckCircle2,
  Award
} from "lucide-react";
import { StudyStats, ChatSession, ChatMessage, Flashcard, QuizHistoryItem } from "./types";
import { ALL_SYLLABUS_TOPICS } from "./data/syllabus";

// Import Views
import { DashboardView } from "./components/DashboardView";
import { SyllabusView } from "./components/SyllabusView";
import { AITutorView } from "./components/AITutorView";
import { AIQuizView } from "./components/AIQuizView";
import { FlashcardsView } from "./components/FlashcardsView";
import { ProgressAnalyticsView } from "./components/ProgressAnalyticsView";

const STORAGE_KEY_STATS = "security_plus_study_stats_v1";
const STORAGE_KEY_CHATS = "security_plus_chats_v1";

const INITIAL_STATS: StudyStats = {
  completedTopics: [],
  youtubeUrls: {},
  quizHistory: [],
  flashcards: [],
  dailyStreak: 0,
  lastStudyDate: undefined
};

export default function App() {
  const [activeTab, setActiveTab] = useState<string>("Dashboard");
  const [stats, setStats] = useState<StudyStats>(INITIAL_STATS);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  
  // Navigation prefills (e.g., from Syllabus "Tutor Concept" or "Generate Quiz")
  const [prefillTopicId, setPrefillTopicId] = useState<string | undefined>(undefined);
  const [prefillTopicTitle, setPrefillTopicTitle] = useState<string | undefined>(undefined);

  // AI loading and mobile UI states
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Load initial state
  useEffect(() => {
    try {
      const savedStats = localStorage.getItem(STORAGE_KEY_STATS);
      if (savedStats) {
        setStats(JSON.parse(savedStats));
      }

      const savedChats = localStorage.getItem(STORAGE_KEY_CHATS);
      if (savedChats) {
        const parsedChats = JSON.parse(savedChats);
        setChatSessions(parsedChats);
        if (parsedChats.length > 0) {
          setActiveSessionId(parsedChats[0].id);
        }
      }
    } catch (e) {
      console.error("Error loading local storage state:", e);
    }
  }, []);

  // Save Stats
  const saveStats = (newStats: StudyStats) => {
    setStats(newStats);
    localStorage.setItem(STORAGE_KEY_STATS, JSON.stringify(newStats));
  };

  // Save Chat sessions
  const saveChatSessions = (newSessions: ChatSession[]) => {
    setChatSessions(newSessions);
    localStorage.setItem(STORAGE_KEY_CHATS, JSON.stringify(newSessions));
  };

  // Streak Update logic
  const triggerStudyActivity = () => {
    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    if (stats.lastStudyDate === today) return; // Already counted today

    let newStreak = stats.dailyStreak;
    if (stats.lastStudyDate) {
      const lastDate = new Date(stats.lastStudyDate);
      const currentDate = new Date(today);
      const diffTime = Math.abs(currentDate.getTime() - lastDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        newStreak += 1;
      } else if (diffDays > 1) {
        newStreak = 1; // Reset streak
      }
    } else {
      newStreak = 1; // First day
    }

    saveStats({
      ...stats,
      dailyStreak: newStreak,
      lastStudyDate: today
    });
  };

  // Toggle topics checked/unchecked
  const handleToggleTopic = (topicId: string) => {
    const isCompleted = stats.completedTopics.includes(topicId);
    let updated: string[];
    if (isCompleted) {
      updated = stats.completedTopics.filter((id) => id !== topicId);
    } else {
      updated = [...stats.completedTopics, topicId];
      triggerStudyActivity(); // Counts as studying!
    }

    saveStats({
      ...stats,
      completedTopics: updated
    });
  };

  // Paste / save youtube URL
  const handleSaveYoutubeUrl = (topicId: string, url: string) => {
    saveStats({
      ...stats,
      youtubeUrls: {
        ...stats.youtubeUrls,
        [topicId]: url
      }
    });
  };

  // Navigate utility from dash
  const handleNavigate = (tab: string, prefillId?: string) => {
    setActiveTab(tab);
    if (prefillId) {
      const topic = ALL_SYLLABUS_TOPICS.find((t) => t.id === prefillId);
      if (topic) {
        if (tab === "AI Tutor") {
          setPrefillTopicTitle(topic.title);
        } else if (tab === "AI Quiz") {
          setPrefillTopicId(topic.id);
        } else if (tab === "Syllabus") {
          setPrefillTopicId(topic.id);
        }
      }
    }
  };

  // CHAT INTERACTION OPERATIONS
  const handleCreateSession = (initialText?: string) => {
    const newId = `session-${Date.now()}`;
    const newSession: ChatSession = {
      id: newId,
      title: initialText ? (initialText.length > 28 ? initialText.slice(0, 28) + "..." : initialText) : "New Conversation",
      messages: [],
      createdAt: new Date().toISOString()
    };

    const updated = [newSession, ...chatSessions];
    saveChatSessions(updated);
    setActiveSessionId(newId);

    if (initialText) {
      handleSendMessage(newId, initialText, updated);
    }
  };

  const handleDeleteSession = (id: string) => {
    const updated = chatSessions.filter((s) => s.id !== id);
    saveChatSessions(updated);
    if (activeSessionId === id) {
      setActiveSessionId(updated.length > 0 ? updated[0].id : null);
    }
  };

  const handleSendMessage = async (sessionId: string, text: string, sessionsOverride?: ChatSession[]) => {
    const sessionsList = sessionsOverride || chatSessions;
    const sessionIndex = sessionsList.findIndex((s) => s.id === sessionId);
    if (sessionIndex === -1) return;

    const session = sessionsList[sessionIndex];
    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: "user",
      content: text,
      timestamp: new Date().toLocaleTimeString()
    };

    // Update session instantly with user message
    const updatedMsgs = [...session.messages, userMsg];
    let updatedTitle = session.title;
    if (session.messages.length === 0) {
      // First message defines title
      updatedTitle = text.length > 32 ? text.slice(0, 32) + "..." : text;
    }

    const updatedSessions = [...sessionsList];
    updatedSessions[sessionIndex] = {
      ...session,
      title: updatedTitle,
      messages: updatedMsgs
    };
    saveChatSessions(updatedSessions);
    setIsAiLoading(true);
    triggerStudyActivity(); // Marks studying!

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: text,
          history: session.messages
        })
      });

      if (!response.ok) {
        let errorMsg = "Tutor backend error. Check your Gemini API configuration.";
        try {
          const errData = await response.json();
          if (errData && errData.error) {
            errorMsg = errData.error;
          }
        } catch (e) {
          // ignore parsing error
        }
        throw new Error(errorMsg);
      }

      const data = await response.json();
      const modelMsg: ChatMessage = {
        id: `msg-ai-${Date.now()}`,
        role: "model",
        content: data.text || "I was unable to retrieve a response from the model.",
        timestamp: new Date().toLocaleTimeString()
      };

      setChatSessions((prevSessions) => {
        const finalSessions = [...prevSessions];
        const sIdx = finalSessions.findIndex((s) => s.id === sessionId);
        if (sIdx !== -1) {
          finalSessions[sIdx] = {
            ...finalSessions[sIdx],
            messages: [...finalSessions[sIdx].messages, modelMsg]
          };
          localStorage.setItem(STORAGE_KEY_CHATS, JSON.stringify(finalSessions));
        }
        return finalSessions;
      });
    } catch (err: any) {
      console.error(err);
      const errMsg: ChatMessage = {
        id: `msg-err-${Date.now()}`,
        role: "model",
        content: `⚠️ **Tutor Error:** ${err.message || "An error occurred."}`,
        timestamp: new Date().toLocaleTimeString()
      };
      setChatSessions((prevSessions) => {
        const finalSessions = [...prevSessions];
        const sIdx = finalSessions.findIndex((s) => s.id === sessionId);
        if (sIdx !== -1) {
          finalSessions[sIdx] = {
            ...finalSessions[sIdx],
            messages: [...finalSessions[sIdx].messages, errMsg]
          };
          localStorage.setItem(STORAGE_KEY_CHATS, JSON.stringify(finalSessions));
        }
        return finalSessions;
      });
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleContinueResponse = async (sessionId: string) => {
    const sessionIndex = chatSessions.findIndex((s) => s.id === sessionId);
    if (sessionIndex === -1 || isAiLoading) return;

    const session = chatSessions[sessionIndex];
    if (session.messages.length === 0) return;

    // Send the last sequence along with a continuation directive
    const directiveMsg: ChatMessage = {
      id: `dir-${Date.now()}`,
      role: "user",
      content: "Please continue your previous explanation or response right where you left off.",
      timestamp: new Date().toLocaleTimeString()
    };

    const updatedMsgs = [...session.messages, directiveMsg];
    const updatedSessions = [...chatSessions];
    updatedSessions[sessionIndex] = {
      ...session,
      messages: updatedMsgs
    };
    saveChatSessions(updatedSessions);
    setIsAiLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: "Please continue your previous explanation or response right where you left off.",
          history: session.messages
        })
      });

      if (!response.ok) {
        let errorMsg = "Continuation failed.";
        try {
          const errData = await response.json();
          if (errData && errData.error) {
            errorMsg = errData.error;
          }
        } catch (e) {
          // ignore
        }
        throw new Error(errorMsg);
      }

      const data = await response.json();
      const continuationText = data.text || "";

      // Append continuation to the previous message or add as a new message
      const finalSessions = [...chatSessions];
      const sIdx = finalSessions.findIndex((s) => s.id === sessionId);
      if (sIdx !== -1) {
        const lastMsgIdx = finalSessions[sIdx].messages.length - 1;
        const lastMsg = finalSessions[sIdx].messages[lastMsgIdx];

        if (lastMsg && lastMsg.role === "model") {
          // Append directly
          const merged = {
            ...lastMsg,
            content: lastMsg.content + "\n\n" + continuationText
          };
          const copy = [...finalSessions[sIdx].messages];
          copy[lastMsgIdx] = merged;
          finalSessions[sIdx].messages = copy;
        } else {
          // Insert new model msg
          finalSessions[sIdx].messages.push({
            id: `msg-cont-${Date.now()}`,
            role: "model",
            content: continuationText,
            timestamp: new Date().toLocaleTimeString()
          });
        }
        saveChatSessions(finalSessions);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsAiLoading(false);
    }
  };

  // QUIZ SAVING METRICS
  const handleAddQuizToHistory = (item: QuizHistoryItem) => {
    const updatedHistory = [...stats.quizHistory, item];
    saveStats({
      ...stats,
      quizHistory: updatedHistory
    });
    triggerStudyActivity();
  };

  // FLASHCARDS HANDLERS
  const handleUpdateFlashcards = (cards: Flashcard[]) => {
    saveStats({
      ...stats,
      flashcards: cards
    });
    triggerStudyActivity();
  };

  const handleToggleFlashcardLearned = (id: string) => {
    const updated = stats.flashcards.map((f) => {
      if (f.id === id) {
        return { ...f, learned: !f.learned };
      }
      return f;
    });
    saveStats({
      ...stats,
      flashcards: updated
    });
  };

  const handleToggleFlashcardFavorite = (id: string) => {
    const updated = stats.flashcards.map((f) => {
      if (f.id === id) {
        return { ...f, favorite: !f.favorite };
      }
      return f;
    });
    saveStats({
      ...stats,
      flashcards: updated
    });
  };

  // Navigation Items
  const menuItems = [
    { name: "Dashboard", icon: LayoutDashboard },
    { name: "Syllabus", icon: BookOpen },
    { name: "AI Tutor", icon: MessageSquare },
    { name: "AI Quiz", icon: HelpCircle },
    { name: "Flashcards", icon: Brain },
    { name: "Progress", icon: TrendingUp }
  ];

  return (
    <div className="flex h-screen w-full bg-white text-slate-800 font-sans overflow-hidden">
      {/* Mobile Sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-xs md:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-gray-200 bg-gray-50/90 py-5 px-4 transition-transform md:static md:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between mb-8 px-2">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm shadow-blue-500/20">
              <Sparkles size={18} />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900 leading-tight">Security+ AI Hub</h1>
              <span className="text-[10px] text-gray-500 font-semibold tracking-wider uppercase">CompTIA Prep Companion</span>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-1 rounded text-gray-400 hover:text-slate-800 hover:bg-gray-200 md:hidden cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Syllabus / Progress stats summary */}
        <div className="mb-6 p-3 bg-white border border-gray-200 rounded-xl shadow-xs space-y-2">
          <div className="flex justify-between items-center text-[11px] text-gray-500 font-semibold">
            <span>Overall Progress</span>
            <span className="text-blue-600 font-mono">
              {stats.completedTopics.length} / {ALL_SYLLABUS_TOPICS.length} Complete
            </span>
          </div>
          <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-blue-600 h-full rounded-full transition-all duration-300"
              style={{
                width: `${
                  ALL_SYLLABUS_TOPICS.length > 0
                    ? (stats.completedTopics.length / ALL_SYLLABUS_TOPICS.length) * 100
                    : 0
                }%`
              }}
            ></div>
          </div>
          {stats.dailyStreak > 0 && (
            <div className="flex items-center gap-1 text-[11px] text-amber-600 font-bold">
              <Flame size={12} className="fill-amber-500 stroke-amber-600" />
              <span>{stats.dailyStreak} Day Study Streak!</span>
            </div>
          )}
        </div>

        {/* Menu Navigation list */}
        <nav className="flex-1 space-y-1.5 overflow-y-auto px-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.name;
            return (
              <button
                key={item.name}
                onClick={() => {
                  setActiveTab(item.name);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold tracking-wide transition-all cursor-pointer ${
                  isActive
                    ? "bg-blue-600 text-white shadow-sm shadow-blue-500/10"
                    : "text-slate-600 hover:bg-gray-100 hover:text-slate-900"
                }`}
              >
                <Icon size={16} />
                <span>{item.name}</span>
              </button>
            );
          })}
        </nav>

        {/* Footer info & System Info */}
        <div className="mt-auto pt-4 border-t border-gray-200 px-2 space-y-3">
          <div className="p-3 rounded-xl bg-slate-50 border border-gray-200 flex flex-col gap-1">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Sparkles size={12} className="text-blue-600" />
              AI-Powered Hub
            </span>
            <p className="text-[10px] text-slate-500 leading-normal font-medium">
              Study guides, customized tutor sessions, dynamic practice quizzes, and high-impact flashcards are automatically powered by server-side Gemini intelligence.
            </p>
          </div>

          <div className="flex items-center justify-between text-[11px] text-gray-400 font-medium px-1">
            <span>SY0-701 Companion</span>
            <span>v1.2.0</span>
          </div>
        </div>
      </aside>

      {/* Main Container Right Pane */}
      <main className="flex-1 flex flex-col bg-white overflow-hidden">
        {activeTab === "AI Tutor" ? (
          <AITutorView
            sessions={chatSessions}
            activeSessionId={activeSessionId}
            onSelectSession={setActiveSessionId}
            onCreateSession={handleCreateSession}
            onDeleteSession={handleDeleteSession}
            onSendMessage={handleSendMessage}
            onContinueResponse={handleContinueResponse}
            isLoading={isAiLoading}
            prefillTopicTitle={prefillTopicTitle}
            clearPrefillTopicTitle={() => setPrefillTopicTitle(undefined)}
            onOpenSidebar={() => setSidebarOpen(true)}
            onClose={() => setActiveTab("Dashboard")}
          />
        ) : (
          <>
            {/* Top Header navbar */}
            <header className="flex h-14 items-center justify-between border-b border-gray-200 px-6 shrink-0 bg-white">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="p-1.5 rounded-lg border border-gray-200 text-slate-600 hover:text-slate-900 hover:bg-gray-100 md:hidden cursor-pointer"
                >
                  <Menu size={18} />
                </button>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Active Section</span>
                  <span className="text-xs font-bold text-slate-500">/</span>
                  <span className="text-sm font-bold text-slate-800">{activeTab}</span>
                </div>
              </div>

              {/* Quick study metrics summary at top-bar right */}
              <div className="flex items-center gap-4 text-xs font-semibold text-gray-500">
                <div className="flex items-center gap-1">
                  <CheckCircle className="text-blue-600" size={14} />
                  <span>{stats.completedTopics.length} Topics Studied</span>
                </div>
              </div>
            </header>

            {/* Scrollable View Area */}
            <div className="flex-1 overflow-y-auto px-6 py-6 md:px-10">
              {activeTab === "Dashboard" && (
                <DashboardView
                  stats={stats}
                  onNavigate={handleNavigate}
                />
              )}

              {activeTab === "Syllabus" && (
                <SyllabusView
                  stats={stats}
                  onToggleTopic={handleToggleTopic}
                  onSaveYoutubeUrl={handleSaveYoutubeUrl}
                  onNavigateToTutor={(topicTitle) => handleNavigate("AI Tutor", topicTitle)}
                  onNavigateToQuiz={(topicId) => handleNavigate("AI Quiz", topicId)}
                  selectedTopicId={prefillTopicId}
                />
              )}

              {activeTab === "AI Quiz" && (
                <AIQuizView
                  quizHistory={stats.quizHistory}
                  onAddQuizToHistory={handleAddQuizToHistory}
                  prefillTopicId={prefillTopicId}
                  clearPrefillTopicId={() => setPrefillTopicId(undefined)}
                />
              )}

              {activeTab === "Flashcards" && (
                <FlashcardsView
                  flashcards={stats.flashcards}
                  onUpdateFlashcards={handleUpdateFlashcards}
                  onToggleLearned={handleToggleFlashcardLearned}
                  onToggleFavorite={handleToggleFlashcardFavorite}
                />
              )}

              {activeTab === "Progress" && (
                <ProgressAnalyticsView
                  stats={stats}
                  onNavigate={handleNavigate}
                />
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
