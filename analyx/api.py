from __future__ import annotations

import json
import logging
import os
import re
from functools import lru_cache
from io import BytesIO
from pathlib import Path
from typing import TYPE_CHECKING
from urllib.error import HTTPError, URLError
from urllib.parse import parse_qs, urlencode, urlsplit
from urllib.request import urlopen

if os.environ.get("VERCEL"):
    os.environ.setdefault("HF_HOME", "/tmp/huggingface")
    os.environ.setdefault("NLTK_DATA", "/tmp/nltk_data")

import pandas as pd
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field

from analyx.extractors import extract_text_from_file
from analyx.visualizations import build_highlighted_text

if TYPE_CHECKING:
    from analyx.models import SentimentEngine

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

BASE_DIR = Path(__file__).resolve().parent.parent
PUBLIC_DIR = BASE_DIR / "public"
MAX_ROWS = 2000
MAX_LINK_ITEMS = 100
MAX_UPLOAD_BYTES = 4 * 1024 * 1024
TEXT_COLUMN_HINTS = (
    "review", "comment", "feedback", "text", "message",
    "description", "body", "content",
)

app = FastAPI(title="AnalyX", description="Sentiment analysis for text and datasets.")


class AnalyzeRequest(BaseModel):
    text: str = Field(min_length=1, max_length=10_000)


class LinkAnalyzeRequest(BaseModel):
    url: str = Field(min_length=1, max_length=2048)


@lru_cache(maxsize=1)
def load_engine() -> SentimentEngine:
    from analyx.models import SentimentEngine

    return SentimentEngine()


@app.on_event("startup")
def warmup_models() -> None:
    """Load the sentiment engine once during startup to avoid the first-request cold start."""
    load_engine()


def _get_engine() -> SentimentEngine:
    try:
        return load_engine()
    except Exception as error:
        logger.exception("Unable to load the sentiment models")
        message = str(error)
        if "HF_TOKEN" in message or "Hugging Face inference request failed" in message:
            detail = (
                "The deployed model is not configured correctly. Add HF_TOKEN to "
                "your Vercel environment variables and redeploy."
            )
        else:
            detail = "The sentiment models could not be loaded. Please try again later."
        raise HTTPException(status_code=503, detail=detail) from error


def _analyze_text(
    text: str, engine: SentimentEngine, include_highlight: bool = False
) -> dict:
    vader_sentiment, vader_score, _, vader_reason = engine.analyze_vader(text)
    model_sentiment, model_confidence, model_scores, model_reason = (
        engine.analyze_distilbert(text)
    )
    signed_score = (
        model_scores.get("positive", 0.0) - model_scores.get("negative", 0.0)
    )
    verdict = (
        vader_sentiment.capitalize()
        if vader_sentiment == model_sentiment
        else "Mixed"
    )
    result = {
        "text": text,
        "verdict": verdict,
        "vader": {
            "sentiment": vader_sentiment,
            "score": vader_score,
            "reason": vader_reason,
        },
        "distilbert": {
            "sentiment": model_sentiment,
            "confidence": model_confidence,
            "scores": model_scores,
            "signed_score": signed_score,
            "reason": model_reason,
        },
    }
    if include_highlight:
        result["highlighted_text"] = build_highlighted_text(text)
    return result


def _detect_text_column(df: pd.DataFrame):
    for hint in TEXT_COLUMN_HINTS:
        for column in df.columns:
            if hint in str(column).lower():
                return column

    text_columns = [
        column
        for column in df.columns
        if df[column].dtype == object or str(df[column].dtype).startswith("string")
    ]
    if not text_columns:
        return None
    return max(text_columns, key=lambda column: df[column].astype(str).str.len().mean())


def _load_texts(file_bytes: bytes, filename: str):
    try:
        df = extract_text_from_file(BytesIO(file_bytes), filename)
    except ValueError:
        raise
    except Exception as error:
        logger.exception("Unable to read uploaded dataset %s", filename)
        raise ValueError(
            "This file couldn't be read. Check that it isn't empty, scanned "
            "or password-protected, then upload it again."
        ) from error

    if df is None or df.empty:
        raise ValueError("No text was found in this file.")

    column = _detect_text_column(df)
    if column is None:
        raise ValueError(
            "No text column found. Add a column with the reviews or comments, "
            "for example one named 'review'."
        )

    series = df[column].dropna().astype(str).str.strip()
    texts = [text for text in series if text]
    if not texts:
        raise ValueError("No text was found in this file.")

    source = "lines of text in the PDF" if filename.lower().endswith(".pdf") else (
        f"column '{column}'"
    )
    return texts, source


