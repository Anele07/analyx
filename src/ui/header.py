import streamlit as st


def render_header():
    """Renders the wordmark and a one-line description of the tool."""
    st.markdown(
        """
        <header class="ax-header">
            <h1 class="ax-wordmark">AnalyX</h1>
            <p class="ax-subtitle">
                Find out whether a review or comment is positive, negative or
                neutral, checked by two models.
            </p>
        </header>
        """,
        unsafe_allow_html=True,
    )