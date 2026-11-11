import React, { useState } from 'react';
import { TopNav } from './components/TopNav';
import { SingleEvaluationView } from './components/SingleEvaluationView';
import { LinkAnalysisView } from './components/LinkAnalysisView';
import { SupportedModelId } from './types/sentiment';

export default function App() {
  const [activeTab, setActiveTab] = useState<'text' | 'link'>('text');
  const [selectedModel, setSelectedModel] = useState<SupportedModelId>('gemini-3.1-flash-lite');

  return (
    <div className="min-h-screen relative bg-[#0b0c0e] text-[#f5f3ef] font-sans selection:bg-amber-400/20 selection:text-amber-200 overflow-x-hidden">
      {/* Serene Atmospheric Dusk Horizon Backdrop */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <img
          src="/src/assets/images/verity_dusk_sky_1794426493205.jpg"
          alt="Atmospheric dusk horizon"
          className="w-full h-full object-cover object-center opacity-70 scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0b0e]/85 via-[#0c0d12]/70 to-[#0b0c0e]/95 backdrop-blur-[0.5px]" />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Simple Top Navigation */}
        <TopNav
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          selectedModel={selectedModel}
          onSelectModel={setSelectedModel}
        />

        {/* Friendly Hero */}
        <section className="pt-8 pb-6 px-4 text-center max-w-2xl mx-auto space-y-2">
          <h1 className="text-3xl sm:text-4xl font-normal text-[#f5f3ef] tracking-tight font-serif">
            {activeTab === 'text' ? 'How does your text feel?' : 'What does the audience think?'}
          </h1>
          <p className="text-xs sm:text-sm text-[#9b978f] font-sans leading-relaxed">
            {activeTab === 'text'
              ? 'Instant sentiment verification with rule-based speed and AI context. Catch sarcasm, honest praise, and hidden tone.'
              : 'Paste any public YouTube, X, or web link to see overall mood, top reactions, and audience consensus.'}
          </p>
        </section>

        {/* Clean, Centered Main Workspace (No Intimidating Cockpit) */}
        <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 pb-16">
          {activeTab === 'text' ? (
            <SingleEvaluationView
              selectedModel={selectedModel}
              onSelectModel={setSelectedModel}
            />
          ) : (
            <LinkAnalysisView
              selectedModel={selectedModel}
              onSelectModel={setSelectedModel}
            />
          )}
        </main>

        {/* Simple, Friendly Footer */}
        <footer className="border-t border-white/10 bg-[#090a0d]/90 py-5 mt-auto">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#9b978f]">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-[#dedad3] font-serif">Analyx</span>
              <span aria-hidden="true">&middot;</span>
              <span>Simple, honest sentiment intelligence</span>
            </div>

            <div className="flex items-center gap-3 text-[11px] text-[#6e6b65]">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                Positive
              </span>
              <span aria-hidden="true">&middot;</span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-slate-400 inline-block" />
                Neutral
              </span>
              <span aria-hidden="true">&middot;</span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
                Negative
              </span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
