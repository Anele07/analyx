import json
import os
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

import nltk
from nltk.sentiment.vader import SentimentIntensityAnalyzer


MODEL_ID = "lxyuan/distilbert-base-multilingual-cased-sentiments-student"
INFERENCE_URL = f"https://router.huggingface.co/hf-inference/models/{MODEL_ID}"


class SentimentEngine:
    """Runs two sentiment models: VADER (rule-based) and DistilBERT (transformer)."""

    def __init__(self):
        # VADER lexicon (downloaded once, then cached by NLTK)
        nltk.download("vader_lexicon", quiet=True)
        self.vader = SentimentIntensityAnalyzer()

        self.huggingface_token = os.environ.get("HF_TOKEN", "").strip()
        self.distilbert = None
        if not os.environ.get("VERCEL"):
            from transformers import pipeline

            self.distilbert = pipeline(
                "sentiment-analysis",
                model=MODEL_ID,
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
        if os.environ.get("VERCEL"):
            headers = {"Content-Type": "application/json"}
            if self.huggingface_token:
                headers["Authorization"] = f"Bearer {self.huggingface_token}"
            request = Request(
                INFERENCE_URL,
                data=json.dumps(
                    {
                        "inputs": text,
                        "parameters": {"truncation": True, "max_length": 512},
                    }
                ).encode(),
                headers=headers,
                method="POST",
            )
            try:
                with urlopen(request, timeout=60) as response:
                    raw_output = json.loads(response.read())
            except (HTTPError, URLError) as error:
                raise RuntimeError(
                    "Hugging Face inference request failed."
                ) from error
        else:
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