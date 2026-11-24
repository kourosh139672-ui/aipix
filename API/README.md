# AIPix API contracts

PixAI Core and ImageEngine are separate services.

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

Currently available tool:

- `generate_image`: called by GLM-4.7-Flash when the user explicitly requests a new image. The Worker executes FLUX.2 Klein 4B and returns the generated image in `images[0].b64_json` alongside the assistant text.

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
