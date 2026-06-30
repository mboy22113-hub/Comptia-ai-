import React from "react";
import { Award, BookOpen, Brain, CheckCircle2, Flame, ArrowRight, ShieldAlert, Sparkles, Trophy, Clock } from "lucide-react";
import { StudyStats } from "../types";
import { ALL_SYLLABUS_TOPICS } from "../data/syllabus";

interface DashboardViewProps {
  stats: StudyStats;
  onNavigate: (tab: string, topicId?: string) => void;
}

export function DashboardView({ stats, onNavigate }: DashboardViewProps) {
  // Calculations
  const totalTopics = ALL_SYLLABUS_TOPICS.length;
  const completedCount = stats.completedTopics.length;
  const remainingCount = totalTopics - completedCount;
  const progressPercent = totalTopics > 0 ? Math.round((completedCount / totalTopics) * 100) : 0;

  // Quiz calculations
  const totalQuizzes = stats.quizHistory.length;
  const averageQuizScore = totalQuizzes > 0
    ? Math.round(stats.quizHistory.reduce((sum, item) => sum + (item.score / item.questionsCount) * 100, 0) / totalQuizzes)
    : 0;

  // Flashcards calculations
  const totalFlashcards = stats.flashcards.length;
  const learnedFlashcards = stats.flashcards.filter(f => f.learned).length;

  // Get next logical topic to study (first incomplete)
  const nextTopic = ALL_SYLLABUS_TOPICS.find(t => !stats.completedTopics.includes(t.id)) || ALL_SYLLABUS_TOPICS[0];

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden bg-white p-6 md:p-8 rounded-2xl border border-gray-200 shadow-sm">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50/40 blur-3xl rounded-full -mr-16 -mt-16 pointer-events-none"></div>
        <div className="relative z-10 space-y-3.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-xs font-semibold">
            <Sparkles size={13} />
            <span>AI-Powered Security+ Coach SY0-701</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
            Welcome to the CompTIA Security+ Learning Hub
          </h1>
          <p className="text-slate-600 text-sm md:text-base max-w-3xl leading-relaxed">
            Track your Security+ syllabus progress, test your knowledge with real-time AI quizzes, practice interactive flashcards, and chat with your customized ChatGPT-style AI Security Coach.
          </p>
          <div className="pt-2">
            <button
              onClick={() => onNavigate("Syllabus", nextTopic?.id)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <span>Continue Learning</span>
              <ArrowRight size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid of Core Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Progress Card */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs flex flex-col justify-between min-h-[140px]">
          <div className="flex justify-between items-start">
            <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">Syllabus Progress</span>
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
              <BookOpen size={16} />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl md:text-3xl font-extrabold text-slate-900">{progressPercent}%</span>
              <span className="text-xs text-slate-500 font-medium">({completedCount}/{totalTopics} Completed)</span>
            </div>
            <div className="w-full bg-gray-100 h-2 rounded-full mt-2.5 overflow-hidden">
              <div
                className="bg-blue-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Study Streak Card */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs flex flex-col justify-between min-h-[140px]">
          <div className="flex justify-between items-start">
            <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">Study Streak</span>
            <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
              <Flame size={16} />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl md:text-3xl font-extrabold text-slate-900">{stats.dailyStreak}</span>
              <span className="text-xs text-slate-500 font-medium">days</span>
            </div>
            <p className="text-xs text-slate-500 mt-2 font-medium">
              {stats.dailyStreak > 0 ? "Fantastic! Keep study patterns consistent." : "Study any topic to activate streak!"}
            </p>
          </div>
        </div>

        {/* Quiz Accuracy Card */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs flex flex-col justify-between min-h-[140px]">
          <div className="flex justify-between items-start">
            <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">Quiz Accuracy</span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <Award size={16} />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl md:text-3xl font-extrabold text-slate-900">{averageQuizScore}%</span>
              <span className="text-xs text-slate-500 font-medium">average score</span>
            </div>
            <p className="text-xs text-slate-500 mt-2 font-medium">
              Across {totalQuizzes} practice {totalQuizzes === 1 ? "quiz" : "quizzes"}
            </p>
          </div>
        </div>

        {/* Flashcards Learned Card */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs flex flex-col justify-between min-h-[140px]">
          <div className="flex justify-between items-start">
            <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">Flashcards Learned</span>
            <div className="p-2 rounded-lg bg-purple-50 text-purple-600">
              <Brain size={16} />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl md:text-3xl font-extrabold text-slate-900">{learnedFlashcards}</span>
              <span className="text-xs text-slate-500 font-medium">/ {totalFlashcards || 0} terms</span>
            </div>
            <p className="text-xs text-slate-500 mt-2 font-medium">
              Marked as fully memorized
            </p>
          </div>
        </div>
      </div>

      {/* Two-Column Detail Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Next Topic Focus Area */}
        <div className="md:col-span-2 space-y-6">
          {nextTopic && (
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-xs flex flex-col justify-between space-y-4">
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">Recommended Next Target</span>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <span className="px-2 py-0.5 text-xs rounded-md bg-slate-100 text-slate-700 font-mono font-bold">
                    {nextTopic.id}
                  </span>
                  {nextTopic.title}
                </h3>
                <p className="text-xs text-slate-500 font-semibold">{nextTopic.domain}</p>
                <p className="text-sm text-slate-600 leading-relaxed mt-1">{nextTopic.description}</p>
              </div>

              <div className="flex flex-wrap gap-2.5 pt-2">
                <button
                  onClick={() => onNavigate("Syllabus", nextTopic.id)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold tracking-wide transition-colors cursor-pointer"
                >
                  <span>Review Syllabus</span>
                  <ArrowRight size={14} />
                </button>
                <button
                  onClick={() => onNavigate("AI Tutor", nextTopic.id)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold tracking-wide transition-colors cursor-pointer"
                >
                  <span>Ask AI Tutor</span>
                </button>
                <button
                  onClick={() => onNavigate("AI Quiz", nextTopic.id)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg text-xs font-semibold tracking-wide transition-colors cursor-pointer"
                >
                  <span>Generate Quiz</span>
                </button>
              </div>
            </div>
          )}

          {/* Exam Strategy Advice Banner */}
          <div className="bg-slate-50 p-5 rounded-xl border border-gray-200 flex gap-4 items-start">
            <div className="p-2 bg-blue-100/50 text-blue-600 rounded-lg shrink-0">
              <ShieldAlert size={18} />
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Security+ SY0-701 Practice Directive</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                The CompTIA exam weights analytical troubleshooting and threat scenario classification highly. We recommend toggling your study sessions between syllabus review, AI Tutor chats, and generating customized practice quizzes to reinforce critical definitions.
              </p>
            </div>
          </div>
        </div>

        {/* Domain Overview Widget */}
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Course Syllabus Progress</h3>
            <div className="space-y-4">
              <div className="flex justify-between text-xs font-semibold text-slate-600">
                <span>Completed Topics:</span>
                <span className="text-blue-600">{completedCount}</span>
              </div>
              <div className="flex justify-between text-xs font-semibold text-slate-600">
                <span>Remaining Topics:</span>
                <span className="text-slate-500">{remainingCount}</span>
              </div>
              <div className="flex justify-between text-xs font-semibold text-slate-600">
                <span>Total Syllabus Modules:</span>
                <span className="text-slate-800">{totalTopics}</span>
              </div>
              <div className="pt-2 border-t border-gray-100 text-center">
                <span className="text-xs text-gray-500">Auto-saved to Progress logs</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
