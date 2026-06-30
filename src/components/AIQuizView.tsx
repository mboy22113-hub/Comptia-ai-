import React, { useState } from "react";
import { HelpCircle, ChevronRight, Award, RefreshCw, Eye, Sparkles, CheckCircle2, XCircle, ArrowRight, ListOrdered, BookOpen } from "lucide-react";
import { ALL_SYLLABUS_TOPICS } from "../data/syllabus";
import { QuizQuestion, QuizHistoryItem } from "../types";
import { ITEXAMS_SY0_701_QUESTIONS } from "../data/itexamsQuestions";

interface AIQuizViewProps {
  quizHistory: QuizHistoryItem[];
  onAddQuizToHistory: (item: QuizHistoryItem) => void;
  prefillTopicId?: string; // If coming from syllabus
  clearPrefillTopicId?: () => void;
}

export function AIQuizView({
  quizHistory,
  onAddQuizToHistory,
  prefillTopicId,
  clearPrefillTopicId
}: AIQuizViewProps) {
  // Quiz Mode Selection
  const [quizMode, setQuizMode] = useState<'ai' | 'itexams'>('itexams');
  const [selectedItexamsDomain, setSelectedItexamsDomain] = useState<string>("all");
  const [itexamsQuestionsCount, setItexamsQuestionsCount] = useState<number>(10);

  // Config states
  const [selectedTopicId, setSelectedTopicId] = useState(() => prefillTopicId || ALL_SYLLABUS_TOPICS[0].id);
  const [questionsCount, setQuestionsCount] = useState<number>(10);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');

  // Active quiz state
  const [quizActive, setQuizActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Active quiz questions & answers
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({}); // questionIndex -> selectedOptionIndex
  const [quizFinished, setQuizFinished] = useState(false);

  // Prefill check
  React.useEffect(() => {
    if (prefillTopicId) {
      setSelectedTopicId(prefillTopicId);
      setQuizMode('ai'); // Automatic fallback if navigating to specific syllabus objective
      if (clearPrefillTopicId) {
        clearPrefillTopicId();
      }
    }
  }, [prefillTopicId, clearPrefillTopicId]);

  const activeTopic = ALL_SYLLABUS_TOPICS.find(t => t.id === selectedTopicId) || ALL_SYLLABUS_TOPICS[0];

  // Request Quiz generation
  const startQuiz = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    setQuizActive(false);
    setQuizFinished(false);
    setQuestions([]);
    setCurrentIndex(0);
    setAnswers({});

    try {
      const response = await fetch("/api/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topicTitle: `${activeTopic.id}: ${activeTopic.title}`,
          topicDescription: activeTopic.description,
          count: questionsCount,
          difficulty: difficulty
        })
      });

      if (!response.ok) {
        throw new Error("Failed to generate quiz. Please ensure your Gemini API key is configured correctly.");
      }

      const data = await response.json();
      if (!data.questions || !Array.isArray(data.questions) || data.questions.length === 0) {
        throw new Error("AI generated empty or invalid quiz questions list. Please try again.");
      }

      // Add unique IDs
      const formattedQuestions: QuizQuestion[] = data.questions.map((q: any, idx: number) => ({
        id: `q-${idx}`,
        question: q.question,
        options: q.options || [],
        correctIndex: q.correctIndex !== undefined ? q.correctIndex : 0,
        explanation: q.explanation || "No explanation provided."
      }));

      setQuestions(formattedQuestions);
      setQuizActive(true);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "An error occurred during quiz generation.");
    } finally {
      setIsLoading(false);
    }
  };

  // Start ITExams static quiz
  const startItexamsQuiz = () => {
    setIsLoading(true);
    setErrorMsg(null);
    setQuizActive(false);
    setQuizFinished(false);
    setQuestions([]);
    setCurrentIndex(0);
    setAnswers({});

    // Small delay to make UI feel rich and responsive
    setTimeout(() => {
      let filtered = [...ITEXAMS_SY0_701_QUESTIONS];
      if (selectedItexamsDomain !== "all") {
        filtered = filtered.filter(q => q.domain === selectedItexamsDomain);
      }

      // Dynamic shuffle of the authentic questions
      const shuffled = filtered.sort(() => 0.5 - Math.random());
      const selected = shuffled.slice(0, Math.min(itexamsQuestionsCount, shuffled.length));

      if (selected.length === 0) {
        setErrorMsg("No questions found for the selected Domain filter.");
        setIsLoading(false);
        return;
      }

      setQuestions(selected);
      setQuizActive(true);
      setIsLoading(false);
    }, 400);
  };

  const handleSelectOption = (optionIdx: number) => {
    // If already answered, don't allow changing
    if (answers[currentIndex] !== undefined) return;

    setAnswers((prev) => ({
      ...prev,
      [currentIndex]: optionIdx
    }));
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // Complete quiz
      setQuizFinished(true);
      setQuizActive(false);

      // Score calculation
      let score = 0;
      const scoredQuestions = questions.map((q, idx) => {
        const userAns = answers[idx];
        if (userAns === q.correctIndex) {
          score += 1;
        }
        return {
          ...q,
          userAnswer: userAns
        };
      });

      const isItexams = questions[0]?.id?.startsWith("it-");

      // Add to history
      const historyItem: QuizHistoryItem = {
        id: `quiz-${Date.now()}`,
        topicId: isItexams ? "ITEXAMS" : activeTopic.id,
        topicTitle: isItexams 
          ? `ITExams Real Practice Exam - ${selectedItexamsDomain === "all" ? "All Domains" : selectedItexamsDomain.split(":")[0]}`
          : activeTopic.title,
        difficulty: isItexams ? "medium" : difficulty,
        questionsCount: questions.length,
        score: score,
        questions: scoredQuestions,
        date: new Date().toLocaleDateString()
      };

      onAddQuizToHistory(historyItem);
    }
  };

  // Setup Retry Incorrect
  const retryQuiz = () => {
    // Collect incorrect ones
    const incorrectQuestions = questions.filter((q, idx) => answers[idx] !== q.correctIndex);
    if (incorrectQuestions.length === 0) return;

    // Reset with only incorrect ones
    const resetQuestions = incorrectQuestions.map((q, idx) => ({
      ...q,
      id: `retry-${idx}`,
      userAnswer: undefined
    }));

    setQuestions(resetQuestions);
    setAnswers({});
    setCurrentIndex(0);
    setQuizActive(true);
    setQuizFinished(false);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Quiz Mode Tab Selector */}
      {!quizActive && !quizFinished && (
        <div className="flex p-1 bg-slate-100 rounded-xl max-w-md mx-auto border border-gray-200 shadow-sm">
          <button
            onClick={() => setQuizMode('itexams')}
            className={`flex-1 text-center py-2.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              quizMode === 'itexams'
                ? 'bg-white text-blue-600 shadow-sm border border-gray-150'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <BookOpen size={14} />
            <span>ITExams Practice Test</span>
          </button>
          <button
            onClick={() => setQuizMode('ai')}
            className={`flex-1 text-center py-2.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              quizMode === 'ai'
                ? 'bg-white text-blue-600 shadow-sm border border-gray-150'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <Sparkles size={14} />
            <span>Gemini AI Quiz</span>
          </button>
        </div>
      )}

      {/* Intro Banner / Selector (only if not active & not finished) */}
      {!quizActive && !quizFinished && quizMode === 'itexams' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* ITExams Left Config Pane */}
          <div className="md:col-span-2 bg-white p-5 md:p-6 rounded-xl border border-gray-200 shadow-sm space-y-5">
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <BookOpen className="text-blue-600" size={18} />
                Official ITExams SY0-701 Prep
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Practice with real-style scenario questions covering the official CompTIA domains.
              </p>
            </div>

            {/* Form Fields */}
            <div className="space-y-4">
              {/* Domain Filter */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">CompTIA Domain Focus</label>
                <select
                  value={selectedItexamsDomain}
                  onChange={(e) => setSelectedItexamsDomain(e.target.value)}
                  className="w-full bg-white text-xs py-2.5 px-3 rounded-lg border border-gray-200 focus:outline-none focus:border-blue-500 font-bold text-slate-800"
                >
                  <option value="all">All Domains (15 authentic questions)</option>
                  <option value="Domain 1: General Security Concepts">Domain 1: General Security Concepts</option>
                  <option value="Domain 2: Threats, Vulnerabilities, and Mitigations">Domain 2: Threats, Vulnerabilities, and Mitigations</option>
                  <option value="Domain 3: Security Architecture">Domain 3: Security Architecture</option>
                  <option value="Domain 4: Security Operations">Domain 4: Security Operations</option>
                  <option value="Domain 5: Security Program Management and Oversight">Domain 5: Security Program Management and Oversight</option>
                </select>
              </div>

              {/* Count */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Number of Questions</label>
                <select
                  value={itexamsQuestionsCount}
                  onChange={(e) => setItexamsQuestionsCount(Number(e.target.value))}
                  className="w-full bg-white text-xs py-2.5 px-3 rounded-lg border border-gray-200 focus:outline-none focus:border-blue-500 text-slate-800 font-bold"
                >
                  <option value={5}>5 Questions</option>
                  <option value={10}>10 Questions</option>
                  <option value={15}>15 Questions (Full Set)</option>
                </select>
              </div>

              {errorMsg && (
                <div className="p-3 bg-red-50 text-red-600 rounded-lg text-xs border border-red-200 font-medium">
                  {errorMsg}
                </div>
              )}

              {/* Action Trigger */}
              <button
                onClick={startItexamsQuiz}
                disabled={isLoading}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs tracking-wider uppercase rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Award size={14} />
                <span>Start ITExams Practice Test</span>
              </button>
            </div>
          </div>

          {/* Quick tips pane */}
          <div className="bg-gray-50 p-5 rounded-xl border border-gray-200 flex flex-col justify-between">
            <div className="space-y-3">
              <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">ITExams Objectives</span>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                These questions represent official Prep exams compiled from standard CompTIA Security+ SY0-701 guidelines. Shuffled dynamically, they cover memory injections, Zero Trust, SASE, and quantitative risk calculations.
              </p>
            </div>
            <div className="pt-6 border-t border-gray-200 text-center">
              <span className="text-xs text-slate-400 font-semibold">Tracked in Performance History</span>
            </div>
          </div>
        </div>
      )}

      {!quizActive && !quizFinished && quizMode === 'ai' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Settings Left Pane */}
          <div className="md:col-span-2 bg-white p-5 md:p-6 rounded-xl border border-gray-200 shadow-sm space-y-5">
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <HelpCircle className="text-blue-600" size={18} />
                Build Custom Practice Quiz
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                AI will generate scenario-based questions aligning with Security+ exam standards.
              </p>
            </div>

            {/* Form Fields */}
            <div className="space-y-4">
              {/* Topic */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Select objective Topic</label>
                <select
                  value={selectedTopicId}
                  onChange={(e) => setSelectedTopicId(e.target.value)}
                  className="w-full bg-white text-xs py-2.5 px-3 rounded-lg border border-gray-200 focus:outline-none focus:border-blue-500 font-bold text-slate-800"
                >
                  {ALL_SYLLABUS_TOPICS.map((topic) => (
                    <option key={topic.id} value={topic.id}>
                      {topic.id} - {topic.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Count */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Questions Pool</label>
                  <select
                    value={questionsCount}
                    onChange={(e) => setQuestionsCount(Number(e.target.value))}
                    className="w-full bg-white text-xs py-2.5 px-3 rounded-lg border border-gray-200 focus:outline-none focus:border-blue-500 text-slate-800 font-bold"
                  >
                    <option value={10}>10 Questions</option>
                    <option value={20}>20 Questions</option>
                    <option value={50}>50 Questions</option>
                  </select>
                </div>

                {/* Difficulty */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Difficulty Level</label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value as any)}
                    className="w-full bg-white text-xs py-2.5 px-3 rounded-lg border border-gray-200 focus:outline-none focus:border-blue-500 text-slate-800 font-bold"
                  >
                    <option value="easy">Easy (Fundamentals)</option>
                    <option value="medium">Medium (Standard Exam)</option>
                    <option value="hard">Hard (Advanced Scenario)</option>
                  </select>
                </div>
              </div>

              {errorMsg && (
                <div className="p-3 bg-red-50 text-red-600 rounded-lg text-xs border border-red-200 font-medium">
                  {errorMsg}
                </div>
              )}

              {/* Action Trigger */}
              <button
                onClick={startQuiz}
                disabled={isLoading}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs tracking-wider uppercase rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-200"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="animate-spin" size={14} />
                    <span>Generating Scenario Questions...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={14} />
                    <span>Generate Quiz with Gemini</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Quick tips pane */}
          <div className="bg-gray-50 p-5 rounded-xl border border-gray-200 flex flex-col justify-between">
            <div className="space-y-3">
              <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Practice Directives</span>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Our AI model automatically prepares scenario items mapping directly to Security+ guidelines. Each query provides 4 logical solutions, complete with real-time feedback and structured explanations for cryptographic or access controls.
              </p>
            </div>
            <div className="pt-6 border-t border-gray-200 text-center">
              <span className="text-xs text-slate-400 font-semibold">Auto-saved to Progress Tracker</span>
            </div>
          </div>
        </div>
      )}

      {/* Generating/Loading Spinner */}
      {isLoading && (
        <div className="p-12 text-center space-y-4 max-w-lg mx-auto bg-white rounded-xl border border-gray-200 shadow-sm">
          <RefreshCw className="animate-spin mx-auto text-blue-600" size={36} />
          <h3 className="text-sm font-bold text-slate-950">Drafting Quiz Questions</h3>
          <p className="text-xs text-slate-500 font-medium">
            AI is analyzing CompTIA Security+ objectives to build original practice scenarios for "{activeTopic.title}". This takes about 5 seconds...
          </p>
        </div>
      )}

      {/* Interactive Active Quiz Component */}
      {quizActive && questions.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm max-w-3xl mx-auto">
          {/* Header Progress indicator */}
          <div className="px-5 py-3.5 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
            <div className="space-y-0.5 min-w-0 pr-4">
              <span className="text-[10px] text-slate-500 font-bold font-mono uppercase tracking-wider">QUESTION {currentIndex + 1} OF {questions.length}</span>
              <h3 className="text-xs font-bold text-blue-600 truncate">{activeTopic.title}</h3>
            </div>
            <div className="text-right shrink-0">
              <span className="text-[10px] bg-blue-50 border border-blue-100 text-blue-600 px-2.5 py-0.5 rounded-md uppercase font-bold tracking-wider">
                {difficulty}
              </span>
            </div>
          </div>

          {/* Progress gauge bar */}
          <div className="w-full bg-gray-100 h-1.5">
            <div
              className="bg-blue-600 h-full transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
            ></div>
          </div>

          {/* Main content question & choices */}
          <div className="p-5 md:p-6 space-y-6">
            <p className="text-sm md:text-base font-bold text-slate-800 leading-relaxed">
              {questions[currentIndex].question}
            </p>

            {/* Options grid */}
            <div className="space-y-2.5">
              {questions[currentIndex].options.map((option, idx) => {
                const userAns = answers[currentIndex];
                const isAnswered = userAns !== undefined;
                const isCorrect = idx === questions[currentIndex].correctIndex;
                const isSelected = idx === userAns;

                let optionStyles = "border-gray-200 bg-white text-slate-700 hover:border-blue-400 hover:bg-slate-50/50";
                
                if (isAnswered) {
                  if (isCorrect) {
                    optionStyles = "border-emerald-300 bg-emerald-50 text-emerald-800 font-bold";
                  } else if (isSelected) {
                    optionStyles = "border-red-300 bg-red-50 text-red-800 font-bold";
                  } else {
                    optionStyles = "border-gray-100 bg-gray-50/30 text-gray-400 cursor-not-allowed";
                  }
                }

                return (
                  <button
                    key={idx}
                    onClick={() => handleSelectOption(idx)}
                    disabled={isAnswered}
                    className={`w-full text-left p-3.5 text-xs md:text-sm rounded-lg border transition-all flex justify-between items-center ${optionStyles} ${!isAnswered ? "cursor-pointer" : ""}`}
                  >
                    <span>{option}</span>
                    {isAnswered && isCorrect && <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />}
                    {isAnswered && isSelected && !isCorrect && <XCircle size={16} className="text-red-600 shrink-0" />}
                  </button>
                );
              })}
            </div>

            {/* Detailed Explanation box appears instantly after selecting */}
            {answers[currentIndex] !== undefined && (
              <div className="p-4 bg-blue-50/30 rounded-lg border border-blue-100 space-y-1.5 animate-fadeIn">
                <div className="flex items-center gap-1.5 text-xs font-bold text-blue-600 uppercase tracking-wider">
                  <Eye size={12} />
                  <span>AI Explanation</span>
                </div>
                <p className="text-xs md:text-sm text-slate-700 leading-relaxed font-medium">
                  {questions[currentIndex].explanation}
                </p>
              </div>
            )}

            {/* Footer triggers */}
            {answers[currentIndex] !== undefined && (
              <div className="flex justify-end pt-2 border-t border-gray-150">
                <button
                  onClick={handleNext}
                  className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                >
                  <span>{currentIndex < questions.length - 1 ? "Next Question" : "Finish Quiz"}</span>
                  <ArrowRight size={13} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quiz Finished Summary Overview */}
      {quizFinished && questions.length > 0 && (
        <div className="bg-white p-6 md:p-8 rounded-xl border border-gray-200 space-y-6 max-w-2xl mx-auto text-center shadow-sm">
          <div className="w-16 h-16 mx-auto rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 text-2xl font-black">
            <Award size={28} />
          </div>

          <div className="space-y-1.5">
            <h2 className="text-xl font-extrabold text-slate-900">Quiz Completed!</h2>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wide">Objective: {activeTopic.title}</p>
          </div>

          {/* Scored Results badge */}
          {(() => {
            let correctCount = 0;
            questions.forEach((q, idx) => {
              if (answers[idx] === q.correctIndex) {
                correctCount += 1;
              }
            });
            const percent = Math.round((correctCount / questions.length) * 100);
            return (
              <div className="space-y-4">
                <div className="inline-block p-4 bg-slate-50 border border-gray-200 rounded-2xl">
                  <div className="text-3xl font-extrabold text-blue-600 font-mono">
                    {correctCount} / {questions.length}
                  </div>
                  <div className="text-xs text-slate-500 font-bold">({percent}% Accuracy)</div>
                </div>

                {/* Recommendations */}
                <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed font-semibold">
                  {percent >= 80
                    ? "Exceptional score! You exhibit strong mastery of this topic. Move on to your remaining syllabus sections."
                    : "A solid try! We suggest chatting with the AI Tutor to cover the points of explanation and retrying incorrect answers."}
                </p>

                {/* Finished Action choices */}
                <div className="flex flex-wrap gap-2.5 justify-center pt-3">
                  <button
                    onClick={() => {
                      setQuizFinished(false);
                      setQuizActive(false);
                      setQuestions([]);
                    }}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                  >
                    Build Another Quiz
                  </button>

                  {correctCount < questions.length && (
                    <button
                      onClick={retryQuiz}
                      className="px-4 py-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-600 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <RefreshCw size={12} />
                      <span>Retry Incorrect ({questions.length - correctCount})</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Historical logs list */}
      {!quizActive && quizHistory.length > 0 && (
        <div className="bg-white p-5 rounded-xl border border-gray-200 space-y-4 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 tracking-wide uppercase flex items-center gap-2">
            <ListOrdered size={14} className="text-blue-600" />
            Quiz Performance log
          </h3>
          <div className="divide-y divide-gray-100">
            {quizHistory.slice().reverse().map((item) => {
              const accuracy = Math.round((item.score / item.questionsCount) * 100);
              return (
                <div key={item.id} className="py-3 flex flex-col sm:flex-row justify-between sm:items-center gap-3 first:pt-0 last:pb-0">
                  <div className="space-y-0.5">
                    <h4 className="text-xs md:text-sm font-bold text-slate-800 flex items-center gap-2">
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 font-mono text-slate-600 font-bold border border-gray-150">
                        {item.topicId}
                      </span>
                      {item.topicTitle}
                    </h4>
                    <p className="text-[10px] text-gray-400 font-semibold font-mono">
                      Difficulty: <span className="text-blue-600 uppercase font-bold">{item.difficulty}</span> &bull; {item.date}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-xs font-bold text-slate-700 font-mono">{item.score}/{item.questionsCount} correct</div>
                      <div className={`text-[10px] font-bold ${accuracy >= 80 ? "text-emerald-600" : accuracy >= 50 ? "text-amber-600" : "text-red-500"}`}>{accuracy}%</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
