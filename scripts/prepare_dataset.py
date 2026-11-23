#!/usr/bin/env python3
"""Validate PixAI JSONL conversations and create deterministic train/validation files."""
import argparse
import json
import random
from pathlib import Path

ALLOWED_ROLES = {"system", "user", "assistant"}

def load_rows(path: Path):
    rows = []
    seen = set()
    for line_no, raw in enumerate(path.read_text(encoding="utf-8").splitlines(), 1):
        if not raw.strip():
            continue
        try:
            item = json.loads(raw)
        except json.JSONDecodeError as exc:
            raise SystemExit(f"Invalid JSON at {path}:{line_no}: {exc}")
        messages = item.get("messages")
        if not isinstance(messages, list) or len(messages) < 2:
            raise SystemExit(f"{path}:{line_no}: 'messages' must be a list with at least 2 items")
        if messages[0].get("role") not in {"user", "system"}:
            raise SystemExit(f"{path}:{line_no}: conversation should start with user or system")
        if not any(m.get("role") == "user" for m in messages):
            raise SystemExit(f"{path}:{line_no}: missing user message")
        if not any(m.get("role") == "assistant" for m in messages):
            raise SystemExit(f"{path}:{line_no}: missing assistant response")
        for message in messages:
            if message.get("role") not in ALLOWED_ROLES or not isinstance(message.get("content"), str) or not message["content"].strip():
                raise SystemExit(f"{path}:{line_no}: invalid role or empty message content")
        key = json.dumps(messages, ensure_ascii=False, sort_keys=True)
        if key not in seen:
            rows.append(item)
            seen.add(key)
    if len(rows) < 10:
        raise SystemExit("At least 10 unique conversations are recommended before creating a split.")
    return rows

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", default="dataset/train.jsonl")
    parser.add_argument("--output-dir", default="prepared")
    parser.add_argument("--validation-ratio", type=float, default=0.1)
    parser.add_argument("--seed", type=int, default=42)
    args = parser.parse_args()
    if not 0.05 <= args.validation_ratio <= 0.3:
        raise SystemExit("--validation-ratio must be between 0.05 and 0.30")
    rows = load_rows(Path(args.input))
    random.Random(args.seed).shuffle(rows)
    val_count = max(1, round(len(rows) * args.validation_ratio))
    validation, training = rows[:val_count], rows[val_count:]
    out = Path(args.output_dir)
    out.mkdir(parents=True, exist_ok=True)
    for name, subset in (("train.jsonl", training), ("val.jsonl", validation)):
        (out / name).write_text(
            "".join(json.dumps(row, ensure_ascii=False) + "\n" for row in subset),
            encoding="utf-8",
        )
    print(f"Validated {len(rows)} unique conversations.")
    print(f"Training: {len(training)} | Validation: {len(validation)}")
    print(f"Files written to: {out.resolve()}")

if __name__ == "__main__":
    main()
