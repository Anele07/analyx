import html
import re

import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
import streamlit as st

# Palette (keep in sync with the tokens in src/ui/styles.py)
INK = "#14181F"
RULE = "#D5DAE0"
NEGATIVE = "#D9503F"
NEUTRAL = "#8A93A0"
POSITIVE = "#0F9D7A"

_FALLBACK_NEGATIONS = {
    "not", "no", "never", "none", "nobody", "nothing", "neither", "nor",
    "cannot", "without", "hardly", "barely", "rarely", "seldom",
}


# ---------------------------------------------------------------------------
# Result view: highlighted text and the shared scale
# ---------------------------------------------------------------------------

@st.cache_resource
def _vader_resources():
    """Returns (lexicon, negation_words). Both are empty if VADER can't load,
    so highlighting is skipped instead of breaking the page."""
    try:
        from nltk.sentiment.vader import SentimentIntensityAnalyzer

        lexicon = SentimentIntensityAnalyzer().lexicon
    except Exception:
        return {}, set()

    try:
        from nltk.sentiment.vader import NEGATE

        negations = {w.lower() for w in NEGATE}
    except Exception:
        negations = set(_FALLBACK_NEGATIONS)
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


# ---------------------------------------------------------------------------
# Legacy charts (no longer used by the single-text view)
# Kept, restyled with the new palette, in case other code still imports them.
# ---------------------------------------------------------------------------

def plot_vader_gauge(compound_score: float):
    """Semi-circle gauge for the VADER compound score."""
    fig = go.Figure(
        go.Indicator(
            mode="gauge+number",
            value=compound_score,
            domain={"x": [0, 1], "y": [0, 1]},
            gauge={
                "axis": {"range": [-1, 1], "tickwidth": 1, "tickcolor": RULE},
                "bar": {"color": INK},
                "bgcolor": "white",
                "borderwidth": 1,
                "bordercolor": RULE,
                "steps": [
                    {"range": [-1, -0.05], "color": "rgba(217, 80, 63, 0.18)"},
                    {"range": [-0.05, 0.05], "color": "rgba(138, 147, 160, 0.18)"},
                    {"range": [0.05, 1], "color": "rgba(15, 157, 122, 0.18)"},
                ],
            },
        )
    )
    fig.update_layout(
        height=150,
        margin=dict(l=20, r=20, t=10, b=10),
        paper_bgcolor="rgba(0,0,0,0)",
        plot_bgcolor="rgba(0,0,0,0)",
    )
    return fig


def plot_distilbert_bars(scores: dict):
    """Horizontal probability bars for DistilBERT class probabilities."""
    df_chart = pd.DataFrame(
        {
            "Class": [k.capitalize() for k in scores.keys()],
            "Probability (%)": [v * 100 for v in scores.values()],
        }
    )
    fig = px.bar(
        df_chart,
        x="Probability (%)",
        y="Class",
        orientation="h",
        color="Class",
        color_discrete_map={
            "Positive": POSITIVE,
            "Neutral": NEUTRAL,
            "Negative": NEGATIVE,
        },
        height=150,
    )
    fig.update_layout(
        margin=dict(l=0, r=0, t=10, b=10),
        showlegend=False,
        xaxis=dict(range=[0, 100], showgrid=False),
        yaxis=dict(title=None),
        paper_bgcolor="rgba(0,0,0,0)",
        plot_bgcolor="rgba(0,0,0,0)",
    )
    return fig