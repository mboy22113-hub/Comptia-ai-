import React from "react";
import { Award, BookOpen, Brain, CheckCircle2, Flame, AlertTriangle, TrendingUp, ArrowRight } from "lucide-react";
import { ALL_SYLLABUS_TOPICS, SYLLABUS_DOMAINS } from "../data/syllabus";
import { StudyStats } from "../types";

interface ProgressAnalyticsViewProps {
  stats: StudyStats;
  onNavigate: (tab: string, topicId?: string) => void;
}

export function ProgressAnalyticsView({ stats, onNavigate }: ProgressAnalyticsViewProps) {
  // 1. Overall Completion Progress calculations
  const totalTopics = ALL_SYLLABUS_TOPICS.length;
  const completedCount = stats.completedTopics.length;
  const progressPercent = totalTopics > 0 ? Math.round((completedCount / totalTopics) * 100) : 0;

  // 2. Domain Breakdowns
  const domainBreakdowns = SYLLABUS_DOMAINS.map((domain) => {
    const totalInDomain = domain.topics.length;
    const completedInDomain = domain.topics.filter((t) => stats.completedTopics.includes(t.id)).length;
    const percent = totalInDomain > 0 ? Math.round((completedInDomain / totalInDomain) * 100) : 0;
    return {
      name: domain.name,
      short: domain.name.split(":")[0],
      total: totalInDomain,
      completed: completedInDomain,
      percent
    };
  });

  // 3. Quiz Performance
  const totalQuizzes = stats.quizHistory.length;
  const avgQuizAccuracy = totalQuizzes > 0
    ? Math.round(stats.quizHistory.reduce((sum, item) => sum + (item.score / item.questionsCount) * 100, 0) / totalQuizzes)
    : 0;

  // 4. Flashcards Performance
  const totalFlashcards = stats.flashcards.length;
  const learnedCount = stats.flashcards.filter((f) => f.learned).length;

  // 5. Compute Strong vs Weak Topics based on quiz history
  const topicQuizScores: Record<string, { totalScores: number; count: number; title: string }> = {};
  
  stats.quizHistory.forEach((q) => {
    if (!topicQuizScores[q.topicId]) {
      topicQuizScores[q.topicId] = { totalScores: 0, count: 0, title: q.topicTitle };
    }
    const scorePct = (q.score / q.questionsCount) * 100;
    topicQuizScores[q.topicId].totalScores += scorePct;
    topicQuizScores[q.topicId].count += 1;
  });

  const strongTopics: Array<{ id: string; title: string; score: number }> = [];
  const weakTopics: Array<{ id: string; title: string; score: number }> = [];

  Object.entries(topicQuizScores).forEach(([topicId, info]) => {
    const avgScore = Math.round(info.totalScores / info.count);
    if (avgScore >= 80) {
      strongTopics.push({ id: topicId, title: info.title, score: avgScore });
    } else if (avgScore < 70) {
      weakTopics.push({ id: topicId, title: info.title, score: avgScore });
    }
  });

  // Fallbacks if history is empty (make the page feel complete anyway)
  const defaultWeakTopics = [
    { id: "1.3", title: "Differentiate Key Cryptographic Concepts" },
    { id: "2.2", title: "Explain Threat Vectors and Attack Types" }
  ];

  return (
    <div className="space-y-6 md:space-y-8 max-w-5xl mx-auto">
      {/* Visual Progress Overview bento */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Course Progress Chart */}
        <div className="md:col-span-2 bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6 flex flex-col justify-between">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-800 tracking-wide uppercase flex items-center gap-1.5">
              <TrendingUp className="text-blue-600" size={16} />
              Syllabus Domain breakdown
            </h3>
            <p className="text-xs text-slate-500 font-medium">Your learning completion of official Security+ domains.</p>
          </div>

          <div className="space-y-4">
            {domainBreakdowns.map((domain) => (
              <div key={domain.name} className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold text-slate-700">
                  <span>{domain.short} &bull; {domain.name.split(":").slice(1).join(":")}</span>
                  <span className="text-slate-800 font-mono">
                    {domain.completed}/{domain.total} ({domain.percent}%)
                  </span>
                </div>
                <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-blue-600 h-full rounded-full transition-all duration-300"
                    style={{ width: `${domain.percent}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Aggregate statistics */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-800 tracking-wide uppercase">Core Summary Metrics</h3>
            <p className="text-xs text-slate-500 font-medium font-semibold">Overall stats recorded.</p>
          </div>

          <div className="space-y-5 flex-1 flex flex-col justify-center">
            {/* Percent complete */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                <BookOpen size={18} />
              </div>
              <div>
                <div className="text-lg font-extrabold text-slate-900 font-mono">{progressPercent}%</div>
                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Syllabus Complete</div>
              </div>
            </div>

            {/* Quizzes average */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                <Award size={18} />
              </div>
              <div>
                <div className="text-lg font-extrabold text-slate-900 font-mono">{avgQuizAccuracy}%</div>
                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Quiz Accuracy ({totalQuizzes} taken)</div>
              </div>
            </div>

            {/* Flashcards studied */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 shrink-0">
                <Brain size={18} />
              </div>
              <div>
                <div className="text-lg font-extrabold text-slate-900 font-mono">{learnedCount} / {totalFlashcards}</div>
                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider font-semibold">Memorized Terms</div>
              </div>
            </div>
          </div>

          <div className="p-2.5 bg-gray-50 rounded-lg border border-gray-150 text-center text-xs flex justify-center items-center gap-1.5 font-semibold">
            <Flame className="text-amber-500" size={14} />
            <span className="text-slate-500 font-medium">Daily Streak:</span>
            <span className="text-slate-800 font-mono font-bold">{stats.dailyStreak} days</span>
          </div>
        </div>
      </div>

      {/* Weak & Strong Topics analysis grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Strong Topics (Proficient) */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 uppercase tracking-wider">
            <CheckCircle2 size={14} />
            <span>Strongest syllabus Areas (&ge;80% quiz score)</span>
          </div>

          {strongTopics.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400 italic font-semibold">
              Complete quizzes with high scores to identify your strongest domains!
            </div>
          ) : (
            <div className="space-y-2">
              {strongTopics.map((topic) => (
                <div
                  key={topic.id}
                  className="p-3 rounded-lg bg-slate-50 border border-gray-150 flex justify-between items-center"
                >
                  <div className="min-w-0 pr-2">
                    <span className="text-[9px] bg-slate-200 font-mono font-bold text-slate-700 px-1.5 py-0.5 rounded-md border border-gray-250">
                      {topic.id}
                    </span>
                    <h4 className="text-xs font-bold text-slate-800 truncate mt-1.5">{topic.title}</h4>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-bold font-mono text-emerald-600">{topic.score}%</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Weak Topics (Requires Review) */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-600 uppercase tracking-wider">
            <AlertTriangle size={14} />
            <span>Areas needing study focus / reviews</span>
          </div>

          {weakTopics.length === 0 ? (
            /* Show default derived topics if none registered yet */
            <div className="space-y-2">
              <p className="text-[11px] text-slate-500 font-semibold italic px-1">Based on common exam pitfalls, the following topics are typical focus objectives:</p>
              {defaultWeakTopics.map((topic) => (
                <div
                  key={topic.id}
                  onClick={() => onNavigate("Syllabus", topic.id)}
                  className="p-3 rounded-lg bg-slate-50 border border-gray-150 hover:border-blue-300 transition-all cursor-pointer flex justify-between items-center"
                >
                  <div className="min-w-0">
                    <span className="text-[9px] bg-slate-200 font-mono font-bold text-slate-700 px-1.5 py-0.5 rounded-md border border-gray-250">
                      {topic.id}
                    </span>
                    <h4 className="text-xs font-bold text-slate-700 truncate mt-1.5">{topic.title}</h4>
                  </div>
                  <ArrowRight size={12} className="text-gray-400" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {weakTopics.map((topic) => (
                <div
                  key={topic.id}
                  onClick={() => onNavigate("Syllabus", topic.id)}
                  className="p-3 rounded-lg bg-slate-50 border border-gray-150 hover:border-blue-300 transition-all cursor-pointer flex justify-between items-center"
                >
                  <div className="min-w-0 pr-2">
                    <span className="text-[9px] bg-slate-200 font-mono font-bold text-slate-700 px-1.5 py-0.5 rounded-md border border-gray-250">
                      {topic.id}
                    </span>
                    <h4 className="text-xs font-bold text-slate-800 truncate mt-1.5">{topic.title}</h4>
                  </div>
                  <div className="text-right shrink-0 flex items-center gap-2">
                    <span className="text-xs font-bold font-mono text-amber-600">{topic.score}%</span>
                    <ArrowRight size={12} className="text-gray-400" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
