import React, { useState, useMemo } from 'react';
import {
  Download,
  Copy,
  Check,
  Search,
  Filter,
  ArrowUpDown,
  ThumbsUp,
  ExternalLink,
  MessageSquare,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Zap,
  Cpu,
  Youtube,
  Twitter,
  ShoppingBag,
  Video,
  FileSpreadsheet
} from 'lucide-react';
import { BatchAnalysisReport, ScrapedComment, SentimentLabel } from '../types/sentiment';
import { AudienceDonutChart } from './AudienceDonutChart';
import { ProbabilityBar } from './ProbabilityBar';

interface AudienceAnalyticsViewProps {
  report: BatchAnalysisReport;
  onNewScrapeRequest: () => void;
}

export const AudienceAnalyticsView: React.FC<AudienceAnalyticsViewProps> = ({
  report,
  onNewScrapeRequest,
}) => {
  const [filterSentiment, setFilterSentiment] = useState<'all' | 'positive' | 'neutral' | 'negative' | 'divergence'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'likes' | 'confidence' | 'disputed'>('likes');
  const [expandedCommentId, setExpandedCommentId] = useState<string | null>(null);
  const [copiedSummary, setCopiedSummary] = useState(false);

  // Filter and sort comments
  const filteredComments = useMemo(() => {
    let result = [...report.comments];

    // Filter by sentiment
    if (filterSentiment === 'positive') {
      result = result.filter((c) => c.roberta.label === 'positive');
    } else if (filterSentiment === 'neutral') {
      result = result.filter((c) => c.roberta.label === 'neutral');
    } else if (filterSentiment === 'negative') {
      result = result.filter((c) => c.roberta.label === 'negative');
    } else if (filterSentiment === 'divergence') {
      result = result.filter((c) => c.consensus === 'divergence');
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.text.toLowerCase().includes(q) ||
          c.author.toLowerCase().includes(q) ||
          c.handle.toLowerCase().includes(q)
      );
    }

    // Sort
    if (sortBy === 'likes') {
      result.sort((a, b) => b.likes - a.likes);
    } else if (sortBy === 'confidence') {
      result.sort((a, b) => b.roberta.confidence - a.roberta.confidence);
    } else if (sortBy === 'disputed') {
      result.sort((a, b) => {
        const aDisputed = a.consensus === 'divergence' ? 1 : 0;
        const bDisputed = b.consensus === 'divergence' ? 1 : 0;
        return bDisputed - aDisputed;
      });
    }

    return result;
  }, [report.comments, filterSentiment, searchQuery, sortBy]);

  // Export handlers
  const handleExportCSV = () => {
    const headers = ['ID', 'Author', 'Handle', 'Platform', 'Likes', 'Comment', 'VADER_Label', 'VADER_Compound', 'RoBERTa_Label', 'RoBERTa_Confidence', 'Consensus'];
    const rows = report.comments.map((c) => [
      c.id,
      `"${c.author.replace(/"/g, '""')}"`,
      c.handle,
      c.platform,
      c.likes,
      `"${c.text.replace(/"/g, '""')}"`,
      c.vader.label,
      c.vader.compound,
      c.roberta.label,
      c.roberta.confidence,
      c.consensus,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `analyx_sentiment_report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(report, null, 2));
    const link = document.createElement('a');
    link.setAttribute('href', dataStr);
    link.setAttribute('download', `analyx_sentiment_report_${Date.now()}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopySummary = () => {
    const summary = `Analyx Sentiment Intelligence Report
Target: ${report.sourceTitle}
Platform: ${report.platform.toUpperCase()}
Total Comments Evaluated: ${report.totalCount}
Audience Sentiment Breakdown:
- Positive: ${report.positivePct}%
- Neutral: ${report.neutralPct}%
- Negative: ${report.negativePct}%
Net Sentiment Score (NSS): ${report.netSentimentScore > 0 ? '+' : ''}${report.netSentimentScore}
Average Model Confidence: ${report.avgConfidence}%
Dual-Model Nuance Divergence Rate: ${report.divergenceRatePct}%`;

    navigator.clipboard.writeText(summary);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Source Header Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {report.platform === 'youtube' && <Youtube className="w-4 h-4 text-red-600" />}
              {report.platform === 'x' && <Twitter className="w-4 h-4 text-slate-900" />}
              {report.platform === 'amazon' && <ShoppingBag className="w-4 h-4 text-amber-600" />}
              {report.platform === 'tiktok' && <Video className="w-4 h-4 text-rose-500" />}
              {report.platform === 'custom' && <FileSpreadsheet className="w-4 h-4 text-emerald-600" />}
              <span>{report.platform} Audience Feed</span>
              {report.sourceUrl && (
                <>
                  <span aria-hidden="true">·</span>
                  <a
                    href={report.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-slate-400 hover:text-slate-700 flex items-center gap-1 font-mono text-[11px] normal-case"
                  >
                    View Source <ExternalLink className="w-3 h-3" />
                  </a>
                </>
              )}
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              {report.sourceTitle}
            </h1>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleCopySummary}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1.5"
            >
              {copiedSummary ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedSummary ? 'Copied!' : 'Copy Summary'}</span>
            </button>
            <button
              onClick={handleExportCSV}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={onNewScrapeRequest}
              className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-xs"
            >
              Analyze New Thread
            </button>
          </div>
        </div>

        {/* 4 High-Level Metric Tiles */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-6">
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-100">
            <span className="text-xs font-medium text-slate-500 block">Total Comments</span>
            <span className="text-2xl font-bold font-mono tabular-nums text-slate-900 mt-1 block">
              {report.totalCount}
            </span>
            <span className="text-[11px] text-slate-400 mt-0.5 block">Dual-model evaluated</span>
          </div>

          <div className="p-4 rounded-lg bg-slate-50 border border-slate-100">
            <span className="text-xs font-medium text-slate-500 block">Net Sentiment Score (NSS)</span>
            <span
              className={`text-2xl font-bold font-mono tabular-nums mt-1 block ${
                report.netSentimentScore > 0
                  ? 'text-emerald-700'
                  : report.netSentimentScore < 0
                  ? 'text-rose-700'
                  : 'text-slate-800'
              }`}
            >
              {report.netSentimentScore > 0 ? `+${report.netSentimentScore}` : report.netSentimentScore}
            </span>
            <span className="text-[11px] text-slate-400 mt-0.5 block">%Pos minus %Neg</span>
          </div>

          <div className="p-4 rounded-lg bg-slate-50 border border-slate-100">
            <span className="text-xs font-medium text-slate-500 block">Average Confidence</span>
            <span className="text-2xl font-bold font-mono tabular-nums text-slate-900 mt-1 block">
              {report.avgConfidence}%
            </span>
            <span className="text-[11px] text-slate-400 mt-0.5 block">Transformer certainty</span>
          </div>

          <div className="p-4 rounded-lg bg-slate-50 border border-slate-100">
            <span className="text-xs font-medium text-slate-500 block">Nuance Divergence Rate</span>
            <span className="text-2xl font-bold font-mono tabular-nums text-amber-700 mt-1 block">
              {report.divergenceRatePct}%
            </span>
            <span className="text-[11px] text-slate-400 mt-0.5 block">Sarcasm / context shifts</span>
          </div>
        </div>
      </div>

      {/* Main Analytics Grid: Donut Chart + Aspect Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive Audience Donut Chart */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Audience Sentiment Distribution
              </h2>
              <p className="text-xs text-slate-500">
                Explicit proportions based on context-aware RoBERTa neural predictions
              </p>
            </div>
            <div className="text-xs font-mono text-slate-400">
              Sum: 100%
            </div>
          </div>

          {/* Interactive Donut Component */}
          <AudienceDonutChart
            positivePct={report.positivePct}
            neutralPct={report.neutralPct}
            negativePct={report.negativePct}
            totalCount={report.totalCount}
            netSentimentScore={report.netSentimentScore}
            size={220}
          />
        </div>

        {/* Right Column: Aspect / Key Topic Matrix */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Topic & Aspect Polarity
                </h2>
                <p className="text-xs text-slate-500">
                  Sentiment breakdown categorized by product/topic dimensions
                </p>
              </div>
            </div>

            {/* Aspect list */}
            <div className="space-y-3.5">
              {report.aspects.map((asp, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800">{asp.name}</span>
                    <div className="flex items-center gap-2 font-mono text-[11px]">
                      <span className="text-slate-400">{asp.mentionCount} mentions</span>
                      <span
                        className={`font-semibold tabular-nums ${
                          asp.netScore > 0 ? 'text-emerald-700' : asp.netScore < 0 ? 'text-rose-700' : 'text-slate-500'
                        }`}
                      >
                        {asp.netScore > 0 ? `+${asp.netScore}` : asp.netScore}
                      </span>
                    </div>
                  </div>
                  {/* Aspect mini-stacked bar */}
                  <div className="w-full flex h-2 rounded-full overflow-hidden bg-slate-100">
                    {asp.positivePct > 0 && (
                      <div style={{ width: `${asp.positivePct}%` }} className="bg-emerald-600" />
                    )}
                    {asp.neutralPct > 0 && (
                      <div style={{ width: `${asp.neutralPct}%` }} className="bg-slate-400" />
                    )}
                    {asp.negativePct > 0 && (
                      <div style={{ width: `${asp.negativePct}%` }} className="bg-rose-600" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Color guide: Green = Positive, Slate = Neutral, Red = Negative</span>
          </div>
        </div>
      </div>

      {/* Granular Scrollable Comment Feed */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        {/* Feed Header & Filters */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Granular Audience Comment Feed
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Showing {filteredComments.length} of {report.totalCount} individual reactions with side-by-side model outputs
            </p>
          </div>

          {/* Interactive filter controls (functional buttons with click handlers) */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
              <button
                onClick={() => setFilterSentiment('all')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap ${
                  filterSentiment === 'all'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All ({report.totalCount})
              </button>
              <button
                onClick={() => setFilterSentiment('positive')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap ${
                  filterSentiment === 'positive'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-emerald-700'
                }`}
              >
                Positive
              </button>
              <button
                onClick={() => setFilterSentiment('neutral')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap ${
                  filterSentiment === 'neutral'
                    ? 'bg-slate-700 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Neutral
              </button>
              <button
                onClick={() => setFilterSentiment('negative')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap ${
                  filterSentiment === 'negative'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-rose-700'
                }`}
              >
                Negative
              </button>
              <button
                onClick={() => setFilterSentiment('divergence')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap ${
                  filterSentiment === 'divergence'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-amber-800 hover:text-amber-900'
                }`}
              >
                Disagreements
              </button>
            </div>
          </div>
        </div>

        {/* Search & Sort Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-4 border-b border-slate-100">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search comments by keyword or author..."
              className="w-full pl-9 pr-3 py-1.5 text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-600">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-500">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-md px-2 py-1 text-xs font-medium text-slate-800 focus:outline-none"
            >
              <option value="likes">Highest Likes / Upvotes</option>
              <option value="confidence">Highest Confidence</option>
              <option value="disputed">Model Divergences First</option>
            </select>
          </div>
        </div>

        {/* Comment Cards List */}
        <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto pr-1">
          {filteredComments.length > 0 ? (
            filteredComments.map((comment) => {
              const isExpanded = expandedCommentId === comment.id;
              const hasDivergence = comment.consensus === 'divergence';

              return (
                <div
                  key={comment.id}
                  className={`py-4 transition-colors ${
                    hasDivergence ? 'bg-amber-50/20 px-3 rounded-lg my-1' : ''
                  }`}
                >
                  {/* Top Metadata Row: Zero-Pill unboxed text */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={comment.avatarUrl}
                        alt={comment.author}
                        referrerPolicy="no-referrer"
                        className="w-7 h-7 rounded-full object-cover border border-slate-200"
                      />
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span className="font-semibold text-slate-900">{comment.author}</span>
                        <span className="font-mono text-slate-400">{comment.handle}</span>
                        <span aria-hidden="true">·</span>
                        <span>{comment.timestamp}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1 font-mono text-[11px] text-slate-600">
                        <ThumbsUp className="w-3 h-3 text-slate-400" />
                        {comment.likes}
                      </span>
                    </div>
                  </div>

                  {/* Comment Text */}
                  <p className="text-sm text-slate-800 leading-relaxed font-sans mb-3">
                    {comment.text}
                  </p>

                  {/* Dual Model Prediction Badges & Inspector Trigger */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                    <div className="flex flex-wrap items-center gap-3">
                      {/* VADER Label */}
                      <div className="flex items-center gap-1.5 text-xs">
                        <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
                          <Zap className="w-3 h-3 text-amber-500" /> VADER:
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider ${
                            comment.vader.label === 'positive'
                              ? 'bg-emerald-100 text-emerald-800'
                              : comment.vader.label === 'negative'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {comment.vader.label}
                        </span>
                        <span className="font-mono text-[11px] text-slate-400">
                          ({comment.vader.compound > 0 ? `+${comment.vader.compound}` : comment.vader.compound})
                        </span>
                      </div>

                      {/* RoBERTa Label */}
                      <div className="flex items-center gap-1.5 text-xs">
                        <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
                          <Cpu className="w-3 h-3 text-blue-500" /> RoBERTa:
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider ${
                            comment.roberta.label === 'positive'
                              ? 'bg-emerald-100 text-emerald-800'
                              : comment.roberta.label === 'negative'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {comment.roberta.label}
                        </span>
                        <span className="font-mono text-[11px] text-slate-400">
                          ({Math.round(comment.roberta.confidence * 100)}%)
                        </span>
                      </div>

                      {/* Consensus Indicator */}
                      {hasDivergence && (
                        <span className="text-[11px] font-medium text-amber-800 bg-amber-100 px-2 py-0.5 rounded flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-amber-600" />
                          Divergence: {comment.roberta.detectedNuance || 'Context shift'}
                        </span>
                      )}
                    </div>

                    {/* Expand details toggle */}
                    <button
                      onClick={() => setExpandedCommentId(isExpanded ? null : comment.id)}
                      className="text-xs text-slate-500 hover:text-slate-800 font-medium flex items-center gap-1 transition-colors"
                    >
                      <span>{isExpanded ? 'Hide Details' : 'Deep Inspection'}</span>
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  {/* Expanded Token & Attention Weights Drawer */}
                  {isExpanded && (
                    <div className="mt-3 p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-3">
                      <div>
                        <span className="font-semibold text-slate-700 block mb-1">
                          Twitter-RoBERTa Contextual Attention:
                        </span>
                        <p className="text-slate-600 text-[11px] leading-relaxed">
                          {comment.roberta.reasoning}
                        </p>
                      </div>

                      <div>
                        <span className="font-semibold text-slate-700 block mb-1.5">
                          Softmax Probability Distribution:
                        </span>
                        <ProbabilityBar
                          positive={comment.roberta.pos}
                          neutral={comment.roberta.neu}
                          negative={comment.roberta.neg}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="py-12 text-center text-slate-400 text-xs">
              No comments match the selected sentiment filter or search criteria.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
