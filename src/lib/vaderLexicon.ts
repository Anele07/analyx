import { SentimentLabel, TokenContribution, VaderResult } from '../types/sentiment';

// VADER Lexicon terms with valence ratings (-4.0 to +4.0)
const LEXICON: Record<string, number> = {
  // Positive valence
  great: 3.1,
  amazing: 3.4,
  excellent: 3.5,
  awesome: 3.3,
  love: 3.2,
  loved: 3.1,
  loving: 3.0,
  best: 3.2,
  fantastic: 3.4,
  superb: 3.2,
  wonderful: 3.3,
  good: 1.9,
  better: 2.1,
  nice: 1.8,
  perfect: 3.5,
  flawless: 3.3,
  smooth: 1.8,
  fast: 1.7,
  responsive: 2.0,
  happy: 2.7,
  delighted: 2.9,
  enjoy: 2.2,
  enjoyed: 2.1,
  impressive: 2.6,
  impressed: 2.5,
  brilliant: 3.1,
  stellar: 3.2,
  revolutionary: 3.0,
  sleek: 2.1,
  worth: 2.0,
  worthy: 2.1,
  recommend: 2.6,
  recommended: 2.5,
  helpful: 2.0,
  solid: 1.8,
  clean: 1.7,
  reliable: 2.3,
  quality: 2.1,
  valuable: 2.4,
  gem: 2.5,
  pleased: 2.3,
  top: 1.9,
  stunning: 3.0,
  favorite: 2.7,
  exceptional: 3.2,
  outstanding: 3.3,
  innovative: 2.5,
  bargain: 2.0,
  durable: 2.0,
  premium: 2.4,
  beautiful: 2.8,
  cool: 1.6,
  effective: 2.0,
  efficient: 2.1,
  gamechanger: 3.2,
  sharp: 1.7,
  crisp: 1.8,
  satisfying: 2.3,
  satisfied: 2.2,
  intuitive: 2.2,
  terrific: 2.9,
  flawlessly: 3.1,
  upgrade: 2.0,

  // Negative valence
  bad: -2.5,
  worst: -3.4,
  terrible: -3.2,
  awful: -3.3,
  horrible: -3.4,
  hate: -3.1,
  hated: -3.0,
  poor: -2.2,
  disappointed: -2.7,
  disappointing: -2.6,
  disappointment: -2.8,
  useless: -3.0,
  broken: -2.6,
  trash: -3.3,
  garbage: -3.3,
  junk: -3.0,
  scam: -3.6,
  fraud: -3.5,
  ripoff: -3.4,
  slow: -1.8,
  laggy: -2.2,
  glitch: -2.0,
  glitchy: -2.2,
  buggy: -2.3,
  freeze: -1.9,
  frozen: -1.9,
  crash: -2.6,
  crashed: -2.5,
  crashing: -2.7,
  unusable: -3.1,
  waste: -2.9,
  regret: -2.6,
  regretted: -2.5,
  ugly: -2.3,
  annoying: -2.4,
  annoyed: -2.3,
  frustrating: -2.7,
  frustrated: -2.6,
  cheap: -1.7,
  overpriced: -2.4,
  expensive: -1.5,
  faulty: -2.5,
  defective: -2.8,
  flawed: -2.2,
  clunky: -2.1,
  awkward: -1.8,
  terribly: -2.9,
  horribly: -3.1,
  fail: -2.4,
  failed: -2.5,
  failure: -2.7,
  sucks: -2.8,
  dull: -1.5,
  mediocre: -1.6,
  pathetic: -3.0,
  nightmare: -3.2,
  drain: -1.6,
  hot: -1.0,
  overheating: -2.5,
  overheats: -2.5,
  boring: -2.0,
  shame: -2.1,
  ridiculous: -2.3,

  // Emojis & Slang
  '🔥': 3.1,
  '❤️': 3.3,
  '😍': 3.4,
  '👍': 2.0,
  '👏': 2.2,
  '🚀': 2.8,
  '💯': 3.0,
  '🎉': 2.7,
  '✨': 2.2,
  '⭐': 2.0,
  '🙌': 2.4,
  '💩': -3.1,
  '🤮': -3.4,
  '😡': -3.0,
  '👎': -2.3,
  '💀': -1.8,
  '😭': -1.5,
  '🤦': -2.2,
  '⚠️': -1.6,
  '🤡': -2.4,
  mid: -1.5,
  goat: 3.5,
  fire: 2.8,
  banger: 3.0,
  flop: -2.6,
  cap: -2.0,
  lit: 2.5,
  w: 2.4,
  l: -2.3,
};

