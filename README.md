# Analyx — Advanced Dual-Model Sentiment Intelligence

> An enterprise-grade sentiment analysis web application that bridges sub-millisecond rule-based lexicon speed with deep, context-aware transformer neural intelligence.

---

## 📖 Overview

**Analyx** is designed to solve a classic challenge in natural language processing (NLP): high-throughput stream processing requires microsecond latencies and low compute budgets, whereas detecting subtle social media nuance—such as irony, sarcasm, double negations, and slang—requires multi-layer contextual attention mechanisms.

Analyx pairs both worlds through an intuitive, dual-model architecture:
1. **Rule-Based Lexicon (VADER-style)**: Computes deterministic token valences in under 1 millisecond.
2. **Context-Aware Neural Transformer (Twitter-RoBERTa-style via Gemini 3)**: Resolves contextual self-attention weights, detects sarcasm/irony, and outputs calibrated softmax probabilities.

Whenever predictions diverge (e.g. surface praise disguising sarcasm), Analyx flags the divergence and explains the underlying linguistic shift.

---

## ✨ Key Features

### 1. Single Text Evaluation ("Text Mood")
- **Direct Review & Comment Evaluation**: Paste any user review, sentence, or feedback.
- **Side-by-Side Model Comparison**:
  - **Speed Reader (VADER)**: Sub-millisecond rule-based calculation, compound score from `-1.0` to `+1.0`, and valence proportions.
  - **Context AI (Neural Transformer)**: Contextual interpretation, self-attention highlights, and model conviction score (`0%–100%`).
- **Nuance & Sarcasm Detection**: Automatically tags subtle tones (*"Sarcasm detected"*, *"Sincere praise"*, *"Implicit criticism"*).
- **Consensus Arbiter**: Highlights when both models agree vs. when contextual divergence occurs.
- **Inspectable Token Matrix (Optional)**: Expandable breakdown displaying raw token valences, modifier scalars (boosters, negations), and final weights.
- **Quick Try Chips**: One-click preset examples to test positive, sarcastic, mixed, and negative sentiments instantly.

### 2. Public Link & Audience Scraper ("Link Vibe")
- **Live Metadata Resolution**: Resolves titles and creator details from public URLs (YouTube, X/Twitter, TikTok, Amazon) via YouTube's open oEmbed API and lightweight web resolvers.
- **Audience Sentiment Analytics**:
  - **Interactive Sentiment Donut Chart**: Hoverable arc segments with exact percentages for positive, neutral, and negative reactions.
  - **Net Sentiment Score (NSS)**: Standardized audience metric ranging from `-100` (purely negative) to `+100` (purely positive).
  - **Average Model Conviction**: Overall neural certainty across all processed audience reactions.
- **Granular Comment Feed**:
  - Filterable by sentiment category (*Positive*, *Neutral*, *Negative*, *Divergence*).
  - Client-side search and sorting.
  - Deterministic initials SVG avatars dynamically rendered from commenter names.
  - Multi-domain aspect tags (e.g. *Risk Management*, *Battery Life*, *Pricing & Value*).
- **One-Click CSV Export**: Download audience reactions with author handles, likes, text, and dual-model sentiment classifications.

### 3. Neural Engine Switcher
- Choose between modern, free-tier Gemini models without quota conflicts:
  - **Gemini 3.1 Flash-Lite** (*Recommended*): Ultra-fast Gemini 3 model with minimal latency.
  - **Gemini Flash Latest**: Dynamic alias tracking the newest production Flash release.
  - **Gemini 3.8 Flash**: Balanced Google model for nuanced contextual comprehension.

### 4. Simple, Clean, Non-Intimidating UI/UX
- Aesthetic inspired by luxury modern Framer designs (Verity theme).
- Atmospheric dusk horizon sky backdrop with warm peach/amber twilight glow.
- Dark obsidian cards (`#121316`, `#181921`) with crisp hairline borders and warm ivory typography.
- Simple and fun presentation without overwhelming mathematical jargon or cluttered sidebars.

---

## 🛠️ Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, TypeScript, Tailwind CSS v4, Lucide React |
| **Typography** | Playfair Display (Serif), Plus Jakarta Sans, JetBrains Mono |
| **Backend & Server** | Node.js, Express, `tsx` (TypeScript Execution Engine) |
| **AI & NLP** | `@google/genai` (Google GenAI SDK), VADER Rule Engine (`vaderLexicon.ts`), YouTube oEmbed API |
| **Build & Dev Tooling** | Vite, TypeScript Compiler (`tsc`) |

---

## 📂 Project Structure

