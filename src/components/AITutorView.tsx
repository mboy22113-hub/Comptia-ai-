import React, { useState, useRef, useEffect } from "react";
import { 
  Plus, 
  Send, 
  Sparkles, 
  MessageSquare, 
  Trash2, 
  Copy, 
  ArrowDown, 
  AlertCircle, 
  Menu, 
  X, 
  Paperclip, 
  Mic, 
  ArrowUp, 
  Check, 
  ThumbsUp, 
  ThumbsDown, 
  RefreshCw,
  Compass,
  LogOut
} from "lucide-react";
import { ChatSession, ChatMessage } from "../types";
import { MarkdownRenderer } from "./MarkdownRenderer";

interface AITutorViewProps {
  sessions: ChatSession[];
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onCreateSession: (initialText?: string) => void;
  onDeleteSession: (id: string) => void;
  onSendMessage: (sessionId: string, text: string) => Promise<void>;
  onContinueResponse: (sessionId: string) => Promise<void>;
  isLoading: boolean;
  prefillTopicTitle?: string; // If coming from syllabus
  clearPrefillTopicTitle?: () => void;
  onOpenSidebar: () => void;
  onClose: () => void;
}

export function AITutorView({
  sessions,
  activeSessionId,
  onSelectSession,
  onCreateSession,
  onDeleteSession,
  onSendMessage,
  onContinueResponse,
  isLoading,
  prefillTopicTitle,
  clearPrefillTopicTitle,
  onOpenSidebar,
  onClose
}: AITutorViewProps) {
  const [inputText, setInputText] = useState("");
  const [controlsVisible, setControlsVisible] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); // Desktop sidebar
  const [localSidebarOpen, setLocalSidebarOpen] = useState(false); // Mobile sidebar drawer
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [feedbackState, setFeedbackState] = useState<{ [msgId: string]: 'liked' | 'disliked' }>({});

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const lastScrollTop = useRef(0);

  // Prefill check
  useEffect(() => {
    if (prefillTopicTitle) {
      const text = `Can you explain the CompTIA Security+ topic: "${prefillTopicTitle}" in simple terms and provide some real-world cybersecurity scenarios?`;
      if (!activeSessionId) {
        // If no active session, create one with prefilled message
        onCreateSession(text);
      } else {
        // Otherwise set to input box
        setInputText(text);
      }
      if (clearPrefillTopicTitle) {
        clearPrefillTopicTitle();
      }
    }
  }, [prefillTopicTitle, activeSessionId, onCreateSession, clearPrefillTopicTitle]);

  // Find active session
  const activeSession = sessions.find((s) => s.id === activeSessionId) || null;

  // Auto-scroll logic
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeSession?.messages, isLoading]);

  // Handle scroll detection for ChatGPT-style hide-on-scroll header and input
  const handleScroll = () => {
    if (!chatContainerRef.current) return;
    const scrollTop = chatContainerRef.current.scrollTop;
    const scrollHeight = chatContainerRef.current.scrollHeight;
    const clientHeight = chatContainerRef.current.clientHeight;

    const deltaY = scrollTop - lastScrollTop.current;

    // Boundary rules so you never hide inputs at the absolute bottom or top extremes
    if (scrollTop <= 20) {
      setControlsVisible(true);
    } else if (scrollTop + clientHeight >= scrollHeight - 20) {
      setControlsVisible(true);
    } else if (Math.abs(deltaY) > 8) {
      if (deltaY > 0) {
        // Scrolling down -> hide
        setControlsVisible(false);
      } else {
        // Scrolling up -> show
        setControlsVisible(true);
      }
    }

    lastScrollTop.current = scrollTop;

    // Show scroll bottom button if scrolled up
    const isUp = scrollHeight - scrollTop - clientHeight > 300;
    setShowScrollBottom(isUp);
  };

  const handleSendSubmit = async () => {
    if (!inputText.trim() || isLoading) return;

    let targetSessionId = activeSessionId;
    const textToSend = inputText;
    setInputText("");

    if (!targetSessionId) {
      onCreateSession(textToSend);
      return;
    }

    await onSendMessage(targetSessionId, textToSend);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendSubmit();
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMessageId(id);
    setTimeout(() => setCopiedMessageId(null), 2000);
  };

  const handleLikeMessage = (msgId: string) => {
    setFeedbackState(prev => ({
      ...prev,
      [msgId]: prev[msgId] === 'liked' ? undefined : 'liked'
    } as any));
  };

  const handleDislikeMessage = (msgId: string) => {
    setFeedbackState(prev => ({
      ...prev,
      [msgId]: prev[msgId] === 'disliked' ? undefined : 'disliked'
    } as any));
  };

  // Pre-configured starter suggestions
  const starters = [
    { title: "Explain Cryptography", text: "What is the difference between symmetric and asymmetric cryptography? Provide real-world examples." },
    { title: "Zero Trust Architecture", text: "Can you explain the Zero Trust security model and its core tenets?" },
    { title: "SQLi vs XSS Attacks", text: "How do SQL Injection and Cross-Site Scripting (XSS) work? How do we mitigate them?" },
    { title: "Incident Response Steps", text: "What are the key phases of the incident response lifecycle according to NIST?" }
  ];

  return (
    <div className="flex h-full w-full bg-white relative overflow-hidden text-slate-900 select-none">
      
      {/* 1. Left Sidebar for Desktop History (collapsible) */}
      <div className={`hidden md:flex flex-col border-r border-gray-200 bg-gray-50 shrink-0 h-full relative z-30 transition-all duration-300 ${
        isSidebarOpen ? "w-[260px]" : "w-0 overflow-hidden border-r-0"
      }`}>
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-white shrink-0 h-[60px]">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Chat History</span>
          <button
            onClick={() => onCreateSession()}
            className="p-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg border border-blue-100 transition-all cursor-pointer shadow-3xs"
            title="Start a new conversation"
          >
            <Plus size={15} />
          </button>
        </div>

        {/* History List */}
        <div className="flex-1 overflow-y-auto px-2 py-3 space-y-1 bg-gray-50/50">
          {sessions.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400 italic font-medium px-4">
              No chats yet. Start typing to start a study session!
            </div>
          ) : (
            sessions.map((s) => {
              const isActive = s.id === activeSessionId;
              return (
                <div
                  key={s.id}
                  className={`group flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-colors ${
                    isActive 
                      ? "bg-white text-slate-950 border border-gray-200 shadow-3xs font-semibold" 
                      : "text-slate-600 hover:bg-gray-200/50 hover:text-slate-900"
                  }`}
                  onClick={() => onSelectSession(s.id)}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <MessageSquare size={14} className="shrink-0 text-blue-500" />
                    <span className="text-xs font-bold truncate leading-tight">
                      {s.title || "Untitled Session"}
                    </span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteSession(s.id);
                    }}
                    className="p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity rounded cursor-pointer"
                    title="Delete Session"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Desktop Sidebar Bottom branding */}
        <div className="p-4 border-t border-gray-200 bg-white text-center shrink-0">
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">CompTIA Security+ SY0-701</span>
        </div>
      </div>

      {/* 2. Mobile sliding history drawer overlay */}
      {localSidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/30 backdrop-blur-3xs transition-opacity duration-300 ease-out" 
            onClick={() => setLocalSidebarOpen(false)}
          ></div>
          
          {/* Drawer Content */}
          <div className="relative flex flex-col w-[280px] h-full bg-white border-r border-gray-200 shadow-2xl transition-transform duration-300 ease-out z-50">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50 h-[60px] shrink-0">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Chat History</span>
              <button 
                onClick={() => setLocalSidebarOpen(false)} 
                className="p-1.5 text-slate-500 hover:bg-gray-150 rounded-lg transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>
            
            {/* New Chat Button inside mobile drawer */}
            <div className="p-3 shrink-0">
              <button
                onClick={() => {
                  onCreateSession();
                  setLocalSidebarOpen(false);
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
              >
                <Plus size={14} />
                <span>New Chat Session</span>
              </button>
            </div>

            {/* List inside mobile drawer */}
            <div className="flex-1 overflow-y-auto px-2 py-1 space-y-1">
              {sessions.length === 0 ? (
                <div className="text-center py-8 text-xs text-gray-400 italic">No chats yet.</div>
              ) : (
                sessions.map((s) => {
                  const isActive = s.id === activeSessionId;
                  return (
                    <div
                      key={s.id}
                      className={`flex items-center justify-between p-3 rounded-xl cursor-pointer ${
                        isActive ? "bg-blue-50/70 text-blue-700 border border-blue-100 font-semibold" : "text-slate-600 hover:bg-gray-100"
                      }`}
                      onClick={() => {
                        onSelectSession(s.id);
                        setLocalSidebarOpen(false);
                      }}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <MessageSquare size={14} className="shrink-0 text-blue-500" />
                        <span className="text-xs font-bold truncate leading-tight">{s.title || "Untitled Session"}</span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteSession(s.id);
                        }}
                        className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            {/* Bottom menu links inside drawer */}
            <div className="p-4 border-t border-gray-200 bg-gray-50 flex flex-col gap-2 shrink-0">
              <button
                onClick={() => {
                  setLocalSidebarOpen(false);
                  onOpenSidebar();
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-3 bg-white hover:bg-gray-100 text-slate-700 text-xs font-bold rounded-xl border border-gray-200 transition-all shadow-3xs"
              >
                <Menu size={14} />
                <span>Open Navigation Menu</span>
              </button>
              <button
                onClick={onClose}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-3 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold rounded-xl border border-red-100 transition-all"
              >
                <LogOut size={14} />
                <span>Exit AI Tutor</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Main Chat Workspace */}
      <div className="flex-1 h-full relative overflow-hidden bg-white flex flex-col">
        
        {/* Top Header Floating Navbar */}
        <header 
          className={`absolute top-0 left-0 right-0 h-[60px] bg-white border-b border-gray-200 px-4 md:px-6 flex items-center justify-between z-30 transition-transform duration-300 ease-in-out shadow-xs ${
            controlsVisible ? "translate-y-0" : "-translate-y-full"
          }`}
        >
          <div className="flex items-center gap-2.5">
            {/* ☰ Menu Button (opens mobile drawer on mobile, collapses sidebar on desktop) */}
            <button
              onClick={() => {
                if (window.innerWidth < 768) {
                  setLocalSidebarOpen(true);
                } else {
                  setIsSidebarOpen(!isSidebarOpen);
                }
              }}
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
              title="Toggle history sidebar"
            >
              <Menu size={18} />
            </button>
            <div className="flex items-center gap-2">
              <Sparkles className="text-blue-600 shrink-0" size={16} />
              <span className="font-bold text-slate-900 text-sm md:text-base tracking-tight">AI Tutor</span>
            </div>
          </div>

          {/* Close/Exit Icon on the right */}
          <button
            onClick={onClose}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all cursor-pointer flex items-center justify-center"
            title="Exit tutor and return to dashboard"
          >
            <LogOut size={16} />
          </button>
        </header>

        {/* Scrollable Chat Area */}
        <div
          ref={chatContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto h-full w-full bg-white select-text pt-[60px] pb-[150px] scroll-smooth"
        >
          {!activeSession || activeSession.messages.length === 0 ? (
            /* Blank screen & Starter suggestions */
            <div className="h-full flex flex-col justify-center items-center text-center max-w-2xl mx-auto px-4 md:px-0 space-y-8 py-12">
              <div className="p-4 rounded-full bg-blue-50 text-blue-600 border border-blue-100/50 shadow-sm animate-pulse">
                <Sparkles size={32} />
              </div>
              <div className="space-y-2.5 max-w-lg">
                <h3 className="text-xl font-bold text-slate-900 tracking-tight">Ask your Security+ AI Coach</h3>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  I am trained on the official CompTIA Security+ SY0-701 curriculum. Type a message below to start, or pick a study starter below to start instant deep-dive learning.
                </p>
              </div>

              {/* Suggestions Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full pt-4">
                {starters.map((starter, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      onCreateSession(starter.text);
                    }}
                    className="p-4 text-left bg-white rounded-2xl border border-gray-200 hover:border-blue-400 text-slate-700 transition-all hover:bg-slate-50/50 flex flex-col gap-1.5 cursor-pointer shadow-xs hover:shadow-sm"
                  >
                    <span className="text-xs font-bold text-blue-600 tracking-wide">{starter.title}</span>
                    <span className="text-[11px] text-gray-500 font-medium line-clamp-2 leading-relaxed">{starter.text}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Active Conversation list (ChatGPT Style) */
            <div className="max-w-3xl mx-auto w-full px-4 md:px-0 py-6 space-y-8">
              {activeSession.messages.map((m) => {
                const isUser = m.role === "user";
                return (
                  <div key={m.id} className="w-full">
                    {isUser ? (
                      /* User Bubble: Aligned Right */
                      <div className="flex justify-end w-full animate-slide-up">
                        <div className="max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 bg-blue-50/70 border border-blue-100/30 text-slate-800 text-sm shadow-3xs relative leading-relaxed font-medium">
                          <p className="whitespace-pre-wrap">{m.content}</p>
                          <div className="flex items-center justify-end gap-1 mt-1.5 text-[10px] text-slate-400">
                            <span>{new Date(m.id.startsWith("msg-") ? parseInt(m.id.split("-")[1]) || Date.now() : Date.now()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                            <span className="text-blue-500 font-bold">✓✓</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Assistant Bubble: Left Aligned with Avatar */
                      <div className="flex flex-col gap-2.5 w-full group animate-slide-up">
                        {/* Avatar Header */}
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-xs">
                            <Sparkles size={12} />
                          </div>
                          <div className="flex items-baseline gap-2">
                            <span className="text-xs font-bold text-slate-800">AI Tutor</span>
                            <span className="text-[10px] text-slate-400 font-medium">
                              {new Date(m.id.startsWith("msg-") ? parseInt(m.id.split("-")[1]) || Date.now() : Date.now()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </span>
                          </div>
                        </div>

                        {/* Message content below avatar */}
                        <div className="pl-9.5 pr-4 text-sm text-slate-800 leading-relaxed">
                          <MarkdownRenderer content={m.content} />
                          
                          {/* Feedback / Action Buttons */}
                          <div className="flex items-center gap-2 mt-4 pt-1 opacity-100 group-hover:opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleCopy(m.id, m.content)}
                              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-slate-700 transition-all cursor-pointer flex items-center gap-1 text-[11px] font-bold"
                              title="Copy response text"
                            >
                              {copiedMessageId === m.id ? (
                                <>
                                  <Check size={12} className="text-emerald-500" />
                                  <span className="text-emerald-500">Copied!</span>
                                </>
                              ) : (
                                <>
                                  <Copy size={12} />
                                  <span>Copy</span>
                                </>
                              )}
                            </button>
                            <button
                              onClick={() => handleLikeMessage(m.id)}
                              className={`p-1.5 rounded-lg hover:bg-gray-100 transition-all cursor-pointer ${
                                feedbackState[m.id] === 'liked' ? 'text-blue-600 bg-blue-50/50' : 'text-gray-400 hover:text-slate-700'
                              }`}
                              title="This was helpful"
                            >
                              <ThumbsUp size={12} />
                            </button>
                            <button
                              onClick={() => handleDislikeMessage(m.id)}
                              className={`p-1.5 rounded-lg hover:bg-gray-100 transition-all cursor-pointer ${
                                feedbackState[m.id] === 'disliked' ? 'text-red-600 bg-red-50/50' : 'text-gray-400 hover:text-slate-700'
                              }`}
                              title="This was not helpful"
                            >
                              <ThumbsDown size={12} />
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* AI Typing Loader Indicator */}
              {isLoading && (
                <div className="flex flex-col gap-2.5 w-full">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-xs">
                      <Sparkles size={12} className="animate-spin" />
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-xs font-bold text-slate-800">AI Tutor</span>
                      <span className="text-[10px] text-slate-400 font-medium animate-pulse">Thinking...</span>
                    </div>
                  </div>
                  <div className="pl-9.5">
                    <div className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-gray-50 border border-gray-200/60 shadow-3xs">
                      <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                      <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                      <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
                    </div>
                  </div>
                </div>
              )}

              {/* Bottom anchor for scroll */}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Scroll To Bottom Helper Circle Button */}
        {showScrollBottom && (
          <button
            onClick={scrollToBottom}
            className="absolute bottom-28 right-6 p-2 rounded-full bg-white border border-gray-200 text-blue-600 hover:text-blue-700 hover:border-blue-300 transition-all shadow-md cursor-pointer z-35 flex items-center justify-center animate-bounce"
            title="Scroll to latest messages"
          >
            <ArrowDown size={14} />
          </button>
        )}

        {/* Bottom Floating Message Input Section */}
        <div 
          className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-white via-white to-transparent pt-6 pb-6 px-4 z-20 transition-transform duration-300 ease-in-out ${
            controlsVisible ? "translate-y-0" : "translate-y-full"
          }`}
        >
          <div className="max-w-3xl mx-auto w-full space-y-3">
            <form onSubmit={handleFormSubmit} className="relative flex items-end border border-gray-200 rounded-2xl bg-white shadow-sm hover:border-gray-300 focus-within:border-gray-400 transition-colors p-2 md:p-2.5">
              
              {/* Attach File Button */}
              <button
                type="button"
                className="p-2 text-gray-400 hover:text-slate-700 hover:bg-gray-100 rounded-xl transition-colors shrink-0 cursor-pointer flex items-center justify-center"
                title="Attach study document or PDF"
              >
                <Paperclip size={18} />
              </button>

              {/* Main Message Text Input Area */}
              <textarea
                rows={1}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Ask your Security+ AI Coach..."
                disabled={isLoading}
                className="flex-1 max-h-36 resize-none bg-transparent py-2.5 px-3 text-xs md:text-sm text-slate-800 placeholder-gray-400 focus:outline-none leading-relaxed font-semibold self-center"
                style={{ minHeight: "38px" }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendSubmit();
                  }
                }}
              />

              {/* Voice Microphone Input Button */}
              <button
                type="button"
                className="p-2 text-gray-400 hover:text-slate-700 hover:bg-gray-100 rounded-xl transition-colors shrink-0 cursor-pointer flex items-center justify-center"
                title="Voice study notes"
              >
                <Mic size={18} />
              </button>

              {/* Floating Send Button */}
              <button
                type="submit"
                disabled={isLoading || !inputText.trim()}
                className="p-2 bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-100 disabled:text-gray-300 transition-all rounded-xl cursor-pointer shadow-3xs shrink-0 flex items-center justify-center"
                title="Send message"
              >
                <ArrowUp size={18} />
              </button>
            </form>

            {/* Helper Disclaimer and Optional Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[10px] text-gray-400 px-1 font-bold">
              <span className="flex items-center gap-1 justify-center sm:justify-start">
                <AlertCircle size={11} className="text-gray-300" />
                <span>Syllabus study scope enforced. I only answer Security+ related topics.</span>
              </span>
              
              {activeSession && activeSession.messages.length > 0 && !isLoading && (
                <button
                  type="button"
                  onClick={() => onContinueResponse(activeSession.id)}
                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 flex items-center gap-1 cursor-pointer py-1 px-2 rounded-lg border border-gray-150 shadow-3xs transition-all self-center"
                >
                  <RefreshCw size={10} className="animate-spin-slow" />
                  <span>Continue Response</span>
                </button>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
