import React from 'react';
import { Sunrise, MessageSquareText, Globe2 } from 'lucide-react';
import { SupportedModelId } from '../types/sentiment';
import { ModelSelector } from './ModelSelector';

interface TopNavProps {
  activeTab: 'text' | 'link';
  setActiveTab: (tab: 'text' | 'link') => void;
  selectedModel: SupportedModelId;
  onSelectModel: (model: SupportedModelId) => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  activeTab,
  setActiveTab,
  selectedModel,
  onSelectModel,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#0c0d11]/85 backdrop-blur-md border-b border-white/10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand Zone */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500/20 to-amber-300/10 border border-amber-400/30 flex items-center justify-center text-amber-300 shadow-xs">
            <Sunrise className="w-4 h-4 text-amber-300" />
          </div>
          <span className="text-xl font-bold tracking-tight text-[#f5f3ef] font-serif">
            Analyx
          </span>
        </div>

        {/* Center: Friendly, Fun Segmented Switcher */}
        <div className="flex items-center p-1 bg-white/5 border border-white/10 rounded-full text-xs">
          <button
            onClick={() => setActiveTab('text')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full transition-all cursor-pointer font-medium ${
              activeTab === 'text'
                ? 'bg-white text-[#121316] font-semibold shadow-xs'
                : 'text-[#9b978f] hover:text-white'
            }`}
          >
            <MessageSquareText className="w-3.5 h-3.5" />
            <span>Text Mood</span>
          </button>

          <button
            onClick={() => setActiveTab('link')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full transition-all cursor-pointer font-medium ${
              activeTab === 'link'
                ? 'bg-white text-[#121316] font-semibold shadow-xs'
                : 'text-[#9b978f] hover:text-white'
            }`}
          >
            <Globe2 className="w-3.5 h-3.5" />
            <span>Link Vibe</span>
          </button>
        </div>

        {/* Right: Model Selector */}
        <div className="flex items-center gap-2 shrink-0">
          <ModelSelector
            selectedModel={selectedModel}
            onSelectModel={onSelectModel}
          />
        </div>
      </div>
    </header>
  );
};
