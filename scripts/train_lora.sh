#!/usr/bin/env bash
set -euo pipefail

# Run from the repository root on a CUDA machine with sufficient GPU memory.
python scripts/prepare_dataset.py

if ! command -v swift >/dev/null 2>&1; then
  echo "ms-swift is not installed. Install requirements first: pip install -r requirements.txt"
  exit 1
fi

swift sft \
  --model Qwen/Qwen3-4B-Instruct-2507 \
  --tuner_type lora \
  --dataset prepared/train.jsonl \
  --val_dataset prepared/val.jsonl \
  --torch_dtype bfloat16 \
  --num_train_epochs 2 \
  --per_device_train_batch_size 1 \
  --per_device_eval_batch_size 1 \
  --learning_rate 1e-4 \
  --lora_rank 8 \
  --lora_alpha 32 \
  --target_modules all-linear \
  --gradient_accumulation_steps 8 \
  --eval_steps 10 \
  --save_steps 10 \
  --save_total_limit 2 \
  --logging_steps 1 \
  --max_length 1024 \
  --output_dir output/pixai-qwen3-lora \
  --warmup_ratio 0.05 \
  --dataloader_num_workers 2
