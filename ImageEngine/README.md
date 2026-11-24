# AIPix ImageEngine

ImageEngine is a provider-neutral image-generation gateway. It does not hard-code a nature-only prompt or category. It forwards the user's full prompt to a configured image provider and returns the generated image URL or base64 payload.

## Supported prompt categories

Portraits, people, animals, vehicles, products, architecture, food, fantasy scenes, anime, cartoons, 3D renders, illustrations, logos, landscapes, and other permitted subjects/styles. The provider's own model capabilities and safety rules still apply.

## API

- `GET /health`
- `POST /v1/images/generations`

Example request:

```json
{
  "prompt": "A red vintage sports car in a rainy neon-lit city, cinematic photography",
  "size": "1024x1024",
  "style": "photorealistic"
}
```

## Configuration

Set these environment variables on the server (never commit credentials):

- `IMAGE_PROVIDER_URL`: full provider endpoint, usually an OpenAI-compatible `/v1/images/generations` URL.
- `IMAGE_PROVIDER_TOKEN`: provider token, if required.
- `PIXAI_IMAGE_API_TOKEN`: private token required by this gateway's clients.
- `IMAGE_PROVIDER_TIMEOUT`: optional timeout in seconds (default 180).

The gateway supports common response shapes: `data[0].url`, `data[0].b64_json`, `image_url`, `url`, and `b64_json`. Providers with a different schema need a small provider-specific response adapter.

## Run

```bash
pip install -r requirements.txt
uvicorn ImageEngine.app:app --host 0.0.0.0 --port 8080
```

No image provider is bundled or secretly activated. A real provider endpoint and, when required, its token must be configured before image generation can work. Free access and unlimited usage cannot be guaranteed by this adapter.
