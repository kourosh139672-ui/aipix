# AIPix

AIPix is an experimental project for a Persian conversational assistant (PixAI Core) connected to a separate image-generation engine (ImageEngine).

## Repository layout

- `dataset/`: starter Persian conversation dataset
- `scripts/prepare_dataset.py`: validates, de-duplicates, and splits the JSONL dataset
- `scripts/train_lora.sh`: launches a Qwen3 LoRA supervised fine-tuning run
- `TRAINING.md`: setup, hardware notes, and training instructions

## Quick start

Review [TRAINING.md](TRAINING.md) before running any training command.

The current dataset is a small prototype. It must be expanded and evaluated before production use. Model weights and training checkpoints are not stored in Git.

## Project separation

PixAI Core handles conversation and intent interpretation. ImageEngine performs image generation through a separately configured API. The assistant must never report successful image generation until the connected service confirms it.
