import streamlit as st

_CSS = """
<style>
    @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,700;12..96,800&family=IBM+Plex+Sans:wght@400;500;600&display=swap');

    /* ---------- Design tokens ---------- */
    :root {
        --ink: #14181F;
        --ink-soft: #4A5360;
        --chalk: #F3F5F7;
        --paper: #FFFFFF;
        --rule: #D5DAE0;
        --negative: #D9503F;
        --neutral: #8A93A0;
        --positive: #0F9D7A;
        --font-display: 'Bricolage Grotesque', 'Segoe UI', sans-serif;
        --font-body: 'IBM Plex Sans', 'Segoe UI', sans-serif;
    }

    /* ---------- Base ---------- */
    .stApp {
        background-color: var(--chalk);
        color: var(--ink);
        font-family: var(--font-body);
    }
    .stApp button, .stApp textarea, .stApp input {
        font-family: var(--font-body);
    }
    .block-container {
        max-width: 860px;
        padding-top: 4.5rem;
        padding-bottom: 4rem;
    }
    footer { visibility: hidden; }

    /* ---------- Header ---------- */
    .stApp .ax-header {
        padding: 0 0 1.25rem;
        border-bottom: 1px solid var(--rule);
        margin-bottom: 1rem;
    }
    .stApp .ax-wordmark {
        font-family: var(--font-display);
        font-size: 1.75rem;
        font-weight: 700;
        letter-spacing: -0.02em;
        color: var(--ink);
        margin: 0;
        padding: 0;
    }
    .stApp .ax-subtitle {
        font-size: 0.95rem;
        color: var(--ink-soft);
        margin: 0.25rem 0 0;
        max-width: 80ch;
    }

    /* ---------- Tabs ---------- */
    .stApp [data-baseweb="tab"] {
        font-family: var(--font-body);
        font-weight: 500;
        color: var(--ink-soft);
    }
    .stApp [data-baseweb="tab"][aria-selected="true"] {
        color: var(--ink);
    }
    .stApp [data-baseweb="tab-highlight"] {
        background-color: var(--ink);
    }

    /* ---------- Text area ---------- */
    .stApp textarea {
        background: var(--paper);
        color: var(--ink);
        border: 1px solid var(--rule);
        border-radius: 6px;
        font-size: 1rem;
        line-height: 1.6;
    }
    .stApp textarea::placeholder {
        color: #6B7480;
        opacity: 1;
    }
    .stApp textarea:focus {
        border-color: var(--ink);
        box-shadow: 0 0 0 1px var(--ink);
    }

    /* ---------- Buttons ---------- */
    .stApp button[kind="primary"] {
        background: var(--ink);
        border: 1px solid var(--ink);
        color: #FFFFFF;
        border-radius: 6px;
        font-weight: 500;
    }
    .stApp button[kind="primary"]:hover {
        background: #2A313B;
        border-color: #2A313B;
        color: #FFFFFF;
    }
    .stApp button:focus-visible {
        outline: 2px solid var(--ink);
        outline-offset: 2px;
    }

    /* Example chips (st.button with key "example_*") */
    .stApp [class*="st-key-example_"] button {
        font-size: 0.85rem;
        padding: 0.25rem 0.6rem;
        min-height: 0;
        border-radius: 999px;
        border: 1px solid var(--rule);
        background: transparent;
        color: var(--ink);
    }
    .stApp [class*="st-key-example_"] button:hover {
        border-color: var(--ink);
        background: transparent;
    }

    /* ---------- Verdict ---------- */
    .ax-result { animation: ax-in 220ms ease-out; }
    .ax-verdict-row {
        display: flex;
        align-items: baseline;
        gap: 1rem;
        flex-wrap: wrap;
        margin: 1.25rem 0 0.5rem;
    }
    .stApp .ax-verdict {
        font-family: var(--font-display);
        font-size: clamp(2.75rem, 8vw, 4.5rem);
        font-weight: 800;
        letter-spacing: -0.03em;
        line-height: 1;
        margin: 0;
        padding: 0;
    }
    .stApp .ax-verdict--positive { color: var(--positive); }
    .stApp .ax-verdict--negative { color: var(--negative); }
    .stApp .ax-verdict--neutral  { color: var(--neutral); }
    .ax-agreement {
        color: var(--ink-soft);
        font-size: 0.95rem;
        margin: 0;
    }

    /* ---------- Highlighted text ---------- */
    .ax-text {
        font-size: 1.05rem;
        line-height: 1.7;
        max-width: 70ch;
        margin: 0.5rem 0 1.5rem;
    }
    .ax-hl {
        color: inherit;
        border-radius: 3px;
        padding: 0 0.15em;
    }
    .ax-hl--pos { background: rgba(15, 157, 122, 0.18); }
    .ax-hl--neg { background: rgba(217, 80, 63, 0.18); }

    /* ---------- Shared sentiment scale ---------- */
    .ax-scale {
        position: relative;
        height: 5.5rem;
        margin: 0 3.5rem;
    }
    .ax-scale__track {
        position: absolute;
        left: 0;
        right: 0;
        top: 2.5rem;
        height: 6px;
        border-radius: 3px;
        background: linear-gradient(90deg, var(--negative), var(--neutral), var(--positive));
        opacity: 0.4;
    }
    .ax-marker {
        position: absolute;
        top: 1.75rem;
        width: 2px;
        height: 1.5rem;
        background: var(--ink);
        transform: translateX(-50%);
    }
    .ax-marker span {
        position: absolute;
        left: 50%;
        transform: translateX(-50%);
        white-space: nowrap;
        font-size: 0.8rem;
        font-variant-numeric: tabular-nums;
    }
    .ax-marker--top span    { bottom: 100%; margin-bottom: 0.25rem; }
    .ax-marker--bottom span { top: 100%;    margin-top: 0.25rem; }
    .ax-scale__ends {
        display: flex;
        justify-content: space-between;
        margin: 0 3.5rem 1.75rem;
        font-size: 0.8rem;
        color: var(--ink-soft);
    }

    /* ---------- Dataset summary strip ---------- */
    .ax-summary {
        display: flex;
        gap: 2rem;
        flex-wrap: wrap;
        margin: 1.25rem 0;
        padding: 1rem 0;
        border-top: 1px solid var(--rule);
        border-bottom: 1px solid var(--rule);
    }
    .ax-summary__item { display: flex; flex-direction: column; }
    .ax-summary__count {
        font-family: var(--font-display);
        font-size: 2rem;
        font-weight: 700;
        line-height: 1.1;
    }
    .ax-summary__label { font-size: 0.85rem; color: var(--ink-soft); }
    .ax-summary__item--positive .ax-summary__count { color: var(--positive); }
    .ax-summary__item--neutral  .ax-summary__count { color: var(--neutral); }
    .ax-summary__item--negative .ax-summary__count { color: var(--negative); }

    /* ---------- Sentiment badges (for tables and dataset rows) ---------- */
    .badge-positive, .badge-negative, .badge-neutral {
        padding: 2px 10px;
        border-radius: 999px;
        font-weight: 500;
        font-size: 0.85rem;
    }
    .badge-positive { background: rgba(15, 157, 122, 0.12); color: #0A7A5E; }
    .badge-negative { background: rgba(217, 80, 63, 0.12);  color: #B03A2B; }
    .badge-neutral  { background: rgba(138, 147, 160, 0.16); color: var(--ink-soft); }

    /* ---------- Motion ---------- */
    @keyframes ax-in {
        from { opacity: 0; }
        to   { opacity: 1; }
    }
    @media (prefers-reduced-motion: reduce) {
        .ax-result { animation: none; }
    }

    /* ---------- Small screens ---------- */
    @media (max-width: 640px) {
        .ax-scale, .ax-scale__ends { margin-left: 2.75rem; margin-right: 2.75rem; }
        .block-container { padding-top: 1.5rem; }
    }
</style>
"""


def apply_custom_css():
    """Injects fonts, design tokens and component styles. Call once, near the top of app.py."""
    st.markdown(_CSS, unsafe_allow_html=True)