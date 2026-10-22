import html
import re
from functools import lru_cache


# ---------------------------------------------------------------------------
# Result view: highlighted text and the shared scale
# ---------------------------------------------------------------------------

@lru_cache(maxsize=1)
def _vader_resources():
    """Returns the VADER lexicon and negation words used for text highlights."""
    from nltk.sentiment.vader import SentimentIntensityAnalyzer
    from nltk.sentiment.vader import VaderConstants

    lexicon = SentimentIntensityAnalyzer().lexicon
    negations = {word.lower() for word in VaderConstants.NEGATE}
    return lexicon, negations


def build_highlighted_text(text: str) -> str:
    """The analyzed text, with the words that drove the VADER score highlighted.

    A word is highlighted green if it pushes the score up and red if it pushes
    it down. If one of the three words before it is a negation ("not good"),
    the colour is flipped, which mirrors how VADER scores it.
    """
    lexicon, negations = _vader_resources()

    tokens = re.findall(r"\s+|[\w']+|[^\w\s]+", text)
    word_history = []  # previous word tokens, lowercased
    parts = []

    for token in tokens:
        safe = html.escape(token)
        is_word = bool(re.match(r"[\w']+$", token))

        if not is_word:
            parts.append(safe)
            continue

        lower = token.lower()
        score = lexicon.get(lower, 0)

        if score:
            recent = word_history[-3:]
            negated = any(w in negations or "n't" in w for w in recent)
            if negated:
                score = -score

        if score > 0:
            parts.append(f'<mark class="ax-hl ax-hl--pos">{safe}</mark>')
        elif score < 0:
            parts.append(f'<mark class="ax-hl ax-hl--neg">{safe}</mark>')
        else:
            parts.append(safe)

        word_history.append(lower)

    return f'<p class="ax-text">{"".join(parts)}</p>'


def build_sentiment_scale(vader_score: float, distil_score: float) -> str:
    """One shared -1 to +1 scale with a marker for each model."""

    def position(score: float) -> float:
        clamped = max(-1.0, min(1.0, float(score)))
        return (clamped + 1) / 2 * 100

    return f"""
    <div class="ax-scale" role="img"
         aria-label="VADER {vader_score:+.2f}, DistilBERT {distil_score:+.2f}, on a scale from -1 to +1">
        <div class="ax-scale__track"></div>
        <div class="ax-marker ax-marker--top" style="left:{position(vader_score):.1f}%">
            <span>VADER {vader_score:+.2f}</span>
        </div>
        <div class="ax-marker ax-marker--bottom" style="left:{position(distil_score):.1f}%">
            <span>DistilBERT {distil_score:+.2f}</span>
        </div>
    </div>
    <div class="ax-scale__ends"><span>Negative</span><span>Positive</span></div>
    """


# ---------------------------------------------------------------------------
# Dataset view: summary strip
# ---------------------------------------------------------------------------

def build_summary_strip(positive: int, neutral: int, negative: int) -> str:
    """A row of sentiment counts for batch results."""
    items = [
        ("positive", "Positive", positive),
        ("neutral", "Neutral", neutral),
        ("negative", "Negative", negative),
    ]
    cells = "".join(
        f'<div class="ax-summary__item ax-summary__item--{key}">'
        f'<span class="ax-summary__count">{int(count):,}</span>'
        f'<span class="ax-summary__label">{label}</span>'
        f"</div>"
        for key, label, count in items
    )
    return f'<div class="ax-summary">{cells}</div>'