// Booster words that scale sentiment intensity
const BOOSTERS: Record<string, number> = {
  absolutely: 0.35,
  extremely: 0.35,
  totally: 0.3,
  insanely: 0.38,
  massively: 0.32,
  very: 0.28,
  really: 0.26,
  incredibly: 0.36,
  super: 0.29,
  highly: 0.27,
  completely: 0.3,
  exceptionally: 0.34,
  hugely: 0.28,
  deeply: 0.27,
  quite: 0.18,
  somewhat: -0.22,
  slightly: -0.25,
  kinda: -0.2,
  sorta: -0.2,
  barely: -0.3,
  hardly: -0.32,
};

// Negator terms
const NEGATORS = new Set([
  'not',
  "n't",
  'never',
  'no',
  'neither',
  'nor',
  'nothing',
  'nowhere',
  'without',
  'hardly',
  'barely',
  'scarcely',
  'rarely',
  'seldom',
  'aint',
  "ain't",
  "don't",
  "didn't",
  "doesn't",
  "won't",
  "can't",
  "cannot",
  "couldn't",
  "shouldn't",
  "wasn't",
  "aren't",
  "isn't",
]);

// Contrastive conjunctions that shift focus to the latter half
const CONTRASTIVE_CONJUNCTIONS = new Set(['but', 'however', 'although', 'though', 'yet', 'nevertheless']);

/**
 * Executes a VADER-style rule-based lexicon sentiment calculation.
 * Operates in < 1ms, returning compound score (-1.0 to +1.0),
 * pos/neu/neg proportions, and individual token contributions.
 */
