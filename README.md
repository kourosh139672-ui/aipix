# AIPix

AIPix is an experimental project for a Persian conversational assistant (PixAI Core) connected to a separate image-generation engine (ImageEngine).

## Repository layout

- `dataset/`: starter Persian conversation dataset
- `scripts/prepare_dataset.py`: validates, de-duplicates, and splits the JSONL dataset
- `scripts/train_lora.sh`: launches a Qwen3 LoRA supervised fine-tuning run
- `TRAINING.md`: setup, hardware notes, and training instructions

## Quick start

Review [TRAINING.md](TRAINING.md) before running any training command.

The current dataset contains 59 starter conversations. It must be expanded and evaluated before production use. Model weights and training checkpoints are not stored in Git.

## Project separation

PixAI Core handles conversation and intent interpretation. ImageEngine performs image generation through a separately configured API. The assistant must never report successful image generation until the connected service confirms it.

## Google Colab prototype

Open the [PixAI API Colab notebook](colab/PixAI_API_Colab.ipynb) to run the conversational prototype. It supports a system persona and optional persistent chat history in the user's own Google Drive. The notebook also includes a provider-neutral ImageEngine HTTP adapter. The Colab ImageEngine notebook provides the image-generation endpoint; no provider credentials are committed to this repository.

This is an experimental notebook, not a continuously hosted public API. Colab runtime availability and GPU access are not guaranteed.


## ImageEngine status

The repository now includes a provider-neutral ImageEngine gateway in `ImageEngine/app.py`. It accepts general image prompts (people, animals, vehicles, products, anime, 3D, fantasy, architecture, and more); it is not restricted to nature scenes. The gateway still requires a real compatible image-provider endpoint and server-side credentials before it can generate images. No provider or unlimited free quota is falsely claimed.

Run its tests with:

```bash
python -m unittest discover -s tests
```


## Cloudflare AI runtime

The PixAI chat frontend now defaults to the Cloudflare Worker endpoint:

- Worker: `https://aipix-api.kourosh-1396-72.workers.dev`
- Health: `GET /health`
- Chat: `POST /v1/chat/completions`
- Image generation: `POST /v1/images/generations`

The Worker uses GLM-4.7-Flash for conversation and FLUX.2 Klein 4B for image generation through Workers AI. The chat model has a server-side `generate_image` function tool. When the model requests that tool, the Worker validates the prompt, runs the image model, and returns the generated image as `images[0].b64_json`. The frontend renders that image in the conversation.

The browser asks for the private API token at runtime and keeps it only in session storage. Do not commit the token to this repository. For a public production app, replace browser-held bearer tokens with a server-side session or an abuse-protected authentication flow.

This is tool orchestration through function calling and instructions, not a new fine-tune. The current live tool set contains image generation; additional tools should be added with explicit schemas, server-side validation, and UI handling.
