import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Zap, Cpu, Sparkles } from 'lucide-react';
import { SupportedModelId, ModelInfo } from '../types/sentiment';

interface ModelSelectorProps {
  selectedModel: SupportedModelId;
  onSelectModel: (id: SupportedModelId) => void;
}

export const AVAILABLE_MODELS_LIST: ModelInfo[] = [
  {
    id: 'gemini-3.1-flash-lite',
    name: 'Gemini 3.1 Flash-Lite',
    tag: 'Modern Free Tier · Recommended',
    description: 'Ultra-fast Gemini 3 generation text model with minimal thinking latency and separate quota bucket.',
    isFree: true,
  },
  {
    id: 'gemini-flash-latest',
    name: 'Gemini Flash Latest',
    tag: 'Production Flash · Free Tier',
    description: 'Dynamic alias pointing to Google\'s latest production Flash release.',
    isFree: true,
  },
  {
    id: 'gemini-3.8-flash',
    name: 'Gemini 3.8 Flash',
    tag: 'Standard Flash Model',
    description: 'Google\'s balanced flash model for high-accuracy contextual understanding.',
    isFree: true,
  },
];

export const ModelSelector: React.FC<ModelSelectorProps> = ({ selectedModel, onSelectModel }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const current = AVAILABLE_MODELS_LIST.find((m) => m.id === selectedModel) || AVAILABLE_MODELS_LIST[0];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-[#dedad3] bg-[#1a1b21] hover:bg-[#22242c] rounded-lg transition-colors border border-white/10 shadow-xs"
      >
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
        <span className="text-[#9b978f] font-normal">Model:</span>
        <span className="text-white font-semibold">{current.name}</span>
        <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.2 rounded-md font-mono">
          Free
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-[#9b978f] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div
          role="listbox"
          className="absolute right-0 mt-2 w-80 bg-[#16171d] rounded-2xl shadow-2xl border border-white/10 py-2 z-50 text-xs animate-in fade-in zoom-in-95 duration-100 backdrop-blur-xl"
        >
          <div className="px-3.5 py-2 border-b border-white/5 flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#9b978f]">
              Neural Inference Engine
            </span>
            <span className="text-[10px] text-amber-400 font-mono">Gemini API</span>
          </div>

          <div className="p-1.5 space-y-1">
            {AVAILABLE_MODELS_LIST.map((model) => {
              const isSelected = model.id === selectedModel;
              return (
                <button
                  key={model.id}
                  type="button"
                  onClick={() => {
                    onSelectModel(model.id);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left p-2.5 rounded-xl transition-colors flex items-start gap-2.5 ${
                    isSelected
                      ? 'bg-white/10 text-white border border-white/10'
                      : 'hover:bg-white/5 text-[#dedad3] border border-transparent'
                  }`}
                >
                  <div
                    className={`p-1.5 rounded-lg mt-0.5 shrink-0 ${
                      isSelected
                        ? 'bg-white text-[#121316]'
                        : 'bg-white/5 text-[#9b978f]'
                    }`}
                  >
                    {model.id === 'gemini-3.8-flash' ? (
                      <Cpu className="w-3.5 h-3.5" />
                    ) : model.id === 'gemini-3.1-flash-lite' ? (
                      <Zap className="w-3.5 h-3.5" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-semibold text-xs text-white truncate">{model.name}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                    </div>
                    <span
                      className={`text-[10px] font-medium block mt-0.5 ${
                        isSelected ? 'text-emerald-400' : 'text-[#9b978f]'
                      }`}
                    >
                      {model.tag}
                    </span>
                    <p className="text-[11px] leading-relaxed mt-1 text-[#9b978f]">
                      {model.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="px-3.5 py-2 border-t border-white/5 text-[11px] text-[#9b978f] bg-black/20 rounded-b-2xl flex items-center justify-between">
            <span>Free-tier models with zero quota overlap</span>
            <span className="font-mono text-emerald-400 font-medium">Verified Free</span>
          </div>
        </div>
      )}
    </div>
  );
};
