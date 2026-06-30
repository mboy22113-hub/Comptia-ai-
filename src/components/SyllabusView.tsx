import React, { useState } from "react";
import { BookOpen, CheckSquare, Square, ChevronDown, ChevronUp, Video, Play, ExternalLink, Search, Sparkles } from "lucide-react";
import { SyllabusTopic, StudyStats } from "../types";
import { SYLLABUS_DOMAINS } from "../data/syllabus";

interface SyllabusViewProps {
  stats: StudyStats;
  onToggleTopic: (topicId: string) => void;
  onSaveYoutubeUrl: (topicId: string, url: string) => void;
  onNavigateToTutor: (topicId: string) => void;
  onNavigateToQuiz: (topicId: string) => void;
  selectedTopicId?: string; // Optional topic to auto-expand
}

export function SyllabusView({
  stats,
  onToggleTopic,
  onSaveYoutubeUrl,
  onNavigateToTutor,
  onNavigateToQuiz,
  selectedTopicId
}: SyllabusViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  // Track expanded topics. If a selectedTopicId is passed, default expand it.
  const [expandedTopics, setExpandedTopics] = useState<Record<string, boolean>>(() => {
    if (selectedTopicId) {
      return { [selectedTopicId]: true };
    }
    return {};
  });
  const [editingUrls, setEditingUrls] = useState<Record<string, string>>({});

  // Calculations
  const completedTopicsSet = new Set(stats.completedTopics);
  const totalTopics = SYLLABUS_DOMAINS.reduce((sum, d) => sum + d.topics.length, 0);
  const overallCompleted = stats.completedTopics.length;
  const overallProgressPercent = totalTopics > 0 ? Math.round((overallCompleted / totalTopics) * 100) : 0;

  const toggleExpand = (topicId: string) => {
    setExpandedTopics((prev) => ({
      ...prev,
      [topicId]: !prev[topicId]
    }));
  };

  const handleYoutubeUrlChange = (topicId: string, val: string) => {
    setEditingUrls((prev) => ({
      ...prev,
      [topicId]: val
    }));
  };

  const handleSaveUrl = (topicId: string) => {
    const url = editingUrls[topicId]?.trim() || "";
    onSaveYoutubeUrl(topicId, url);
  };

  // Safe helper to extract YouTube Video ID for iframe preview
  const getYoutubeEmbedId = (url?: string) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header and Progress Bars */}
      <div className="bg-white p-5 rounded-xl border border-gray-200 space-y-4 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <BookOpen className="text-blue-600" size={18} />
              CompTIA Security+ (SY0-701) Syllabus objectives
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Check off completed topics, paste video lectures, and launch smart AI study aids.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative text-xs">
              <input
                type="text"
                placeholder="Search objectives..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-white border border-gray-200 rounded-lg py-1.5 pl-8 pr-4 text-slate-700 w-56 focus:outline-none focus:border-blue-500 font-medium text-xs placeholder:text-gray-400"
              />
              <Search size={14} className="absolute left-2.5 top-2.5 text-gray-400" />
            </div>
          </div>
        </div>

        {/* Course Completion Progress Bar */}
        <div className="p-4 bg-slate-50 rounded-lg border border-gray-200 space-y-2">
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-slate-700">Overall Course Progress</span>
            <span className="text-blue-600 font-mono">
              {overallCompleted} / {totalTopics} Objectives ({overallProgressPercent}%)
            </span>
          </div>
          <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
            <div
              className="bg-blue-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${overallProgressPercent}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Domain Lists */}
      <div className="space-y-6">
        {SYLLABUS_DOMAINS.map((domain) => {
          // Filter topics by search term
          const filteredTopics = domain.topics.filter(
            (t) =>
              t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
              t.id.includes(searchTerm) ||
              t.description.toLowerCase().includes(searchTerm.toLowerCase())
          );

          if (filteredTopics.length === 0) return null;

          // Domain progress calculation
          const totalInDomain = domain.topics.length;
          const completedInDomain = domain.topics.filter((t) => completedTopicsSet.has(t.id)).length;
          const domainPercent = totalInDomain > 0 ? Math.round((completedInDomain / totalInDomain) * 100) : 0;

          return (
            <div key={domain.name} className="space-y-3">
              {/* Domain Header Card */}
              <div className="bg-slate-50 px-4 py-3 rounded-xl border border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <span className="text-blue-600 font-mono font-bold text-xs bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                      {domain.weight}
                    </span>
                    {domain.name}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium max-w-3xl line-clamp-1">{domain.description}</p>
                </div>
                {/* Mini Progress bar */}
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right text-xs">
                    <span className="text-slate-500 font-bold">Progress: </span>
                    <span className="text-slate-800 font-mono font-bold">{domainPercent}%</span>
                  </div>
                  <div className="w-24 bg-gray-200 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-blue-600 h-full rounded-full transition-all duration-300"
                      style={{ width: `${domainPercent}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Topics Stack */}
              <div className="space-y-2 pl-1 md:pl-2">
                {filteredTopics.map((topic) => {
                  const isCompleted = completedTopicsSet.has(topic.id);
                  const isExpanded = !!expandedTopics[topic.id] || selectedTopicId === topic.id;
                  const savedUrl = stats.youtubeUrls[topic.id] || "";
                  const currentUrlVal = editingUrls[topic.id] !== undefined ? editingUrls[topic.id] : savedUrl;
                  const embedId = getYoutubeEmbedId(savedUrl);

                  return (
                    <div
                      key={topic.id}
                      className={`bg-white rounded-xl border transition-all overflow-hidden ${
                        isCompleted
                          ? "border-blue-200 bg-blue-50/5"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      {/* Topic Bar Header */}
                      <div className="p-3.5 flex items-center justify-between gap-3 select-none">
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Checkbox */}
                          <button
                            onClick={() => onToggleTopic(topic.id)}
                            className="text-gray-400 hover:text-blue-600 transition-colors shrink-0 cursor-pointer"
                            title={isCompleted ? "Mark Incomplete" : "Mark Completed"}
                          >
                            {isCompleted ? (
                              <CheckSquare size={19} className="text-blue-600 fill-blue-50" />
                            ) : (
                              <Square size={19} className="text-gray-300 hover:text-gray-400" />
                            )}
                          </button>

                          {/* ID & Title */}
                          <div
                            onClick={() => toggleExpand(topic.id)}
                            className="cursor-pointer min-w-0 flex items-center gap-2"
                          >
                            <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-mono text-[10px] font-bold shrink-0">
                              {topic.id}
                            </span>
                            <h4
                              className={`text-xs md:text-sm font-bold truncate ${
                                isCompleted ? "text-gray-400 line-through" : "text-slate-800"
                              }`}
                            >
                              {topic.title}
                            </h4>
                          </div>
                        </div>

                        {/* Timing and Toggle action */}
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-[10px] bg-slate-50 border border-gray-200 px-1.5 py-0.5 rounded text-gray-500 font-bold font-mono hidden sm:inline">
                            Est: {topic.estimatedTime}
                          </span>
                          <button
                            onClick={() => toggleExpand(topic.id)}
                            className="text-gray-400 hover:text-slate-700 p-1 rounded hover:bg-gray-100 transition-colors cursor-pointer"
                          >
                            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </button>
                        </div>
                      </div>

                      {/* Topic Expanded Details */}
                      {isExpanded && (
                        <div className="px-4 pb-4 pt-1 border-t border-gray-150 bg-slate-50/40 space-y-4">
                          <div className="space-y-1">
                            <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Concept Summary</h5>
                            <p className="text-xs md:text-sm text-slate-700 leading-relaxed bg-white p-3 rounded-lg border border-gray-200">
                              {topic.description}
                            </p>
                          </div>

                          {/* Video Link paste field */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2 bg-white p-3 rounded-lg border border-gray-200">
                              <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                                <Video size={13} className="text-blue-600" />
                                Study Video Link (YouTube)
                              </h5>
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  placeholder="Paste YouTube link here..."
                                  value={currentUrlVal}
                                  onChange={(e) => handleYoutubeUrlChange(topic.id, e.target.value)}
                                  className="bg-white border border-gray-200 rounded-lg py-1 px-2.5 text-xs text-slate-700 w-full focus:outline-none focus:border-blue-500 font-mono"
                                />
                                <button
                                  onClick={() => handleSaveUrl(topic.id)}
                                  className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                                >
                                  Save
                                </button>
                              </div>

                              {savedUrl ? (
                                <div className="flex items-center gap-3 pt-1">
                                  <a
                                    href={savedUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-bold hover:underline"
                                  >
                                    <ExternalLink size={12} />
                                    <span>Open External Player</span>
                                  </a>
                                </div>
                              ) : (
                                <p className="text-[10px] text-gray-400 italic">No study video link saved yet. Add one above.</p>
                              )}
                            </div>

                            {/* Launch AI buttons */}
                            <div className="space-y-2 bg-white p-3 rounded-lg border border-gray-200 flex flex-col justify-between">
                              <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                                <Sparkles size={13} className="text-blue-600" />
                                AI Study Aids
                              </h5>
                              <div className="grid grid-cols-2 gap-2 pt-1">
                                <button
                                  onClick={() => onNavigateToTutor(topic.id)}
                                  className="flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 text-xs font-semibold rounded-lg border border-blue-200 transition-colors cursor-pointer"
                                >
                                  <span>Tutor Concept</span>
                                </button>
                                <button
                                  onClick={() => onNavigateToQuiz(topic.id)}
                                  className="flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                                >
                                  <span>Generate Quiz</span>
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* YouTube embedded iframe player */}
                          {embedId && (
                            <div className="pt-2">
                              <div className="relative aspect-video w-full max-w-lg mx-auto rounded-lg overflow-hidden border border-gray-200 bg-black shadow-inner">
                                <iframe
                                  src={`https://www.youtube.com/embed/${embedId}`}
                                  title={`Study Video for ${topic.title}`}
                                  frameBorder="0"
                                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                  allowFullScreen
                                  className="absolute inset-0 w-full h-full"
                                ></iframe>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
