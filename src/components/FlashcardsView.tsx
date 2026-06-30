import React, { useState } from "react";
import { Brain, Sparkles, RefreshCw, Star, ArrowLeft, ArrowRight, Shuffle, Search, CheckCircle, RotateCw, BookOpen } from "lucide-react";
import { ALL_SYLLABUS_TOPICS } from "../data/syllabus";
import { Flashcard } from "../types";

interface FlashcardsViewProps {
  flashcards: Flashcard[];
  onUpdateFlashcards: (cards: Flashcard[]) => void;
  onToggleLearned: (id: string) => void;
  onToggleFavorite: (id: string) => void;
}

export function FlashcardsView({
  flashcards,
  onUpdateFlashcards,
  onToggleLearned,
  onToggleFavorite
}: FlashcardsViewProps) {
  // Config
  const [selectedTopicId, setSelectedTopicId] = useState(ALL_SYLLABUS_TOPICS[0].id);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Deck State
  const [searchTerm, setSearchTerm] = useState("");
  const [filterMode, setFilterMode] = useState<'all' | 'favorites' | 'unlearned'>('all');
  const [activeIndex, setActiveIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const activeTopic = ALL_SYLLABUS_TOPICS.find((t) => t.id === selectedTopicId) || ALL_SYLLABUS_TOPICS[0];

  // Request new Flashcards from AI
  const generateFlashcards = async () => {
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const response = await fetch("/api/flashcards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topicTitle: `${activeTopic.id}: ${activeTopic.title}`,
          topicDescription: activeTopic.description
        })
      });

      if (!response.ok) {
        let errorMsg = "Failed to generate flashcards. Please verify your Gemini API key is configured correctly.";
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
      if (!data.flashcards || !Array.isArray(data.flashcards) || data.flashcards.length === 0) {
        throw new Error("AI generated empty or invalid flashcards data. Please try again.");
      }

      // Convert to types
      const generated: Flashcard[] = data.flashcards.map((f: any, idx: number) => ({
        id: `fc-${Date.now()}-${idx}`,
        topicId: activeTopic.id,
        front: f.front,
        back: f.back,
        learned: false,
        favorite: false
      }));

      // Merge with existing cards (append new cards)
      const merged = [...flashcards, ...generated];
      onUpdateFlashcards(merged);
      setActiveIndex(flashcards.length); // Jump to the first newly added card
      setIsFlipped(false);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "An error occurred during flashcard generation.");
    } finally {
      setIsLoading(false);
    }
  };

  // Filter cards based on search and mode
  const filteredCards = flashcards.filter((card) => {
    // Filter by topic first if chosen
    const matchesSearch =
      card.front.toLowerCase().includes(searchTerm.toLowerCase()) ||
      card.back.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesMode =
      filterMode === "all" ||
      (filterMode === "favorites" && card.favorite) ||
      (filterMode === "unlearned" && !card.learned);

    return matchesSearch && matchesMode;
  });

  const activeCard = filteredCards[activeIndex] || null;

  const handleNext = () => {
    if (activeIndex < filteredCards.length - 1) {
      setIsFlipped(false);
      setTimeout(() => setActiveIndex(activeIndex + 1), 100);
    }
  };

  const handlePrev = () => {
    if (activeIndex > 0) {
      setIsFlipped(false);
      setTimeout(() => setActiveIndex(activeIndex - 1), 100);
    }
  };

  const handleShuffle = () => {
    if (filteredCards.length <= 1) return;
    setIsFlipped(false);
    
    // Shuffle the parent list
    const shuffled = [...flashcards].sort(() => Math.random() - 0.5);
    onUpdateFlashcards(shuffled);
    setActiveIndex(0);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Configuration Header Card */}
      <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Brain className="text-blue-600" size={18} />
              AI Flashcard Studio
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Generate customizable key term reviews on any Security+ objectives.
            </p>
          </div>

          <div className="flex gap-2">
            <select
              value={selectedTopicId}
              onChange={(e) => setSelectedTopicId(e.target.value)}
              className="bg-white text-xs py-2 px-3 rounded-lg border border-gray-200 focus:outline-none focus:border-blue-500 font-bold text-slate-800"
            >
              {ALL_SYLLABUS_TOPICS.map((topic) => (
                <option key={topic.id} value={topic.id}>
                  {topic.id} - {topic.title}
                </option>
              ))}
            </select>

            <button
              onClick={generateFlashcards}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-200 text-white text-xs font-bold uppercase rounded-lg transition-colors cursor-pointer"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="animate-spin" size={12} />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Sparkles size={12} />
                  <span>Generate</span>
                </>
              )}
            </button>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-50 text-red-600 rounded-lg text-xs border border-red-200 font-medium">
            {errorMsg}
          </div>
        )}
      </div>

      {/* Review Mode Toolbar (Search & Filter) */}
      <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex gap-1.5 w-full sm:w-auto shrink-0 overflow-x-auto">
          <button
            onClick={() => {
              setFilterMode("all");
              setActiveIndex(0);
              setIsFlipped(false);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
              filterMode === "all"
                ? "bg-white text-blue-600 border-gray-250 shadow-2xs"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            All Decks ({flashcards.length})
          </button>
          <button
            onClick={() => {
              setFilterMode("favorites");
              setActiveIndex(0);
              setIsFlipped(false);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
              filterMode === "favorites"
                ? "bg-white text-amber-600 border-gray-250 shadow-2xs"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            Starred ({flashcards.filter((c) => c.favorite).length})
          </button>
          <button
            onClick={() => {
              setFilterMode("unlearned");
              setActiveIndex(0);
              setIsFlipped(false);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
              filterMode === "unlearned"
                ? "bg-white text-blue-700 border-gray-250 shadow-2xs"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            Reviewing ({flashcards.filter((c) => !c.learned).length})
          </button>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative text-xs w-full sm:w-48">
            <input
              type="text"
              placeholder="Search terms..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setActiveIndex(0);
              }}
              className="bg-white border border-gray-200 rounded-lg py-1.5 pl-8 pr-4 text-slate-700 w-full focus:outline-none focus:border-blue-500 font-medium placeholder:text-gray-400"
            />
            <Search size={12} className="absolute left-2.5 top-2.5 text-gray-400" />
          </div>

          <button
            onClick={handleShuffle}
            disabled={filteredCards.length <= 1}
            className="p-1.5 rounded-lg border border-gray-200 hover:border-blue-400 text-slate-500 hover:text-slate-800 disabled:opacity-40 disabled:cursor-not-allowed bg-white transition-all cursor-pointer shrink-0"
            title="Shuffle Deck"
          >
            <Shuffle size={14} />
          </button>
        </div>
      </div>

      {/* Main Flashcard interactive arena */}
      {filteredCards.length === 0 ? (
        <div className="p-12 text-center bg-gray-50 rounded-xl border border-gray-200 max-w-lg mx-auto space-y-4">
          <Brain size={32} className="text-gray-400 mx-auto" />
          <h3 className="text-sm font-bold text-slate-800">No flashcards found</h3>
          <p className="text-xs text-slate-500 font-medium">
            {flashcards.length === 0
              ? "Select a topic above and click 'Generate' to create your first series of cybersecurity flashcards with Gemini AI!"
              : "No flashcards match your current search/filter criteria. Try switching filters."}
          </p>
        </div>
      ) : (
        <div className="space-y-6 max-w-xl mx-auto">
          {/* Card View 3D wrapper */}
          <div
            onClick={() => setIsFlipped(!isFlipped)}
            className="group w-full h-80 relative [perspective:1000px] cursor-pointer"
          >
            <div
              className={`w-full h-full rounded-2xl border transition-all duration-500 [transform-style:preserve-3d] shadow-sm ${
                isFlipped ? "[transform:rotateY(180deg)]" : ""
              } ${
                activeCard?.learned
                  ? "border-blue-200 bg-blue-50/5"
                  : "border-gray-200 bg-white"
              }`}
            >
              {/* Front Side */}
              <div className="absolute inset-0 w-full h-full p-6 md:p-8 flex flex-col justify-between [backface-visibility:hidden]">
                {/* Header indicators */}
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[10px] bg-slate-100 border border-gray-150 text-slate-600 px-2 py-0.5 rounded font-mono font-bold">
                    Objective {activeCard?.topicId}
                  </span>
                  <div className="flex gap-2 items-center">
                    {activeCard?.favorite && (
                      <Star size={14} className="fill-amber-500 text-amber-500" />
                    )}
                    {activeCard?.learned && (
                      <span className="text-[10px] bg-blue-50 border border-blue-100 text-blue-600 px-2 py-0.5 rounded-md font-bold uppercase">
                        Learned
                      </span>
                    )}
                  </div>
                </div>

                {/* Term text */}
                <div className="text-center py-4 space-y-2">
                  <h3 className="text-lg md:text-xl font-extrabold text-slate-950 tracking-tight leading-snug">
                    {activeCard?.front}
                  </h3>
                  <div className="inline-flex items-center gap-1.5 text-[10px] text-blue-600 mt-2 bg-blue-50 py-1 px-3.5 rounded-full border border-blue-100 font-bold uppercase tracking-wider">
                    <RotateCw size={11} className="animate-spin duration-[6s]" />
                    <span>Flip Card to View definition</span>
                  </div>
                </div>

                {/* Bottom tracker */}
                <div className="text-center text-xs text-gray-400 font-semibold">
                  Flashcard {activeIndex + 1} of {filteredCards.length}
                </div>
              </div>

              {/* Back Side */}
              <div className="absolute inset-0 w-full h-full p-6 md:p-8 flex flex-col justify-between [backface-visibility:hidden] [transform:rotateY(180deg)]">
                {/* Header indicators */}
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[10px] text-blue-600 font-bold uppercase tracking-widest">AI definition explanation</span>
                  <Star
                    size={14}
                    className={activeCard?.favorite ? "fill-amber-500 text-amber-500" : "text-gray-300"}
                  />
                </div>

                {/* Back summary text */}
                <div className="py-4 text-center">
                  <p className="text-sm md:text-base text-slate-800 leading-relaxed font-semibold max-w-sm mx-auto">
                    {activeCard?.back}
                  </p>
                </div>

                {/* Bottom tracker */}
                <div className="text-center text-xs text-gray-400 font-semibold">
                  Definition side
                </div>
              </div>
            </div>
          </div>

          {/* Controls Bar */}
          <div className="flex items-center justify-between gap-4">
            {/* Left buttons (Toggle Star & Learned) */}
            {activeCard && (
              <div className="flex gap-2">
                <button
                  onClick={() => onToggleFavorite(activeCard.id)}
                  className={`p-2 rounded-lg border transition-all cursor-pointer ${
                    activeCard.favorite
                      ? "bg-amber-50 border-amber-200 text-amber-500"
                      : "border-gray-200 text-gray-400 hover:text-slate-800 bg-white hover:border-gray-300"
                  }`}
                  title="Toggle Favorite"
                >
                  <Star size={14} className={activeCard.favorite ? "fill-amber-500" : ""} />
                </button>
                <button
                  onClick={() => onToggleLearned(activeCard.id)}
                  className={`px-3 py-2 rounded-lg border transition-all text-xs font-bold cursor-pointer flex items-center gap-1.5 ${
                    activeCard.learned
                      ? "bg-blue-50 border-blue-200 text-blue-600"
                      : "border-gray-200 text-gray-500 hover:text-slate-800 bg-white hover:border-gray-300"
                  }`}
                >
                  <span>{activeCard.learned ? "Learned!" : "Mark as Learned"}</span>
                </button>
              </div>
            )}

            {/* Deck Nav navigation buttons */}
            <div className="flex gap-2 ml-auto">
              <button
                onClick={handlePrev}
                disabled={activeIndex === 0}
                className="p-2.5 rounded-lg border border-gray-200 hover:border-blue-300 bg-white text-slate-500 hover:text-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                title="Previous Card"
              >
                <ArrowLeft size={14} />
              </button>
              <button
                onClick={handleNext}
                disabled={activeIndex === filteredCards.length - 1}
                className="p-2.5 rounded-lg border border-gray-200 hover:border-blue-300 bg-white text-slate-500 hover:text-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                title="Next Card"
              >
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
