import React, { useState } from 'react';
import {
  Sparkles,
  Zap,
  Cpu,
  Clock,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Smile,
  Meh,
  Frown,
  Flame,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { DualModelComparison, SupportedModelId } from '../types/sentiment';
import { evaluateVaderSentiment } from '../lib/vaderLexicon';
import { ConfidenceGauge } from './ConfidenceGauge';
import { ProbabilityBar } from './ProbabilityBar';

interface SingleEvaluationViewProps {
  selectedModel?: SupportedModelId;
  onSelectModel?: (model: SupportedModelId) => void;
}

const FUN_EXAMPLES = [
  { label: 'Positive', text: 'The customer service was surprisingly responsive and resolved my issue within minutes! 🚀' },
  { label: 'Sarcasm Test', text: 'Oh wonderful, another software update that moved all my buttons around. Truly genius. 🙄' },
  { label: 'Mixed', text: 'The camera quality is stellar, but the battery life is pretty mediocre.' },
  { label: 'Negative', text: 'Terrible build quality, broke on the very first day. Would not recommend.' },
];

export const SingleEvaluationView: React.FC<SingleEvaluationViewProps> = ({
  selectedModel = 'gemini-3.1-flash-lite',
}) => {
  const [inputText, setInputText] = useState('');
  const [result, setResult] = useState<DualModelComparison | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleAnalyze = async (textToUse = inputText) => {
    const trimmed = textToUse.trim();
    if (!trimmed) {
      setErrorMsg('Please type or paste some text first!');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const response = await fetch('/api/sentiment/roberta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: trimmed, model: selectedModel }),
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => null);
        throw new Error(errJson?.error || `Server error (${response.status})`);
      }

      const data: DualModelComparison = await response.json();
      setResult(data);
    } catch (err: any) {
      console.error('Sentiment analysis error:', err);
      setErrorMsg(err.message || 'Could not analyze sentiment. Please try again.');
      setResult(null);
    } finally {
      setIsLoading(false);
    }
  };

  const getMoodEmoji = (label: string) => {
    if (label === 'positive') return <Smile className="w-6 h-6 text-emerald-400" />;
    if (label === 'negative') return <Frown className="w-6 h-6 text-rose-400" />;
    return <Meh className="w-6 h-6 text-slate-400" />;
  };

  return (
    <div className="space-y-6">
      {/* Friendly Input Container */}
      <div className="bg-[#14151b] rounded-3xl border border-white/10 p-6 shadow-2xl backdrop-blur-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-semibold text-white tracking-tight flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
              What text would you like to check?
            </h2>
            <p className="text-xs text-[#9b978f] mt-0.5">
              Type or paste any customer review, message, or tweet below.
            </p>
          </div>

          <div className="text-[11px] font-mono text-[#6e6b65]">
            {inputText.length} characters
          </div>
        </div>

        {/* Text Area */}
        <div className="relative">
          <textarea
            value={inputText}
            onChange={(e) => {
              setInputText(e.target.value);
              if (errorMsg) setErrorMsg(null);
            }}
            rows={3}
            placeholder="Type or paste any text here..."
            className="w-full px-4 py-3 text-sm text-[#f5f3ef] placeholder-[#5a5852] bg-[#1a1b22] border border-white/10 rounded-2xl focus:bg-[#1e2028] focus:outline-none focus:ring-1 focus:ring-amber-400/50 transition-all font-sans leading-relaxed"
          />
        </div>

        {/* Quick Fun Ideas / Example Chips */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-[11px] text-[#6e6b65] mr-1">Quick try:</span>
          {FUN_EXAMPLES.map((ex, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                setInputText(ex.text);
                handleAnalyze(ex.text);
              }}
              className="px-3 py-1 rounded-full text-[11px] bg-white/5 hover:bg-white/10 text-[#dedad3] border border-white/10 transition-colors cursor-pointer"
            >
              {ex.label}
            </button>
          ))}
        </div>

        {/* Action Row */}
        <div className="flex items-center justify-between pt-2 border-t border-white/5">
          {errorMsg ? (
            <p className="text-xs text-rose-400 font-medium">{errorMsg}</p>
          ) : (
            <span className="text-xs text-[#9b978f]">
              Instant &amp; private evaluation
            </span>
          )}

          <button
            onClick={() => handleAnalyze()}
            disabled={isLoading || !inputText.trim()}
            className="px-7 py-2.5 text-xs font-semibold text-[#121316] bg-[#f5f3ef] hover:bg-white disabled:opacity-30 rounded-full transition-all shadow-md flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer ml-auto"
          >
            {isLoading ? (
              <>
                <Clock className="w-3.5 h-3.5 animate-spin text-amber-600" />
                <span>Checking the Vibe...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>Check the Vibe &rarr;</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Awaiting Input Empty State */}
      {!result && !isLoading && (
        <div className="bg-[#14151b]/80 rounded-3xl border border-dashed border-white/10 p-12 text-center text-[#9b978f]">
          <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 text-amber-300 flex items-center justify-center mx-auto mb-3 shadow-inner">
            <MessageSquare className="w-5 h-5 text-amber-300" />
          </div>
          <h3 className="text-sm font-semibold text-white">
            Ready when you are
          </h3>
          <p className="text-xs text-[#9b978f] max-w-sm mx-auto mt-1 leading-relaxed">
            Click any quick try button above or paste your own sentence to see instant sentiment side-by-side.
          </p>
        </div>
      )}

      {/* Results Workspace: Simple & Fun */}
      {result && (
        <div className="space-y-5 animate-in fade-in duration-200">
          {/* Fun Mood Verdict Card */}
          <div className="bg-[#14151b] rounded-3xl border border-white/10 p-5 sm:p-6 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-white/5 border border-white/10">
                  {getMoodEmoji(result.roberta.label)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-white capitalize">
                      {result.roberta.label} Mood
                    </span>
                    {result.roberta.detectedNuance && (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                        {result.roberta.detectedNuance}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#dedad3] mt-0.5">
                    {result.consensusNote}
                  </p>
                </div>
              </div>

              <div className="text-left sm:text-right">
                <span className="text-[11px] font-mono text-[#9b978f] block">
                  Analyzed in {result.roberta.latencyMs}ms
                </span>
                <span
                  className={`text-xs font-semibold ${
                    result.consensus === 'agreement' ? 'text-emerald-400' : 'text-amber-300'
                  }`}
                >
                  {result.consensus === 'agreement' ? '✨ Full Consensus' : '⚡ Nuance Detected'}
                </span>
              </div>
            </div>

            {/* Quoted Text */}
            <div className="mt-4 p-3.5 rounded-xl bg-white/5 border border-white/5 text-xs text-[#dedad3] italic leading-relaxed">
              "{result.text}"
            </div>

            {/* Side-by-side Simple Cards: Speed vs AI Intelligence */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
              {/* Speed Model (VADER) */}
              <div className="bg-[#181921] rounded-2xl border border-white/10 p-5 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-white/5">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-semibold text-white">Speed Reader (VADER)</span>
                  </div>
                  <span className="text-[10px] text-emerald-400 font-mono">&lt; 1ms</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#9b978f]">Positivity Score:</span>
                  <span
                    className={`text-base font-bold font-mono ${
                      result.vader.compound > 0
                        ? 'text-emerald-400'
                        : result.vader.compound < 0
                        ? 'text-rose-400'
                        : 'text-slate-400'
                    }`}
                  >
                    {result.vader.compound > 0 ? `+${result.vader.compound.toFixed(2)}` : result.vader.compound.toFixed(2)}
                  </span>
                </div>

                {/* Friendly Probability Bar */}
                <ProbabilityBar
                  positive={result.vader.pos}
                  neutral={result.vader.neu}
                  negative={result.vader.neg}
                />
              </div>

              {/* AI Neural Model */}
              <div className="bg-[#181921] rounded-2xl border border-white/10 p-5 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-white/5">
                  <div className="flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-blue-400" />
                    <span className="text-xs font-semibold text-white">{result.roberta.modelName || 'Context AI'}</span>
                  </div>
                  <span className="text-[10px] text-[#9b978f] font-mono">Deep Neural Net</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#9b978f]">Confidence Level:</span>
                  <span className="text-base font-bold font-mono text-emerald-400">
                    {(result.roberta.confidence * 100).toFixed(0)}%
                  </span>
                </div>

                {/* Friendly Probability Bar */}
                <ProbabilityBar
                  positive={result.roberta.pos}
                  neutral={result.roberta.neu}
                  negative={result.roberta.neg}
                />
              </div>
            </div>

            {/* Plain English AI Takeaway */}
            <div className="mt-4 p-3.5 rounded-xl bg-white/5 border border-white/5 text-xs text-[#dedad3] leading-relaxed flex items-start gap-2.5">
              <span className="text-amber-400 text-sm">💡</span>
              <div>
                <span className="font-semibold text-white">AI Takeaway: </span>
                <span>{result.roberta.reasoning}</span>
              </div>
            </div>

            {/* Optional Collapsed Details (Zero Intimidation) */}
            <div className="mt-5 pt-3 border-t border-white/5">
              <button
                type="button"
                onClick={() => setShowDetails(!showDetails)}
                className="text-xs text-[#9b978f] hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>{showDetails ? 'Hide token breakdown' : 'Curious about individual word scores? (Optional)'}</span>
                {showDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              {showDetails && (
                <div className="mt-3 overflow-x-auto rounded-xl border border-white/10 bg-[#181921]">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-white/5 text-[#9b978f] border-b border-white/5 text-[11px]">
                      <tr>
                        <th className="py-2 px-3">Word</th>
                        <th className="py-2 px-3">Score</th>
                        <th className="py-2 px-3 text-right">Impact</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-[#dedad3]">
                      {result.vader.tokens.map((tok, idx) => (
                        <tr key={idx} className="hover:bg-white/5">
                          <td className="py-2 px-3 font-medium text-white">{tok.token}</td>
                          <td className="py-2 px-3 font-mono">{tok.finalWeight > 0 ? `+${tok.finalWeight}` : tok.finalWeight}</td>
                          <td className="py-2 px-3 text-right">
                            <span
                              className={`text-[10px] font-semibold uppercase ${
                                tok.finalWeight > 0
                                  ? 'text-emerald-400'
                                  : tok.finalWeight < 0
                                  ? 'text-rose-400'
                                  : 'text-slate-500'
                              }`}
                            >
                              {tok.finalWeight > 0 ? 'Positive' : tok.finalWeight < 0 ? 'Negative' : 'Neutral'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
