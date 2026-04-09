"""Chat request/response schemas."""

from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    """User chat message request."""
    message: str = Field(..., min_length=1, max_length=10000, description="User message")
    conversation_id: str = Field(
        default="default",
        description="Conversation session ID"
    )


class ChatResponse(BaseModel):
    """Chat API response with conversation context."""
    reply: str = Field(..., description="AI assistant reply")
    conversation_id: str = Field(..., description="Conversation session ID")


class HealthResponse(BaseModel):
    """Health check response."""
    status: str = Field(default="ok", description="Service status")
    version: str = Field(..., description="Backend version")


class ResetResponse(BaseModel):
    """Conversation reset response."""
    ok: bool = Field(default=True, description="Operation success")
    conversation_id: str = Field(..., description="Reset conversation ID")


class ErrorResponse(BaseModel):
    """Standard error response."""
    error: str = Field(..., description="Error code")
    detail: str = Field(..., description="Error details")
