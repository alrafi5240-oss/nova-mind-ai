"""
Example tests for lite mode implementation.

To run these tests:
    pytest test_lite_mode_example.py -v

Note: This is an example. Adjust based on your actual test setup.
"""

import asyncio
import os
from unittest.mock import MagicMock, patch

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

# Assuming the app is set up in src.main
from src.main import app
from src.routers.versioned import ChatRequest, run_chat


@pytest.fixture
def client():
    """Create a test client for the FastAPI app."""
    return TestClient(app)


class TestLiteModeBasic:
    """Test lite mode basic functionality."""

    @patch.dict(os.environ, {"LLM_PROVIDER": "lite"})
    @patch("src.feature_flags.get_feature_flags")
    def test_lite_mode_explicit(self, mock_flags):
        """Test explicit lite mode returns expected format."""
        from src.feature_flags import FeatureFlags

        mock_flags.return_value = FeatureFlags(
            voice_transcription=True,
            gpt4_model=False,
            premium_ui=True,
            llm_provider="lite",
        )

        # Run lite mode chat
        request = ChatRequest(message="Hello, who are you?", conversation_id="test")
        response = asyncio.run(run_chat(request, "v1"))

        # Verify response
        assert "Lite Mode" in response.reply
        assert "Hello, who are you?" in response.reply
        assert "test" in response.reply


class TestOpenAIModeWithFallback:
    """Test OpenAI mode with fallback to lite when key is missing."""

    @patch.dict(os.environ, {"LLM_PROVIDER": "openai"})
    @patch("src.routers.versioned.get_openai_client")
    @patch("src.feature_flags.get_feature_flags")
    def test_missing_api_key_fallback(self, mock_flags, mock_client):
        """Test fallback to lite mode when API key is missing."""
        from src.feature_flags import FeatureFlags

        mock_flags.return_value = FeatureFlags(
            voice_transcription=True,
            gpt4_model=False,
            premium_ui=True,
            llm_provider="openai",
        )
        mock_client.return_value = None  # Simulate missing API key

        # Run chat
        request = ChatRequest(message="Test message", conversation_id="default")
        response = asyncio.run(run_chat(request, "v1"))

        # Verify fallback to lite mode
        assert "Lite Mode" in response.reply
        assert "Test message" in response.reply
        assert response.status_code != 503  # Not an error


class TestOpenAIModeProduction:
    """Test OpenAI mode with valid API key."""

    @patch.dict(os.environ, {"LLM_PROVIDER": "openai", "OPENAI_API_KEY": "sk_test"})
    @patch("src.routers.versioned.process_turn")
    @patch("src.routers.versioned.get_openai_client")
    @patch("src.feature_flags.get_feature_flags")
    def test_with_valid_api_key(self, mock_flags, mock_client, mock_process):
        """Test normal OpenAI operation with valid API key."""
        from src.feature_flags import FeatureFlags

        mock_flags.return_value = FeatureFlags(
            voice_transcription=True,
            gpt4_model=False,
            premium_ui=True,
            llm_provider="openai",
        )
        mock_client.return_value = MagicMock()  # Valid client
        mock_process.return_value = "This is a full OpenAI response"

        # Run chat
        request = ChatRequest(message="Hello", conversation_id="default")
        response = asyncio.run(run_chat(request, "v1"))

        # Verify OpenAI was called
        mock_process.assert_called_once()
        assert "This is a full OpenAI response" in response.reply
        assert "Lite Mode" not in response.reply


class TestErrorHandling:
    """Test error handling is unchanged."""

    @patch.dict(os.environ, {"LLM_PROVIDER": "openai"})
    @patch("src.routers.versioned.process_turn")
    @patch("src.routers.versioned.get_openai_client")
    @patch("src.feature_flags.get_feature_flags")
    def test_empty_message_validation(self, mock_flags, mock_client, mock_process):
        """Test empty message still returns 400 error."""
        from src.feature_flags import FeatureFlags

        mock_flags.return_value = FeatureFlags(
            voice_transcription=True,
            gpt4_model=False,
            premium_ui=True,
            llm_provider="openai",
        )

        # Run with empty message
        request = ChatRequest(message="  ", conversation_id="default")
        response = asyncio.run(run_chat(request, "v1"))

        # Verify 400 error
        assert response.status_code == 400
        assert "invalid_request" in response.content.decode()


class TestConversationHistory:
    """Test conversation history works in both modes."""

    @patch.dict(os.environ, {"LLM_PROVIDER": "lite"})
    @patch("src.feature_flags.get_feature_flags")
    def test_history_stored_in_lite_mode(self, mock_flags):
        """Test messages are stored in history during lite mode."""
        from src.feature_flags import FeatureFlags
        from src.services.memory import store

        mock_flags.return_value = FeatureFlags(
            voice_transcription=True,
            gpt4_model=False,
            premium_ui=True,
            llm_provider="lite",
        )

        # Clear history
        store.reset("history_test")

        # Send messages
        request1 = ChatRequest(message="First message", conversation_id="history_test")
        request2 = ChatRequest(message="Second message", conversation_id="history_test")

        asyncio.run(run_chat(request1, "v1"))
        asyncio.run(run_chat(request2, "v1"))

        # Verify history
        history = store.snapshot("history_test")
        assert len(history) >= 2  # At least 2 exchanges
        assert any("First message" in str(h) for h in history)
        assert any("Second message" in str(h) for h in history)


# ============================================================================
# Integration Tests (require running server)
# ============================================================================


class TestHTTPIntegration:
    """Test via HTTP endpoints."""

    def test_lite_mode_http_endpoint(self, client):
        """Test lite mode via HTTP (requires server running)."""
        # This test assumes the server is running
        # Set LLM_PROVIDER=lite before starting the server

        response = client.post(
            "/v1/chat",
            json={"message": "Test message", "conversation_id": "http_test"},
        )

        assert response.status_code == 200
        data = response.json()
        assert "Lite Mode" in data.get("reply", "")

    def test_health_endpoint_works(self, client):
        """Test health endpoint (should work in all modes)."""
        response = client.get("/v1/health")
        assert response.status_code == 200


# ============================================================================
# Usage Examples
# ============================================================================

"""
RUNNING THESE TESTS:

1. Install pytest:
   pip install pytest pytest-asyncio

2. Run specific test:
   pytest test_lite_mode_example.py::TestLiteModeBasic::test_lite_mode_explicit -v

3. Run all tests:
   pytest test_lite_mode_example.py -v

4. Run with coverage:
   pytest test_lite_mode_example.py --cov=src --cov-report=html

ENVIRONMENT SETUP:

For integration tests, start server first:
   LLM_PROVIDER=lite uvicorn src.main:app --reload

Then run tests:
   pytest test_lite_mode_example.py::TestHTTPIntegration -v
"""
