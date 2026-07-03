#!/bin/sh
# Pulls the Qwen model into the Ollama container on first startup.
# CON-006: the system shall use Qwen or equivalent open-source LLMs.
set -e

MODEL="${LLM_MODEL:-qwen2.5:7b-instruct}"

echo "Starting Ollama server..."
ollama serve &
SERVER_PID=$!

echo "Waiting for Ollama to become available..."
until ollama list >/dev/null 2>&1; do
  sleep 1
done

echo "Pulling model: $MODEL"
ollama pull "$MODEL"

echo "Ollama ready with model $MODEL"
wait $SERVER_PID
