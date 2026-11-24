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

Open the [PixAI API Colab notebook](colab/PixAI_API_Colab.ipynb) to run the conversational prototype. It supports a system persona and optional persistent chat history in the user's own Google Drive. The notebook also includes a provider-neutral ImageEngine HTTP adapter. Image generation stays disabled until a real compatible endpoint (and optional token) is configured; no provider credentials are committed to this repository.

This is an experimental notebook, not a continuously hosted public API. Colab runtime availability and GPU access are not guaranteed.


## ImageEngine status

The repository now includes a provider-neutral ImageEngine gateway in `ImageEngine/app.py`. It accepts general image prompts (people, animals, vehicles, products, anime, 3D, fantasy, architecture, and more); it is not restricted to nature scenes. The gateway still requires a real compatible image-provider endpoint and server-side credentials before it can generate images. No provider or unlimited free quota is falsely claimed.

Run its tests with:

```bash
python -m unittest discover -s tests
```
