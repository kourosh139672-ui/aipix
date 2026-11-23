# PixAI Core training dataset

This folder contains the initial Persian seed dataset for PixAI Core.

## Files

- `train.jsonl`: one JSON object per line, using a `messages` array with `user` and `assistant` turns.

## Important

- These are starter examples for experimentation, not a complete or validated training corpus.
- Review and expand the examples before fine-tuning.
- Keep private, personal, or identifying information out of training data.
- Do not put model weights or other large binary files in this Git repository.
- The assistant must not claim that ImageEngine generated an image unless an actual connected image service confirms success.

## Next steps

1. Validate every JSONL line.
2. Add diverse, high-quality Persian conversations and tool-use examples.
3. Split training and evaluation data before fine-tuning.
4. Fine-tune a compatible Qwen model with a suitable LoRA/QLoRA workflow.
