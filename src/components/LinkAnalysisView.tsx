import React, { useState } from 'react';
import {
  Link2,
  Search,
  Download,
  Loader2,
  ExternalLink,
  ThumbsUp,
  Youtube,
  Twitter,
  ShoppingBag,
  Video,
  Smile,
  Frown,
  Meh,
  Flame,
  Globe2
} from 'lucide-react';
import { BatchAnalysisReport, SupportedModelId } from '../types/sentiment';
import { AudienceDonutChart } from './AudienceDonutChart';

interface LinkAnalysisViewProps {
  selectedModel?: SupportedModelId;
  onSelectModel?: (model: SupportedModelId) => void;
}

export const LinkAnalysisView: React.FC<LinkAnalysisViewProps> = ({
  selectedModel = 'gemini-3.1-flash-lite',
}) => {
  const [urlInput, setUrlInput] = useState('');
  const [report, setReport] = useState<BatchAnalysisReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Feed filters
  const [filterSentiment, setFilterSentiment] = useState<'all' | 'positive' | 'neutral' | 'negative' | 'divergence'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const handleScrape = async (url = urlInput) => {
    const trimmed = url.trim();
    if (!trimmed) {
      setErrorMsg('Please enter or paste a valid link.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const response = await fetch('/api/sentiment/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: trimmed, model: selectedModel }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => null);
        throw new Error(errData?.error || `Server error (${response.status})`);
      }

      const data: BatchAnalysisReport = await response.json();
      setReport(data);
    } catch (err: any) {
      console.error('Scrape error:', err);
      setErrorMsg(err.message || 'Could not analyze this link. Please check the URL and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (!report) return;
    const headers = ['Author', 'Handle', 'Likes', 'Comment', 'Sentiment', 'Confidence'];
    const rows = report.comments.map((c) => [
      `"${c.author.replace(/"/g, '""')}"`,
      c.handle,
      c.likes,
      `"${c.text.replace(/"/g, '""')}"`,
      c.roberta.label,
      c.roberta.confidence,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `analyx_audience_vibe_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredComments = (report?.comments || []).filter((c) => {
    if (filterSentiment === 'positive' && c.roberta.label !== 'positive') return false;
    if (filterSentiment === 'neutral' && c.roberta.label !== 'neutral') return false;
    if (filterSentiment === 'negative' && c.roberta.label !== 'negative') return false;
    if (filterSentiment === 'divergence' && c.consensus !== 'divergence') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        c.text.toLowerCase().includes(q) ||
        c.author.toLowerCase().includes(q) ||
        c.handle.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Friendly Link Input Box */}
      <div className="bg-[#14151b] rounded-3xl border border-white/10 p-6 shadow-2xl backdrop-blur-md space-y-4">
        <div>
          <h2 className="text-base font-semibold text-white tracking-tight flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
            Paste any public link to check audience mood
          </h2>
          <p className="text-xs text-[#9b978f] mt-0.5">
            Works with YouTube videos, X/Twitter threads, TikTok, or Amazon products.
          </p>
        </div>

        {/* Input Bar */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#6e6b65]">
                <Link2 className="w-4 h-4" />
              </div>
              <input
                type="url"
                value={urlInput}
                onChange={(e) => {
                  setUrlInput(e.target.value);
                  if (errorMsg) setErrorMsg(null);
                }}
                placeholder="https://www.youtube.com/watch?v=... or https://x.com/..."
                className="w-full pl-10 pr-4 py-3 text-xs text-[#f5f3ef] placeholder-[#5a5852] bg-[#1a1b22] border border-white/10 rounded-2xl focus:bg-[#1e2028] focus:outline-none focus:ring-1 focus:ring-amber-400/50 transition-all font-mono"
              />
            </div>

            <button
              onClick={() => handleScrape()}
              disabled={isLoading || !urlInput.trim()}
              className="px-7 py-2.5 text-xs font-semibold text-[#121316] bg-[#f5f3ef] hover:bg-white disabled:opacity-30 rounded-full transition-all shadow-md flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer shrink-0"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600" />
                  <span>Scanning reactions...</span>
                </>
              ) : (
                <>
                  <Search className="w-3.5 h-3.5 text-amber-600" />
                  <span>Check Audience Vibe &rarr;</span>
                </>
              )}
            </button>
          </div>

          {errorMsg && (
            <p className="text-xs text-rose-400 font-medium pt-0.5">{errorMsg}</p>
          )}
        </div>
      </div>

      {/* Awaiting Input Empty State */}
      {!report && !isLoading && (
        <div className="bg-[#14151b]/80 rounded-3xl border border-dashed border-white/10 p-12 text-center text-[#9b978f]">
          <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 text-amber-300 flex items-center justify-center mx-auto mb-3 shadow-inner">
            <Globe2 className="w-5 h-5 text-amber-300" />
          </div>
          <h3 className="text-sm font-semibold text-white">
            Ready to explore reactions
          </h3>
          <p className="text-xs text-[#9b978f] max-w-sm mx-auto mt-1 leading-relaxed">
            Drop in any link to discover what people love, what they complain about, and the overall consensus.
          </p>
        </div>
      )}

      {/* Results View */}
      {report && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-[#14151b] rounded-3xl border border-white/10 p-6 shadow-2xl space-y-6">
            {/* Header info */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/5">
              <div>
                <div className="flex items-center gap-2 text-xs text-[#9b978f] mb-1">
                  {report.platform === 'youtube' && <Youtube className="w-3.5 h-3.5 text-red-500" />}
                  {report.platform === 'x' && <Twitter className="w-3.5 h-3.5 text-white" />}
                  {report.platform === 'amazon' && <ShoppingBag className="w-3.5 h-3.5 text-amber-400" />}
                  {report.platform === 'tiktok' && <Video className="w-3.5 h-3.5 text-rose-400" />}
                  <span className="capitalize">{report.platform}</span>
                  {report.sourceUrl && (
                    <>
                      <span>&middot;</span>
                      <a
                        href={report.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-amber-300 hover:underline flex items-center gap-1 font-mono text-[11px]"
                      >
                        Visit Link <ExternalLink className="w-3 h-3" />
                      </a>
                    </>
                  )}
                </div>
                <h3 className="text-lg font-bold text-white tracking-tight">
                  {report.sourceTitle}
                </h3>
              </div>

              <button
                onClick={handleExportCSV}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-white/10 hover:bg-white/15 border border-white/10 rounded-full transition-colors flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>
            </div>

            {/* Simple Mood Highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-[#181921] rounded-2xl border border-white/10 p-4">
                <span className="text-xs text-[#9b978f] block mb-1">Overall Mood</span>
                <span className="text-lg font-bold text-white flex items-center gap-1.5">
                  {report.positivePct >= 60 ? (
                    <>
                      <span>🔥 Positive</span>
                      <span className="text-emerald-400 text-sm font-mono">({report.positivePct}%)</span>
                    </>
                  ) : report.negativePct >= 40 ? (
                    <>
                      <span>⚠️ Critical</span>
                      <span className="text-rose-400 text-sm font-mono">({report.negativePct}%)</span>
                    </>
                  ) : (
                    <>
                      <span>⚖️ Balanced</span>
                      <span className="text-slate-300 text-sm font-mono">({report.neutralPct}%)</span>
                    </>
                  )}
                </span>
              </div>

              <div className="bg-[#181921] rounded-2xl border border-white/10 p-4">
                <span className="text-xs text-[#9b978f] block mb-1">Comments Evaluated</span>
                <span className="text-lg font-bold font-mono text-white">
                  {report.totalCount} reactions
                </span>
              </div>

              <div className="bg-[#181921] rounded-2xl border border-white/10 p-4">
                <span className="text-xs text-[#9b978f] block mb-1">AI Conviction</span>
                <span className="text-lg font-bold font-mono text-emerald-400">
                  {report.avgConfidence}% confident
                </span>
              </div>
            </div>

            {/* Donut Chart Visual */}
            <div className="bg-[#181921] rounded-2xl border border-white/10 p-6">
              <div className="text-center mb-4">
                <h4 className="text-sm font-semibold text-white">
                  Audience Sentiment Breakdown
                </h4>
              </div>

              <AudienceDonutChart
                positivePct={report.positivePct}
                neutralPct={report.neutralPct}
                negativePct={report.negativePct}
                totalCount={report.totalCount}
                netSentimentScore={report.netSentimentScore}
              />
            </div>

            {/* Comment Feed */}
            <div className="space-y-4 pt-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h4 className="text-sm font-semibold text-white">
                  Reactions ({filteredComments.length})
                </h4>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1 p-1 bg-[#181921] border border-white/10 rounded-full text-xs">
                    {(['all', 'positive', 'neutral', 'negative'] as const).map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setFilterSentiment(tab)}
                        className={`px-3 py-1 rounded-full capitalize font-medium transition-colors cursor-pointer ${
                          filterSentiment === tab
                            ? 'bg-white text-[#121316] font-semibold shadow-xs'
                            : 'text-[#9b978f] hover:text-white'
                        }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>

                  <div className="relative">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Filter..."
                      className="px-3 py-1.5 pl-7 text-xs text-white placeholder-[#575550] bg-[#181921] border border-white/10 rounded-full focus:outline-none focus:border-white/30"
                    />
                    <Search className="w-3 h-3 text-[#6e6b65] absolute left-2.5 top-2.5 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Comments List */}
              <div className="space-y-2.5">
                {filteredComments.map((comment) => (
                  <div
                    key={comment.id}
                    className="p-4 bg-[#181921] rounded-2xl border border-white/10 hover:border-white/20 transition-all space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <img
                          src={comment.avatarUrl}
                          alt={comment.author}
                          className="w-6 h-6 rounded-full shrink-0"
                        />
                        <span className="text-xs font-semibold text-white">
                          {comment.author}
                        </span>
                      </div>

                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold capitalize ${
                          comment.roberta.label === 'positive'
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : comment.roberta.label === 'negative'
                            ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                            : 'bg-white/10 text-[#dedad3]'
                        }`}
                      >
                        {comment.roberta.label}
                      </span>
                    </div>

                    <p className="text-xs text-[#dedad3] leading-relaxed">
                      "{comment.text}"
                    </p>

                    <div className="flex items-center justify-between pt-1 text-[11px] text-[#6e6b65]">
                      <span className="flex items-center gap-1 font-mono">
                        <ThumbsUp className="w-3 h-3 text-[#9b978f]" /> {comment.likes}
                      </span>
                      <span>{comment.timestamp}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
