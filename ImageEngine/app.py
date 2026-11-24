"""Provider-neutral ImageEngine gateway for AIPix.

The gateway deliberately keeps provider credentials on the server. It accepts
general image prompts and forwards them unchanged (apart from whitespace and
length validation) to an OpenAI-compatible image-generation endpoint.
"""
from __future__ import annotations

import os
from typing import Any, Optional

import httpx
from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel, Field, field_validator

app = FastAPI(title="AIPix ImageEngine", version="0.1.0")


class ImageRequest(BaseModel):
    prompt: str = Field(min_length=2, max_length=4000)
    size: str = "1024x1024"
    style: Optional[str] = Field(default=None, max_length=80)
    n: int = Field(default=1, ge=1, le=2)

    @field_validator("size")
    @classmethod
    def validate_size(cls, value: str) -> str:
        allowed = {"512x512", "768x768", "1024x1024", "1024x768", "768x1024"}
        if value not in allowed:
            raise ValueError(f"size must be one of: {', '.join(sorted(allowed))}")
        return value

    @field_validator("prompt")
    @classmethod
    def clean_prompt(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("prompt cannot be empty")
        return value


def _extract_images(payload: dict[str, Any]) -> list[dict[str, str]]:
    """Normalize common OpenAI-compatible and simple provider response shapes."""
    data = payload.get("data")
    if isinstance(data, list):
        images = []
        for item in data:
            if not isinstance(item, dict):
                continue
            url = item.get("url") or item.get("image_url")
            b64 = item.get("b64_json")
            if isinstance(url, str) and url:
                images.append({"url": url})
            elif isinstance(b64, str) and b64:
                images.append({"b64_json": b64})
        if images:
            return images

    url = payload.get("image_url") or payload.get("url")
    b64 = payload.get("b64_json")
    if isinstance(url, str) and url:
        return [{"url": url}]
    if isinstance(b64, str) and b64:
        return [{"b64_json": b64}]
    raise ValueError("Provider response did not contain a recognized image URL or base64 image")


@app.get("/health")
async def health() -> dict[str, Any]:
    configured = bool(os.getenv("IMAGE_PROVIDER_URL"))
    return {"ok": True, "service": "AIPix ImageEngine", "provider_configured": configured}


@app.post("/v1/images/generations")
async def generate_image(
    request: ImageRequest,
    authorization: Optional[str] = Header(default=None),
) -> dict[str, Any]:
    client_token = os.getenv("PIXAI_IMAGE_API_TOKEN", "").strip()
    if not client_token:
        raise HTTPException(status_code=503, detail="Server authentication is not configured")
    if authorization != f"Bearer {client_token}":
        raise HTTPException(status_code=401, detail="Invalid API token")

    provider_url = os.getenv("IMAGE_PROVIDER_URL", "").strip()
    if not provider_url.startswith("https://"):
        raise HTTPException(
            status_code=503,
            detail="Image provider is not configured. Set IMAGE_PROVIDER_URL to a trusted HTTPS endpoint.",
        )

    provider_token = os.getenv("IMAGE_PROVIDER_TOKEN", "").strip()
    timeout = float(os.getenv("IMAGE_PROVIDER_TIMEOUT", "180"))
    headers = {"Content-Type": "application/json"}
    if provider_token:
        headers["Authorization"] = f"Bearer {provider_token}"

    provider_request: dict[str, Any] = {
        "prompt": request.prompt,
        "size": request.size,
        "n": request.n,
    }
    if request.style:
        provider_request["style"] = request.style

    try:
        async with httpx.AsyncClient(timeout=timeout, follow_redirects=False) as client:
            response = await client.post(provider_url, headers=headers, json=provider_request)
            response.raise_for_status()
            payload = response.json()
        images = _extract_images(payload)
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="Image provider timed out")
    except httpx.HTTPStatusError as exc:
        detail = exc.response.text[:1000]
        raise HTTPException(status_code=502, detail=f"Image provider returned HTTP {exc.response.status_code}: {detail}")
    except (httpx.HTTPError, ValueError) as exc:
        raise HTTPException(status_code=502, detail=f"Image provider request failed: {exc}")
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Unexpected provider response: {exc}")

    return {"created": True, "data": images, "provider": "configured-image-provider"}
