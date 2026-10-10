import streamlit as st

EXAMPLES = {
    "Love it": "I love this product. It works exactly as described.",
    "Sarcasm": "Great, it broke in a day.",
    "Mixed": "The battery is excellent, but the screen scratches too easily.",
    "Complaint": "Support never replied and I still haven't got my refund.",
}


def _use_example(text: str):
    """Callback: put an example into the text box before the next rerun."""
    st.session_state["text_input"] = text


def render_input_section():
    """Renders the single-text and dataset input controls as two tabs."""
    single_tab, dataset_tab = st.tabs(["Single text", "Dataset"])

    with single_tab:
        text_input = st.text_area(
            "Text to analyze",
            key="text_input",
            placeholder="Paste a review or comment",
            height=140,
            label_visibility="collapsed",
        )

        analyze_text_btn = st.button("Analyze", type="primary")

        st.caption("Or try an example")
        chip_cols = st.columns(len(EXAMPLES))
        for col, (label, text) in zip(chip_cols, EXAMPLES.items()):
            col.button(
                label,
                key=f"example_{label}",
                on_click=_use_example,
                args=(text,),
                width="stretch",
            )

    with dataset_tab:
        st.caption("Upload a CSV, Excel or PDF file. The maximum size is 200 MB.")
        uploaded_file = st.file_uploader(
            "Upload a file",
            type=["csv", "xlsx", "pdf"],
            label_visibility="collapsed",
        )
        process_file_btn = st.button(
            "Process file",
            type="primary",
            disabled=uploaded_file is None,
        )

    return {
        "text_input": text_input,
        "analyze_text_btn": analyze_text_btn,
        "uploaded_file": uploaded_file,
        "process_file_btn": process_file_btn,
    }