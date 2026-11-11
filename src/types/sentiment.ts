export type SentimentLabel = 'positive' | 'neutral' | 'negative';

export interface TokenContribution {
  token: string;
  rawValence: number;
  finalWeight: number;
  isBooster?: boolean;
  isNegated?: boolean;
  isAllCap?: boolean;
  role?: 'positive' | 'negative' | 'neutral' | 'modifier';
}

export interface VaderResult {
  label: SentimentLabel;
  compound: number; // -1.0 to 1.0
  pos: number; // 0 to 1
  neu: number; // 0 to 1
  neg: number; // 0 to 1
  confidence: number; // 0 to 1
  latencyMs: number;
  tokens: TokenContribution[];
  explanation: string;
}

export interface AttentionHighlight {
  phrase: string;
  weight: number; // 0 to 1
  polarity: SentimentLabel;
}

export interface RobertaResult {
  label: SentimentLabel;
  pos: number; // 0 to 1
  neu: number; // 0 to 1
  neg: number; // 0 to 1
  confidence: number; // 0 to 1
  latencyMs: number;
  detectedNuance?: string; // e.g. "Sarcasm detected", "Contrasting clause", "Emoji amplification"
  attentionHighlights: AttentionHighlight[];
  reasoning: string;
  modelName?: string;
}

export interface DualModelComparison {
  text: string;
  vader: VaderResult;
  roberta: RobertaResult;
  consensus: 'agreement' | 'divergence' | 'intensity_variance';
  consensusNote: string;
  quotaNotice?: string;
  modelName?: string;
}

export interface ScrapedComment {
  id: string;
  author: string;
  handle: string;
  avatarUrl: string;
  platform: 'youtube' | 'x' | 'tiktok' | 'amazon' | 'trustpilot';
  timestamp: string;
  likes: number;
  text: string;
  vader: VaderResult;
  roberta: RobertaResult;
  consensus: 'agreement' | 'divergence' | 'intensity_variance';
  aspectTags: string[];
}

export interface AspectMetric {
  name: string;
  mentionCount: number;
  positivePct: number;
  neutralPct: number;
  negativePct: number;
  netScore: number;
}

export interface BatchAnalysisReport {
  sourceUrl?: string;
  sourceTitle: string;
  platform: 'youtube' | 'x' | 'tiktok' | 'amazon' | 'trustpilot' | 'custom';
  totalCount: number;
  positivePct: number;
  neutralPct: number;
  negativePct: number;
  netSentimentScore: number; // -100 to +100
  avgConfidence: number;
  divergenceRatePct: number;
  aspects: AspectMetric[];
  comments: ScrapedComment[];
  quotaNotice?: string;
  modelName?: string;
}

export type SupportedModelId = 'gemini-3.1-flash-lite' | 'gemini-flash-latest' | 'gemini-3.8-flash';

export interface ModelInfo {
  id: SupportedModelId;
  name: string;
  tag: string;
  description: string;
  isFree: boolean;
}
