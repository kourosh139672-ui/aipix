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
