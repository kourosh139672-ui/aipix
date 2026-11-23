# PixAI Core: first LoRA training run

## Current status

The repository contains a small Persian starter dataset. It is a prototype, not yet a production-quality training corpus. With only dozens of examples, a model can overfit or learn inconsistent behavior. Expand and review the data before relying on the adapter.

## Hardware and environment

- Use a Linux or WSL2 machine with a compatible NVIDIA GPU and CUDA-enabled PyTorch.
- The upstream ms-swift Qwen3 example reports about 13 GB GPU memory for Qwen3-4B-Instruct-2507 with LoRA on a single RTX 3090. Actual needs vary with software versions, sequence length, and settings.
- A phone or GitHub repository cannot run this training job.
- Model weights and training outputs are intentionally not committed to Git.

## Setup

Install a PyTorch version compatible with the machine's CUDA driver using the official PyTorch selector, then:

```bash
python -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
pip install -r requirements.txt
```

## Validate and split the data

From the repository root:

```bash
python scripts/prepare_dataset.py
```

This validates JSONL structure, removes exact duplicate conversations, and writes a deterministic 90/10 split to `prepared/train.jsonl` and `prepared/val.jsonl`. The split is generated locally and is not committed.

## Start LoRA fine-tuning

Only run this on a compatible CUDA machine after reviewing the dataset:

```bash
bash scripts/train_lora.sh
```

The script uses `Qwen/Qwen3-4B-Instruct-2507` and ms-swift's LoRA supervised fine-tuning workflow. Training checkpoints are written under `output/pixai-qwen3-lora`.

## After training

1. Inspect training and validation loss; do not assume a completed run means the model improved.
2. Test on new Persian prompts that were not in the training set.
3. Compare the base model and adapter on the same evaluation prompts.
4. Keep tool execution separate from model text generation. The model should request an ImageEngine action through a controlled application layer; it must not claim an image was generated until the service confirms success.
5. Do not publish API keys, private user data, model weights, or local checkpoints in this repository.

## Upstream references

- [Qwen3 training with ms-swift](https://github.com/QwenLM/Qwen3/blob/main/docs/source/training/ms_swift.md)
- [ms-swift quick start](https://github.com/modelscope/ms-swift)
- [ms-swift custom dataset format](https://github.com/modelscope/ms-swift/blob/main/docs/source_en/Customization/Custom-dataset.md)
