# AIPix API contracts

PixAI Core, ImageEngine, VideoEngine, and MusicEngine are coordinated through one conversational interface.

## PixAI Core

The chat service uses an OpenAI-compatible chat-completions shape:

- `POST /v1/chat/completions`
- Request: `{ "messages": [{"role":"user","content":"سلام"}] }`
- Response: `choices[0].message.content`

The Colab notebook is a temporary development host, not a permanent public server.

## ImageEngine

- `GET /health`
- `POST /v1/images/generations`
- Request: `{ "prompt": "...", "size": "1024x1024", "style": "photorealistic" }`
- Response: `data[0].url` or `data[0].b64_json`

The app should only display an image as generated after the ImageEngine returns a successful response containing a usable image. Keep provider tokens on the server; never place them in a public GitHub repository or browser JavaScript.


## Tool use

The Cloudflare Worker exposes model-guided tool execution through the chat endpoint.

Currently available tools:

- `generate_image`: called by GLM-4.7-Flash when the user explicitly requests an image.
- `generate_music`: called when the user explicitly asks PixAI to compose or generate music.
- `web_search`: called when the user asks about current, recent, changing, or source-backed information. The Worker calls a provider-independent `runWebSearch(env, query)` adapter, sends results back to GLM-4.7-Flash, and returns HTTPS source links in `sources[]`. Search happens naturally in the normal chat, without a separate mode or button. The adapter is disabled by default (`WEB_SEARCH_PROVIDER=disabled`) so it cannot accidentally incur paid search charges. Set `WEB_SEARCH_PROVIDER=ceramic` only when the account owner intentionally enables a paid provider. Future providers can be added inside the adapter without changing PixAI Core or the frontend.

Current state: provider adapter implemented but disabled by default. No free full-web provider has been selected yet. Cloudflare lists Ceramic at $0.25 per 1,000 requests, so it must remain disabled unless explicitly enabled. See https://developers.cloudflare.com/web-search/providers/.

The browser renders an image only when the API returns image data. The assistant must not claim success when tool execution fails. Add future tools by defining a validated schema, implementing the server-side handler in the Worker, returning structured results, and adding any required UI renderer. Never execute arbitrary code or accept provider credentials from model-generated arguments.


## PixAI Code

- `POST /v1/code/completions`
- Provider model: `qwen3-coder-flash` (Alibaba Cloud Model Studio)
- Configure `QWEN_API_URL` as a Worker variable using the exact OpenAI-compatible base URL for the Model Studio workspace and region; configure `QWEN_API_KEY` as a Worker secret.
- The Worker proxies only validated chat messages to Qwen. It does not execute generated code or write to a repository.
- The frontend exposes a separate Code mode. Code mode is unavailable until both server-side settings are configured.
- Never put the provider key in browser JavaScript or GitHub.


### Multi-file project output
PixAI Code requests a consistent project tree and emits files using `### FILE: path/to/file.ext` followed by a fenced code block. The frontend extracts these blocks and offers each file as a separate download. Code is not executed automatically.


## PixAI VideoEngine 2D

- `POST /v1/videos/generations`
- Model: `lightricks/ltx-2-3-fast` through the Cloudflare Workers AI binding.
- Request: `{ "prompt": "A hand-drawn 2D animation...", "duration": 6, "resolution": "1280x720", "fps": 24, "generate_audio": false }`
- Optional image-to-video: add `image_uri` with an HTTPS URL reachable by the provider.
- Response: `{ "created": 0, "model": "...", "data": [{ "url": "https://...mp4" }] }` (timestamp shown as an example).
- Initial release accepts six-second clips and 720p landscape or portrait. Provider usage is billed by Cloudflare; this is not an unlimited free service.
- Keep the video model behind the Worker route so providers can be changed without rewriting the frontend. The frontend does not claim success unless it receives a valid HTTPS video URL.


## PixAI MusicEngine

- `POST /v1/music/generations`
- Provider: Stability AI Stable Audio 2.5 API.
- Request: `{ "prompt": "A calm instrumental piano piece", "duration": 30 }`
- Response: binary MP3 audio (`audio/mpeg`).
- Configure `STABILITY_API_KEY` as a Cloudflare Worker secret. Never put the provider key in browser JavaScript or GitHub.
- Each Stable Audio 2.5 API generation costs 20 credits. New API accounts start with 25 credits, enough for one generation only.
