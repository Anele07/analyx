import React from 'react';
import { Zap, Cpu, ArrowRight, ShieldCheck, Layers, GitCompare } from 'lucide-react';

export const DualModelDocsView: React.FC<{ onTrySingle: () => void }> = ({ onTrySingle }) => {
  return (
    <div className="space-y-6">
      {/* Overview Card */}
      <div className="bg-[#14151b] rounded-2xl border border-white/10 p-6 shadow-xl space-y-4">
        <div>
          <span className="text-xs uppercase font-mono tracking-wider text-amber-400 block mb-1">
            Engineering Architecture
          </span>
          <h2 className="text-xl font-bold text-white tracking-tight font-serif">
            Dual-Model Topology & Inspection Principles
          </h2>
          <p className="text-xs text-[#9b978f] mt-1 leading-relaxed">
            Why Analyx pairs an instantaneous rule-based valence engine with multi-layer transformer self-attention.
          </p>
        </div>

        <p className="text-xs text-[#dedad3] leading-relaxed">
          High-throughput data streaming pipelines demand sub-millisecond latencies and low compute overhead. Conversely, resolving complex social nuances—such as irony, implicit grievances, double negations, and colloquial slang—requires transformer contextual attention. Analyx bridges both paradigms by evaluating texts through two independent models concurrently.
        </p>
      </div>

      {/* Side-by-Side Model Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* VADER Lexicon */}
        <div className="bg-[#181921] rounded-2xl border border-white/10 p-5 space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-white/5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">VADER Lexicon</h3>
              <span className="text-[11px] text-[#9b978f]">Valence Dictionary for Sentiment Reasoning</span>
            </div>
          </div>

          <div className="space-y-2 text-xs text-[#9b978f] leading-relaxed">
            <p>
              <strong className="text-white">Latency:</strong> &lt; 1ms per document.
            </p>
            <p>
              <strong className="text-white">Core Algorithm:</strong> Rule-based heuristic valuation using human-curated valence ratings (-4.0 to +4.0).
            </p>
            <p className="text-white font-medium">Heuristic Rules:</p>
            <ul className="list-disc pl-4 space-y-1 text-[#9b978f]">
              <li>Punctuation booster: Exclamation marks amplify polarity by +0.292.</li>
              <li>ALL-CAPS amplifier: Boosts word valence by &plusmn;0.733.</li>
              <li>Negation tri-gram window: Inverts valence with a -0.74 scalar.</li>
              <li>Contrastive conjunctions: Dampens clauses before 'but' by 50% and amplifies post-'but' by 150%.</li>
            </ul>
          </div>

          <div className="p-3 bg-black/30 rounded-xl border border-white/5 font-mono text-[11px] text-[#dedad3]">
            <div className="text-[10px] text-[#6e6b65] font-sans mb-1">Compound Formula:</div>
            C = x / √(x² + α), where α = 15
          </div>
        </div>

        {/* Transformer Neural Network */}
        <div className="bg-[#181921] rounded-2xl border border-white/10 p-5 space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-white/5">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Neural Transformer</h3>
              <span className="text-[11px] text-[#9b978f]">Contextual Attention Architecture (RoBERTa / Gemini)</span>
            </div>
          </div>

          <div className="space-y-2 text-xs text-[#9b978f] leading-relaxed">
            <p>
              <strong className="text-white">Latency:</strong> Real-time neural inference (150–800ms).
            </p>
            <p>
              <strong className="text-white">Core Algorithm:</strong> Multi-layer bidirectional transformer with self-attention weights across token sequences.
            </p>
            <p className="text-white font-medium">Contextual Capabilities:</p>
            <ul className="list-disc pl-4 space-y-1 text-[#9b978f]">
              <li>Sarcasm & irony detection: Resolves disparity between surface compliments and negative intent.</li>
              <li>Implicit criticism: Identifies grievances lacking explicit trigger words.</li>
              <li>Slang & colloquialisms: Understands conversational shorthand and emoji semantics.</li>
              <li>Softmax distribution: Computes calibrated probability distributions across all 3 classes.</li>
            </ul>
          </div>

          <div className="p-3 bg-black/30 rounded-xl border border-white/5 font-mono text-[11px] text-[#dedad3]">
            <div className="text-[10px] text-[#6e6b65] font-sans mb-1">Softmax Formula:</div>
            P(y = c | x) = e^(z_c) / Σ e^(z_j)
          </div>
        </div>
      </div>

      {/* Trade-off Matrix */}
      <div className="bg-[#14151b] rounded-2xl border border-white/10 p-6 shadow-xl">
        <h3 className="text-sm font-semibold text-white mb-4">
          Speed vs Context Trade-Off Matrix
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-white/5 text-[#9b978f] border-b border-white/5 font-medium text-[11px]">
              <tr>
                <th className="py-2.5 px-4 font-normal">Evaluation Dimension</th>
                <th className="py-2.5 px-4 font-normal text-amber-400">VADER Lexicon</th>
                <th className="py-2.5 px-4 font-normal text-blue-400">Neural Transformer</th>
                <th className="py-2.5 px-4 font-normal text-white">Analyx Dual Synthesis</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-[#dedad3]">
              <tr className="hover:bg-white/5 transition-colors">
                <td className="py-2.5 px-4 font-medium text-white">Processing Latency</td>
                <td className="py-2.5 px-4 font-mono text-emerald-400">&lt; 1 ms (Ultra-fast)</td>
                <td className="py-2.5 px-4 font-mono text-[#9b978f]">150–800 ms</td>
                <td className="py-2.5 px-4 font-semibold text-white">Tiered Instant + Deep</td>
              </tr>
              <tr className="hover:bg-white/5 transition-colors">
                <td className="py-2.5 px-4 font-medium text-white">Sarcasm & Irony Resolution</td>
                <td className="py-2.5 px-4 text-rose-400">Fails on false praise</td>
                <td className="py-2.5 px-4 text-emerald-400 font-semibold">High accuracy (~94%)</td>
                <td className="py-2.5 px-4 font-semibold text-amber-300">Divergence flag triggers audit</td>
              </tr>
              <tr className="hover:bg-white/5 transition-colors">
                <td className="py-2.5 px-4 font-medium text-white">Explainability & Auditability</td>
                <td className="py-2.5 px-4 text-emerald-400 font-semibold">100% Deterministic token math</td>
                <td className="py-2.5 px-4 text-[#9b978f]">Self-attention highlights</td>
                <td className="py-2.5 px-4 font-semibold text-white">Inspectable token & weight table</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mt-6 pt-4 border-t border-white/5 flex justify-end">
          <button
            onClick={onTrySingle}
            className="px-6 py-2.5 text-xs font-semibold text-[#121316] bg-[#f5f3ef] hover:bg-white rounded-full transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
          >
            <span>Test Dual Model Live in Single Evaluation</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