export function evaluateVaderSentiment(text: string): VaderResult {
  const t0 = performance.now();

  if (!text || text.trim().length === 0) {
    return {
      label: 'neutral',
      compound: 0,
      pos: 0,
      neu: 1,
      neg: 0,
      confidence: 1.0,
      latencyMs: 0.1,
      tokens: [],
      explanation: 'Empty or whitespace input defaults to neutral.',
    };
  }

  // Tokenize preserving case for ALL-CAPS detection, but clean punctuation except ! and ?
  const rawWords = text.match(/\b[\w'-]+\b|[!?]+|[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu) || [];
  const tokenContributions: TokenContribution[] = [];

  let isPostContrastive = false;
  let runningValenceTotal = 0;
  let positiveScoreSum = 0;
  let negativeScoreSum = 0;
  let totalTokenValencesCount = 0;

  for (let i = 0; i < rawWords.length; i++) {
    const rawWord = rawWords[i];
    const lowerWord = rawWord.toLowerCase();

    // Check for contrastive conjunction
    if (CONTRASTIVE_CONJUNCTIONS.has(lowerWord)) {
      isPostContrastive = true;
      continue;
    }

    // Check for booster
    if (BOOSTERS[lowerWord] !== undefined) {
      tokenContributions.push({
        token: rawWord,
        rawValence: 0,
        finalWeight: BOOSTERS[lowerWord],
        isBooster: true,
        role: 'modifier',
      });
      continue;
    }

    // Check if word has valence in dictionary
    const baseValence = LEXICON[lowerWord];
    if (baseValence !== undefined) {
      let weight = baseValence;
      const isAllCap = rawWord.length > 1 && rawWord === rawWord.toUpperCase();

      // All caps booster
      if (isAllCap) {
        weight += baseValence > 0 ? 0.733 : -0.733;
      }

      // Check preceding 1-3 words for boosters or negations
      let boosterAdjustment = 0;
      let isNegated = false;

      for (let dist = 1; dist <= 3; dist++) {
        const prevIndex = i - dist;
        if (prevIndex < 0) break;
        const prevWord = rawWords[prevIndex].toLowerCase();

        if (BOOSTERS[prevWord] !== undefined) {
          const factor = 1 - (dist - 1) * 0.15;
          const boosterVal = BOOSTERS[prevWord] * factor;
          boosterAdjustment += baseValence > 0 ? boosterVal : -boosterVal;
        }

        if (NEGATORS.has(prevWord) || prevWord.endsWith("n't")) {
          isNegated = true;
        }
      }

      weight += boosterAdjustment;

      // Apply negation scalar (-0.74 standard in VADER)
      if (isNegated) {
        weight = weight * -0.74;
      }

      // Conjunction clause weighting: dampen pre-but, amplify post-but
      if (isPostContrastive) {
        weight *= 1.4;
      }

      tokenContributions.push({
        token: rawWord,
        rawValence: baseValence,
        finalWeight: Number(weight.toFixed(3)),
        isBooster: false,
        isNegated,
        isAllCap,
        role: weight > 0 ? 'positive' : weight < 0 ? 'negative' : 'neutral',
      });

      runningValenceTotal += weight;
      if (weight > 0) {
        positiveScoreSum += weight;
      } else {
        negativeScoreSum += Math.abs(weight);
      }
      totalTokenValencesCount++;
    } else {
      // Neutral token
      if (rawWord.length > 2 && !rawWord.startsWith('http')) {
        tokenContributions.push({
          token: rawWord,
          rawValence: 0,
          finalWeight: 0,
          role: 'neutral',
        });
      }
    }
  }

  // Punctuation amplification (! adds up to 3 increments of 0.292)
  const exclamationMatches = text.match(/!+/g);
  if (exclamationMatches) {
    const totalExclamations = Math.min(exclamationMatches.join('').length, 4);
    if (runningValenceTotal !== 0) {
      const punctMultiplier = totalExclamations * 0.292;
      runningValenceTotal += runningValenceTotal > 0 ? punctMultiplier : -punctMultiplier;
    }
  }

  // VADER Normalization: C = x / sqrt(x^2 + alpha) where alpha = 15
  const alpha = 15;
  const compound = Number(
    (runningValenceTotal / Math.sqrt(Math.pow(runningValenceTotal, 2) + alpha)).toFixed(4)
  );

  // Proportions: positive, neutral, negative
  const neutralBase = Math.max(0, rawWords.length - totalTokenValencesCount) * 0.5;
  const totalSum = positiveScoreSum + negativeScoreSum + neutralBase;

  let pos = 0;
  let neg = 0;
  let neu = 1;

  if (totalSum > 0) {
    pos = Number((positiveScoreSum / totalSum).toFixed(3));
    neg = Number((negativeScoreSum / totalSum).toFixed(3));
    neu = Number(Math.max(0, 1 - (pos + neg)).toFixed(3));
  }

  // Classification label according to standard VADER thresholds
  let label: SentimentLabel = 'neutral';
  if (compound >= 0.05) {
    label = 'positive';
  } else if (compound <= -0.05) {
    label = 'negative';
  }

  // Confidence metric based on compound intensity
  const confidence = Number(Math.min(0.99, Math.max(0.55, Math.abs(compound) + 0.35)).toFixed(2));

  const t1 = performance.now();
  const latencyMs = Number(Math.max(0.1, t1 - t0).toFixed(2));

  let explanation = '';
  if (label === 'positive') {
    explanation = `Lexicon identified ${tokenContributions.filter(t => (t.finalWeight ?? 0) > 0).length} positive valence markers yielding compound score of +${compound}.`;
  } else if (label === 'negative') {
    explanation = `Lexicon identified ${tokenContributions.filter(t => (t.finalWeight ?? 0) < 0).length} negative valence markers yielding compound score of ${compound}.`;
  } else {
    explanation = `Balanced or minimal valence detected across tokens, resulting in neutral compound score of ${compound}.`;
  }

  return {
    label,
    compound,
    pos,
    neu,
    neg,
    confidence,
    latencyMs,
    tokens: tokenContributions,
    explanation,
  };
}