def _youtube_video_id(url: str) -> str:
    try:
        parsed = urlsplit(url.strip())
        port = parsed.port
    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail="Enter a valid YouTube video URL.",
        ) from error
    hostname = (parsed.hostname or "").lower()
    if (
        parsed.scheme not in {"http", "https"}
        or port is not None
        or hostname not in {
            "youtube.com",
            "www.youtube.com",
            "m.youtube.com",
            "youtu.be",
        }
    ):
        raise HTTPException(
            status_code=400,
            detail="Enter a valid YouTube video URL.",
        )

    video_id = ""
    if hostname == "youtu.be":
        video_id = parsed.path.strip("/").split("/", 1)[0]
    else:
        video_id = parse_qs(parsed.query).get("v", [""])[0]
        if not video_id:
            match = re.match(r"^/(?:shorts|live|embed)/([^/]+)", parsed.path)
            if match:
                video_id = match.group(1)

    if not re.fullmatch(r"[A-Za-z0-9_-]{11}", video_id):
        raise HTTPException(
            status_code=400,
            detail="The YouTube URL must point to a video.",
        )
    return video_id


def _link_source(url: str) -> str:
    try:
        parsed = urlsplit(url.strip())
        port = parsed.port
    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail="Enter a valid public post or product-review URL.",
        ) from error

    hostname = (parsed.hostname or "").lower()
    if (
        parsed.scheme not in {"http", "https"}
        or port is not None
        or parsed.username is not None
        or parsed.password is not None
    ):
        raise HTTPException(
            status_code=400,
            detail="Enter a public HTTP or HTTPS post or product-review URL.",
        )

    host_sources = {
        "youtube.com": "YouTube",
        "www.youtube.com": "YouTube",
        "m.youtube.com": "YouTube",
        "youtu.be": "YouTube",
        "instagram.com": "Instagram",
        "www.instagram.com": "Instagram",
        "facebook.com": "Facebook",
        "www.facebook.com": "Facebook",
        "m.facebook.com": "Facebook",
        "fb.watch": "Facebook",
        "tiktok.com": "TikTok",
        "www.tiktok.com": "TikTok",
        "vm.tiktok.com": "TikTok",
        "amzn.to": "Amazon",
        "amzn.eu": "Amazon",
    }
    if hostname in host_sources:
        return host_sources[hostname]

    amazon_domains = {
        "amazon.com",
        "amazon.co.uk",
        "amazon.ca",
        "amazon.com.au",
        "amazon.de",
        "amazon.fr",
        "amazon.it",
        "amazon.es",
        "amazon.co.jp",
        "amazon.in",
        "amazon.com.br",
        "amazon.com.mx",
        "amazon.nl",
        "amazon.pl",
        "amazon.se",
        "amazon.sg",
        "amazon.ae",
        "amazon.sa",
        "amazon.com.tr",
    }
    if any(hostname in {domain, f"www.{domain}"} for domain in amazon_domains):
        return "Amazon"

    raise HTTPException(
        status_code=422,
        detail=(
            "This link's platform is not supported yet. Try a YouTube, "
            "Instagram, Facebook, TikTok, or Amazon link, or import an "
            "exported CSV or Excel file."
        ),
    )


def _youtube_api_failure(error: HTTPError) -> HTTPException:
    try:
        payload = json.loads(error.read())
    except (json.JSONDecodeError, UnicodeDecodeError):
        payload = {}

    if not isinstance(payload, dict):
        payload = {}
    api_error = payload.get("error", {})
    errors = api_error.get("errors", []) if isinstance(api_error, dict) else []
    reason = (
        errors[0].get("reason", "")
        if errors and isinstance(errors[0], dict)
        else ""
    )
    logger.warning("YouTube API request failed with status %s (%s)", error.code, reason)

    if reason == "commentsDisabled":
        return HTTPException(
            status_code=400,
            detail="Comments are disabled for this YouTube video.",
        )
    if reason in {"videoNotFound", "videoNotFoundOrNotAccessible"}:
        return HTTPException(
            status_code=404,
            detail="The video was not found or its comments are not publicly accessible.",
        )
    if reason in {"quotaExceeded", "dailyLimitExceeded", "keyInvalid", "forbidden"}:
        return HTTPException(
            status_code=503,
            detail="YouTube comment retrieval is temporarily unavailable. Check the API configuration and quota.",
        )
    return HTTPException(
        status_code=502,
        detail="YouTube could not return comments for this video.",
    )


def _fetch_youtube_comments(video_id: str, api_key: str) -> tuple[list[str], bool]:
    comments = []
    page_token = ""
    has_more = False

    while len(comments) < MAX_LINK_ITEMS:
        params = {
            "part": "snippet",
            "videoId": video_id,
            "maxResults": min(100, MAX_LINK_ITEMS - len(comments)),
            "textFormat": "plainText",
            "key": api_key,
        }
        if page_token:
            params["pageToken"] = page_token
        request = f"https://www.googleapis.com/youtube/v3/commentThreads?{urlencode(params)}"

        try:
            with urlopen(request, timeout=15) as response:
                payload = json.loads(response.read())
        except HTTPError as error:
            raise _youtube_api_failure(error) from error
        except URLError as error:
            logger.warning("Unable to reach the YouTube API")
            raise HTTPException(
                status_code=503,
                detail="YouTube could not be reached. Please try again later.",
            ) from error
        except (json.JSONDecodeError, UnicodeDecodeError) as error:
            logger.exception("YouTube returned an invalid comment response")
            raise HTTPException(
                status_code=502,
                detail="YouTube returned an invalid response.",
            ) from error
        except TimeoutError as error:
            logger.warning("The YouTube API request timed out")
            raise HTTPException(
                status_code=503,
                detail="YouTube took too long to respond. Please try again later.",
            ) from error

        if not isinstance(payload, dict):
            raise HTTPException(
                status_code=502,
                detail="YouTube returned an invalid response.",
            )
        items = payload.get("items", [])
        if not isinstance(items, list):
            raise HTTPException(
                status_code=502,
                detail="YouTube returned an invalid comments list.",
            )

        for item in items:
            try:
                text = item["snippet"]["topLevelComment"]["snippet"]["textDisplay"]
            except (KeyError, TypeError):
                logger.warning("Skipping a malformed YouTube comment item")
                continue
            if isinstance(text, str) and text.strip():
                comments.append(text.strip())

        page_token = payload.get("nextPageToken", "")
        if not isinstance(page_token, str):
            raise HTTPException(
                status_code=502,
                detail="YouTube returned an invalid pagination token.",
            )
        if not page_token:
            break
        if len(comments) >= MAX_LINK_ITEMS:
            has_more = True

    return comments, has_more


