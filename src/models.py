import nltk
from nltk.sentiment.vader import SentimentIntensityAnalyzer
from transformers import pipeline


class SentimentEngine:
    """Runs two sentiment models: VADER (rule-based) and DistilBERT (transformer)."""

    def __init__(self):
        # VADER lexicon (downloaded once, then cached by NLTK)
        nltk.download("vader_lexicon", quiet=True)
        self.vader = SentimentIntensityAnalyzer()

        # DistilBERT multilingual student model (3 classes: positive, neutral, negative).
        # top_k=None returns the score for every class. It replaces the deprecated
        # return_all_scores=True and gives the same output shape.
        self.distilbert = pipeline(
            "sentiment-analysis",
            model="lxyuan/distilbert-base-multilingual-cased-sentiments-student",
            top_k=None,
        )

    def analyze_vader(self, text):
        """Returns (sentiment, compound, raw_scores, reasoning).

        sentiment: "positive" | "neutral" | "negative" (lowercase)
        compound:  float from -1 to 1
        """
        scores = self.vader.polarity_scores(text)
        compound = scores["compound"]

        if compound >= 0.05:
            sentiment = "positive"
        elif compound <= -0.05:
            sentiment = "negative"
        else:
            sentiment = "neutral"

        reasoning = (
            f"Looks up each word in a sentiment dictionary. "
            f"Positive: {scores['pos']:.2f}, negative: {scores['neg']:.2f}, "
            f"overall score: {compound:+.2f}. English only."
        )
        return sentiment, compound, scores, reasoning

    def analyze_distilbert(self, text):
        """Returns (top_label, top_score, scores, reasoning).

        top_label: "positive" | "neutral" | "negative" (lowercase)
        top_score: float from 0 to 1
        scores:    {"positive": 0-1, "neutral": 0-1, "negative": 0-1}
        """
        # Truncate by tokens (not characters) so long texts never exceed the model limit
        raw_output = self.distilbert(text, truncation=True, max_length=512)

        # Unnest the list if HuggingFace returned [[{...}, {...}]]
        if isinstance(raw_output, list) and raw_output and isinstance(raw_output[0], list):
            results = raw_output[0]
        else:
            results = raw_output

        scores = {res["label"].lower(): res["score"] for res in results}

        top_label = max(scores, key=scores.get)
        top_score = scores[top_label]

        reasoning = (
            f"Reads the whole sentence in context. It is {top_score * 100:.1f}% "
            f"confident the text is {top_label}. Works in many languages."
        )
        return top_label, top_score, scores, reasoning