import json
import os
import unittest
from types import SimpleNamespace
from urllib.parse import parse_qs, urlsplit
from unittest.mock import patch

from fastapi.testclient import TestClient

import app
from analyx import api
from analyx import visualizations
from analyx.visualizations import build_highlighted_text


class StubEngine:
    def analyze_vader(self, text):
        return "positive", 0.8, {}, "Positive VADER result."

    def analyze_distilbert(self, text):
        return (
            "positive",
            0.9,
            {"positive": 0.9, "neutral": 0.05, "negative": 0.05},
            "Positive model result.",
        )


class YouTubeResponse:
    def __init__(self, payload):
        self.payload = payload

    def __enter__(self):
        return self

    def __exit__(self, *args):
        return False

    def read(self):
        return json.dumps(self.payload).encode()


class ApiTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app.app)

    def test_health_and_frontend_assets_are_served(self):
        self.assertEqual(self.client.get("/api/health").json(), {"status": "ok"})
        self.assertIn("AnalyX", self.client.get("/").text)
        self.assertEqual(self.client.get("/styles.css").status_code, 200)
        self.assertEqual(self.client.get("/app.js").status_code, 200)
        self.assertEqual(self.client.get("/assets/analyx-logo.jpg").status_code, 200)

    def test_highlighted_text_uses_supported_vader_negation_constants(self):
        with patch(
            "nltk.sentiment.vader.SentimentIntensityAnalyzer",
            return_value=SimpleNamespace(lexicon={"good": 1.9}),
        ):
            visualizations._vader_resources.cache_clear()
            try:
                highlighted = build_highlighted_text("This is not good.")
            finally:
                visualizations._vader_resources.cache_clear()

        self.assertIn('<mark class="ax-hl ax-hl--neg">good</mark>', highlighted)

    def test_supported_link_sources_are_detected(self):
        self.assertEqual(
            api._link_source("https://www.youtube.com/watch?v=abcdefghijk"),
            "YouTube",
        )
        self.assertEqual(
            api._link_source("https://www.instagram.com/p/post-id/"),
            "Instagram",
        )
        self.assertEqual(
            api._link_source("https://m.facebook.com/story.php?id=123"),
            "Facebook",
        )
        self.assertEqual(
            api._link_source("https://www.tiktok.com/@creator/video/123"),
            "TikTok",
        )
        self.assertEqual(
            api._link_source("https://www.amazon.co.uk/dp/product-id"),
            "Amazon",
        )
        for url in (
            "https://notyoutube.com/watch?v=abcdefghijk",
            "https://youtube.com:8080/watch?v=abcdefghijk",
            "http://127.0.0.1:8080/",
        ):
            with self.subTest(url=url), self.assertRaises(api.HTTPException):
                api._link_source(url)

    def test_youtube_video_ids_are_validated(self):
        self.assertEqual(
            api._youtube_video_id("https://www.youtube.com/watch?v=abcdefghijk"),
            "abcdefghijk",
        )
        self.assertEqual(
            api._youtube_video_id("https://youtu.be/abcdefghijk?t=10"),
            "abcdefghijk",
        )
        self.assertEqual(
            api._youtube_video_id("https://youtube.com/shorts/abcdefghijk"),
            "abcdefghijk",
        )
        with self.assertRaises(api.HTTPException):
            api._youtube_video_id("https://youtube.com/watch?v=invalid")

    def test_youtube_comment_fetch_follows_pages(self):
        pages = []

        def fake_urlopen(request, timeout):
            params = parse_qs(urlsplit(request).query)
            self.assertEqual(params["key"], ["test-key"])
            self.assertEqual(timeout, 15)
            pages.append(params)
            self.assertEqual(params["maxResults"], [str(101 - len(pages))])
            item = {
                "snippet": {
                    "topLevelComment": {
                        "snippet": {"textDisplay": f"Comment {len(pages)}"}
                    }
                }
            }
            payload = {"items": [item]}
            if len(pages) == 1:
                payload["nextPageToken"] = "next-page"
            return YouTubeResponse(payload)

        with patch.object(api, "urlopen", side_effect=fake_urlopen):
            comments, truncated = api._fetch_youtube_comments(
                "abcdefghijk", "test-key"
            )

        self.assertEqual(comments, ["Comment 1", "Comment 2"])
        self.assertFalse(truncated)
        self.assertEqual(pages[1]["pageToken"], ["next-page"])

    def test_youtube_comment_fetch_caps_results_at_100(self):
        requests = []

        def fake_urlopen(request, timeout):
            params = parse_qs(urlsplit(request).query)
            requests.append(params)
            items = [
                {
                    "snippet": {
                        "topLevelComment": {
                            "snippet": {"textDisplay": f"Comment {index}"}
                        }
                    }
                }
                for index in range(100)
            ]
            return YouTubeResponse(
                {"items": items, "nextPageToken": "more-comments"}
            )

        with patch.object(api, "urlopen", side_effect=fake_urlopen):
            comments, truncated = api._fetch_youtube_comments(
                "abcdefghijk", "test-key"
            )

        self.assertEqual(len(comments), 100)
        self.assertTrue(truncated)
        self.assertEqual(len(requests), 1)
        self.assertEqual(requests[0]["maxResults"], ["100"])

    def test_youtube_analysis_returns_sentiment_rows(self):
        with (
            patch.dict(os.environ, {"YOUTUBE_API_KEY": "test-key"}),
            patch.object(
                api,
                "_fetch_youtube_comments",
                return_value=(["Great video!"], False),
            ),
            patch.object(api, "_get_engine", return_value=StubEngine()),
        ):
            response = self.client.post(
                "/api/youtube/analyze",
                json={"url": "https://youtu.be/abcdefghijk"},
            )

        self.assertEqual(response.status_code, 200)
        result = response.json()
        self.assertEqual(result["total"], 1)
        self.assertTrue(result["is_link"])
        self.assertEqual(result["rows"][0]["DistilBERT"], "Positive")

    def test_generic_link_endpoint_analyzes_youtube(self):
        with (
            patch.dict(os.environ, {"YOUTUBE_API_KEY": "test-key"}),
            patch.object(
                api,
                "_fetch_youtube_comments",
                return_value=(["Useful review."], False),
            ),
            patch.object(api, "_get_engine", return_value=StubEngine()),
        ):
            response = self.client.post(
                "/api/analyze-link",
                json={"url": "https://youtu.be/abcdefghijk"},
            )

        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json()["is_link"])
        self.assertEqual(response.json()["total"], 1)

    def test_recognized_platforms_without_connectors_explain_limitation(self):
        for url, source in (
            ("https://www.instagram.com/p/example/", "Instagram"),
            ("https://www.facebook.com/example/posts/123", "Facebook"),
            ("https://www.tiktok.com/@example/video/123", "TikTok"),
            ("https://www.amazon.com/dp/example", "Amazon"),
        ):
            with self.subTest(source=source):
                response = self.client.post("/api/analyze-link", json={"url": url})
                self.assertEqual(response.status_code, 501)
                self.assertIn(source, response.json()["detail"])
                self.assertIn("approved server-side integration", response.json()["detail"])

    def test_unsupported_links_are_rejected_without_fetching_them(self):
        response = self.client.post(
            "/api/analyze-link",
            json={"url": "http://127.0.0.1/private"},
        )
        self.assertEqual(response.status_code, 422)
        self.assertIn("not supported yet", response.json()["detail"])

    def test_youtube_analysis_reports_missing_api_key(self):
        with patch.dict(os.environ, {"YOUTUBE_API_KEY": ""}):
            response = self.client.post(
                "/api/youtube/analyze",
                json={"url": "https://youtu.be/abcdefghijk"},
            )

        self.assertEqual(response.status_code, 503)
        self.assertIn("YOUTUBE_API_KEY", response.json()["detail"])


if __name__ == "__main__":
    unittest.main()
