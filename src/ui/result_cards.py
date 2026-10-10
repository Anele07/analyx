import html

import streamlit as st

from src.visualizations import build_highlighted_text, build_sentiment_scale


def _signed_score(d_scores) -> float:
    """DistilBERT as one number from -1 to +1: P(positive) - P(negative).

    The model has three classes, so neutral text lands near 0 instead of
    being pushed toward negative.
    """
    scores = {str(k).lower(): float(v) for k, v in dict(d_scores).items()}
    return scores.get("positive", 0.0) - scores.get("negative", 0.0)


def _has_non_english(text: str) -> bool:
    """Rough check: any non-ASCII letters suggest the text may not be English."""
    return any(ord(ch) > 127 and ch.isalpha() for ch in text)


def render_single_text_results(
    v_sent, v_comp, v_reason, d_sent, d_scores, d_reason, text=""
):
    """Renders the combined verdict, highlighted text and shared score scale.

    v_sent / d_sent are lowercase labels ("positive", "neutral", "negative").
    v_comp is VADER's compound score (-1 to 1).
    d_scores is a dict of DistilBERT class probabilities (0 to 1).
    text is the analyzed text, used for word highlighting.
    """
    v_label, d_label = v_sent.lower(), d_sent.lower()
    d_signed = _signed_score(d_scores)

    # Combined verdict
    if v_label == d_label:
        verdict, tone = v_label.capitalize(), v_label
        agreement = "Both models agree"
    else:
        verdict, tone = "Mixed", "neutral"
        agreement = (
            f"Models disagree: VADER reads {v_label}, DistilBERT reads {d_label}"
        )

    st.markdown(
        f"""
        <section class="ax-result">
            <div class="ax-verdict-row">
                <h2 class="ax-verdict ax-verdict--{tone}">{verdict}</h2>
                <p class="ax-agreement">{html.escape(agreement)}</p>
            </div>
        </section>
        """,
        unsafe_allow_html=True,
    )

    # The analyzed text, with the words that drove the VADER score highlighted
    if text:
        st.markdown(build_highlighted_text(text), unsafe_allow_html=True)

    # One shared -1 to +1 scale with a marker per model
    st.markdown(build_sentiment_scale(v_comp, d_signed), unsafe_allow_html=True)

    # Details, collapsed by default
    with st.expander("How each model scored this"):
        st.markdown(f"**VADER:** {v_reason}")
        st.markdown(f"**DistilBERT:** {d_reason}")

        if _has_non_english(text) and v_label == "neutral" and d_label != "neutral":
            st.caption(
                "This text may not be in English. VADER only understands "
                "English, so DistilBERT's result is more reliable here."
            )