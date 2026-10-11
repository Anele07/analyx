import pandas as pd
import streamlit as st

from src.extractors import extract_text_from_file
from src.models import SentimentEngine
from src.ui.header import render_header
from src.ui.input_section import render_input_section
from src.ui.result_cards import render_single_text_results
from src.ui.styles import apply_custom_css
from src.visualizations import build_summary_strip

# ---------------------------------------------------------------------------
# Page setup
# ---------------------------------------------------------------------------
st.set_page_config(
    page_title="AnalyX",
    page_icon="assets\Image_icon.jpg",
    layout="centered",
)

apply_custom_css()
render_header()

MAX_ROWS = 2000  # keeps batch runs responsive on CPU
TEXT_COLUMN_HINTS = (
    "review", "comment", "feedback", "text", "message",
    "description", "body", "content",
)
VERDICT_STYLES = {
    "positive": "color: #0F9D7A; font-weight: 600",
    "negative": "color: #D9503F; font-weight: 600",
    "neutral": "color: #8A93A0; font-weight: 600",
    "mixed": "color: #8A93A0; font-weight: 600",
}


@st.cache_resource(show_spinner="Loading models. This only happens once.")
def load_engine():
    return SentimentEngine()


engine = load_engine()


# ---------------------------------------------------------------------------
# Dataset helpers
# ---------------------------------------------------------------------------
def _detect_text_column(df: pd.DataFrame):
    """Pick the column most likely to hold the review text."""
    for hint in TEXT_COLUMN_HINTS:
        for col in df.columns:
            if hint in str(col).lower():
                return col

    text_cols = [
        c for c in df.columns
        if df[c].dtype == object or str(df[c].dtype).startswith("string")
    ]
    if not text_cols:
        return None
    return max(text_cols, key=lambda c: df[c].astype(str).str.len().mean())


def _load_texts(uploaded_file):
    """Returns (list_of_texts, short_description_of_source). Raises ValueError
    with a user-facing message if the file can't be read."""
    is_pdf = uploaded_file.name.lower().endswith(".pdf")

    try:
        df = extract_text_from_file(uploaded_file)
    except ValueError:
        raise  # extractors.py already words these for the user
    except Exception:
        raise ValueError(
            "This file couldn't be read. Check that it isn't empty, scanned "
            "or password-protected, then upload it again."
        )

    if df is None or df.empty:
        raise ValueError("No text was found in this file.")

    column = _detect_text_column(df)
    if column is None:
        raise ValueError(
            "No text column found. Add a column with the reviews or "
            "comments, for example one named 'review'."
        )

    series = df[column].dropna().astype(str).str.strip()
    texts = [t for t in series if t]
    if not texts:
        raise ValueError("No text was found in this file.")

    source = "lines of text in the PDF" if is_pdf else f"column '{column}'"
    return texts, source


def _analyze_texts(texts):
    """Runs both models on every text and returns one row per text."""
    rows = []
    total = len(texts)
    progress = st.progress(0.0, text="Analyzing")

    for i, text in enumerate(texts, start=1):
        v_sent, v_comp, _, _ = engine.analyze_vader(text)
        d_sent, _, d_scores, _ = engine.analyze_distilbert(text)
        d_signed = d_scores.get("positive", 0.0) - d_scores.get("negative", 0.0)
        verdict = v_sent.capitalize() if v_sent == d_sent else "Mixed"

        rows.append(
            {
                "Text": text,
                "Verdict": verdict,
                "VADER": v_sent.capitalize(),
                "VADER score": v_comp,
                "DistilBERT": d_sent.capitalize(),
                "DistilBERT score": d_signed,
            }
        )
        if i % 5 == 0 or i == total:
            progress.progress(i / total, text=f"Analyzed {i} of {total}")

    progress.empty()
    return pd.DataFrame(rows)


def _colour_label(value):
    return VERDICT_STYLES.get(str(value).lower(), "")


def _style_labels(df: pd.DataFrame):
    styler = df.style.format(
        {"VADER score": "{:+.2f}", "DistilBERT score": "{:+.2f}"}
    )
    apply = getattr(styler, "map", None) or styler.applymap  # pandas 2.1+ / older
    return apply(_colour_label, subset=["Verdict", "VADER", "DistilBERT"])


def _render_dataset_results(result: dict):
    df = result["df"]
    counts = df["Verdict"].value_counts()

    st.markdown(
        build_summary_strip(
            counts.get("Positive", 0),
            counts.get("Neutral", 0),
            counts.get("Negative", 0),
        ),
        unsafe_allow_html=True,
    )

    notes = [f"Read from {result['source']}."]
    mixed = int(counts.get("Mixed", 0))
    if mixed:
        notes.append(f"The models disagree on {mixed} of {len(df)} rows (marked Mixed).")
    if result["truncated"]:
        notes.append(
            f"Only the first {MAX_ROWS:,} of {result['total']:,} rows were analyzed."
        )
    st.caption(" ".join(notes))

    st.dataframe(_style_labels(df), hide_index=True, width="stretch")

    st.download_button(
        "Download results",
        data=df.to_csv(index=False).encode("utf-8"),
        file_name="analyx_results.csv",
        mime="text/csv",
    )


# ---------------------------------------------------------------------------
# Page flow
# ---------------------------------------------------------------------------
inputs = render_input_section()

# Single text
if inputs["analyze_text_btn"]:
    text = inputs["text_input"].strip()
    if not text:
        st.info("Paste some text above to see the result.")
    else:
        st.session_state.pop("dataset_results", None)
        with st.spinner("Analyzing"):
            v_sent, v_comp, _, v_reason = engine.analyze_vader(text)
            d_sent, _, d_scores, d_reason = engine.analyze_distilbert(text)

        render_single_text_results(
            v_sent, v_comp, v_reason, d_sent, d_scores, d_reason, text=text
        )

# Dataset
if inputs["process_file_btn"] and inputs["uploaded_file"] is not None:
    try:
        texts, source = _load_texts(inputs["uploaded_file"])
    except ValueError as error:
        st.session_state.pop("dataset_results", None)
        st.error(str(error))
    else:
        total = len(texts)
        df = _analyze_texts(texts[:MAX_ROWS])
        st.session_state["dataset_results"] = {
            "df": df,
            "source": source,
            "total": total,
            "truncated": total > MAX_ROWS,
        }

# Dataset results live in session state so they survive the rerun that the
# download button triggers.
if "dataset_results" in st.session_state:
    _render_dataset_results(st.session_state["dataset_results"])