```
.
├── server.ts                    # Express server with Vite middleware, Gemini API proxy & oEmbed scraper
├── src/
│   ├── App.tsx                  # Root application layout with dusk background & tab navigation
│   ├── main.tsx                 # React entry point
│   ├── index.css                # Global Tailwind CSS v4 rules & font definitions
│   ├── assets/
│   │   └── images/              # Atmospheric dusk sky backdrop and visual assets
│   ├── components/
│   │   ├── TopNav.tsx               # Header with brand mark, segmented tab switcher & model selector
│   │   ├── ModelSelector.tsx        # Neural model dropdown with free-tier tracking
│   │   ├── SingleEvaluationView.tsx # Text mood evaluation, prompt bar & side-by-side cards
│   │   ├── LinkAnalysisView.tsx     # Link scraper, audience donut chart & comment feed
│   │   ├── AudienceDonutChart.tsx   # Interactive SVG donut chart with hover segmentation
│   │   ├── ConfidenceGauge.tsx      # Dual-color dynamic semi-circular gauge
│   │   ├── ProbabilityBar.tsx       # Segmented sentiment probability distribution bar
│   │   └── DualModelDocsView.tsx    # Technical architecture & speed vs context trade-off matrix
│   ├── lib/
│   │   └── vaderLexicon.ts      # Sub-millisecond rule-based VADER lexicon engine (7,500+ valence terms)
│   └── types/
│       └── sentiment.ts         # TypeScript interfaces & types for models, metrics, and reports
├── index.html                   # HTML entry point with Google Fonts preconnects
├── package.json                 # Project dependencies and npm scripts
├── tsconfig.json                # TypeScript configuration
└── vite.config.ts               # Vite configuration
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **Gemini API Key**: A valid Google AI Studio API key (configured as `GEMINI_API_KEY` in your environment or `.env` file).

### Installation

1. Clone or open the repository:
   ```bash
   cd analyx
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure your API key:
   Create a `.env` file in the root directory (or copy from `.env.example`):
   ```bash
   GEMINI_API_KEY=your_gemini_api_key_here
   PORT=3000
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

---

## 🔬 How the Dual-Model Approach Works

```
                                  [ User Input ]
                                        │
                    ┌───────────────────┴───────────────────┐
                    ▼                                       ▼
        ┌───────────────────────┐               ┌───────────────────────┐
        │   VADER Rule Engine   │               │ Neural Transformer    │
        │  (Rule-Based Lexicon) │               │   (Gemini 3 API)      │
        └───────────┬───────────┘               └───────────┬───────────┘
                    │ < 1ms latency                         │ ~200-800ms
                    │ Deterministic tokens                  │ Contextual self-attention
                    │ Booster & negation math               │ Sarcasm & idiom resolution
                    ▼                                       ▼
        ┌───────────────────────┐               ┌───────────────────────┐
        │     Compound Score    │               │  Softmax Probability  │
        │    (-1.0 to +1.0)     │               │  (Pos / Neu / Neg)    │
        └───────────┬───────────┘               └───────────┬───────────┘
                    │                                       │
                    └───────────────────┬───────────────────┘
                                        ▼
                            ┌───────────────────────┐
                            │   Consensus Arbiter   │
                            │   (Agreement Check)   │
                            └───────────┬───────────┘
                                        │
                    ┌───────────────────┴───────────────────┐
                    ▼                                       ▼
        [ Full Agreement 🎉 ]                   [ Divergence Flagged ⚡ ]
        High mutual conviction                  e.g. Sarcasm detected!
```

- **VADER Math**: Computes valence scores using normalized sum:
  $$C = \frac{\sum v}{\sqrt{(\sum v)^2 + \alpha}}, \quad \alpha = 15$$
  Applies heuristic modifiers for exclamation marks, all-caps emphasis, negation tri-gram windows, and contrastive conjunctions (`but`, `however`).
- **Neural Transformer**: Leverages transformer self-attention embeddings to identify deep contextual relationships, resolving surface praise that masks complaints or backhanded compliments.

---

## 🛡️ Production & Reliability Standards

- **Zero Mock / Zero Fallback Policy**: The application operates exclusively on real user input and live model outputs. If an external service is unreachable or rate-limited, authentic HTTP status codes and user-friendly error notices are surfaced directly.
- **Quota Resilience**: Tracks quota exhaustion independently per model ID so users can smoothly switch between `gemini-3.1-flash-lite`, `gemini-flash-latest`, and `gemini-3.8-flash`.
- **Deterministic SVGs**: Commenter avatars are dynamically generated as deterministic SVG data URIs derived from each author's name, eliminating fragile third-party image URLs.

---

## 📄 License

MIT License. Built for real-world audience sentiment intelligence.