@app.get("/", include_in_schema=False)
def home():
    return FileResponse(PUBLIC_DIR / "index.html")


@app.get("/styles.css", include_in_schema=False)
def styles():
    return FileResponse(PUBLIC_DIR / "styles.css", media_type="text/css")


@app.get("/app.js", include_in_schema=False)
def javascript():
    return FileResponse(PUBLIC_DIR / "app.js", media_type="text/javascript")


@app.get("/assets/analyx-logo.jpg", include_in_schema=False)
def logo():
    return FileResponse(PUBLIC_DIR / "assets" / "analyx-logo.jpg", media_type="image/jpeg")


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.post("/api/analyze")
def analyze(request: AnalyzeRequest):
    text = request.text.strip()
    if not text:
        raise HTTPException(status_code=422, detail="Enter some text to analyze.")
    return _analyze_text(text, _get_engine(), include_highlight=True)


@app.post("/api/analyze-file")
def analyze_file(file: UploadFile = File(...)):
    filename = file.filename or ""
    if not filename.lower().endswith((".csv", ".xlsx", ".pdf")):
        raise HTTPException(
            status_code=400,
            detail="Unsupported file format. Upload a CSV, Excel, or PDF file.",
        )

    file_bytes = file.file.read(MAX_UPLOAD_BYTES + 1)
    if len(file_bytes) > MAX_UPLOAD_BYTES:
        raise HTTPException(
            status_code=413,
            detail="Files must be 4 MB or smaller on this deployment.",
        )

    try:
        texts, source = _load_texts(file_bytes, filename)
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error

    engine = _get_engine()
    rows = []
    for text in texts[:MAX_ROWS]:
        result = _analyze_text(text, engine)
        rows.append(
            {
                "Text": result["text"],
                "Verdict": result["verdict"],
                "VADER": result["vader"]["sentiment"].capitalize(),
                "VADER score": result["vader"]["score"],
                "DistilBERT": result["distilbert"]["sentiment"].capitalize(),
                "DistilBERT score": result["distilbert"]["signed_score"],
            }
        )

    return {
        "rows": rows,
        "source": source,
        "total": len(texts),
        "truncated": len(texts) > MAX_ROWS,
    }


def _analyze_youtube_url(url: str) -> dict:
    video_id = _youtube_video_id(url)
    api_key = os.environ.get("YOUTUBE_API_KEY", "").strip()
    if not api_key:
        raise HTTPException(
            status_code=503,
            detail="YouTube analysis is not configured. Set the YOUTUBE_API_KEY environment variable.",
        )

    comments, truncated = _fetch_youtube_comments(video_id, api_key)
    if not comments:
        raise HTTPException(
            status_code=404,
            detail="No public top-level comments were found for this video.",
        )

    engine = _get_engine()
    rows = []
    for text in comments:
        result = _analyze_text(text, engine)
        rows.append(
            {
                "Text": result["text"],
                "Verdict": result["verdict"],
                "VADER": result["vader"]["sentiment"].capitalize(),
                "VADER score": result["vader"]["score"],
                "DistilBERT": result["distilbert"]["sentiment"].capitalize(),
                "DistilBERT score": result["distilbert"]["signed_score"],
            }
        )

    return {
        "rows": rows,
        "source": f"YouTube video {video_id} (public top-level comments)",
        "total": len(comments),
        "truncated": truncated,
        "is_link": True,
    }


@app.post("/api/analyze-link")
def analyze_link(request: LinkAnalyzeRequest):
    source = _link_source(request.url)
    if source != "YouTube":
        raise HTTPException(
            status_code=501,
            detail=(
                f"{source} links are recognized, but comment or review retrieval "
                "is not connected yet. Each platform requires an approved server-side "
                "integration. Try a YouTube link or import an exported CSV or Excel file."
            ),
        )
    return _analyze_youtube_url(request.url)


@app.post("/api/youtube/analyze", include_in_schema=False)
def analyze_youtube(request: LinkAnalyzeRequest):
    return _analyze_youtube_url(request.url)
