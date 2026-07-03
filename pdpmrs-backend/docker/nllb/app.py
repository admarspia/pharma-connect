"""
Thin HTTP wrapper around a local NLLB-200 model so the Node.js backend
can call it as a plain REST service (CON-007: the system shall use
NLLB or equivalent models for translation).

POST /translate  { "text": str, "source_lang": "eng_Latn", "target_lang": "amh_Ethi" }
-> { "translation": str }

Language codes follow the FLORES-200 convention used by NLLB.
"""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import torch
from transformers import AutoModelForSeq2SeqLM, AutoTokenizer

MODEL_NAME = "facebook/nllb-200-distilled-600M"

app = FastAPI(title="PDPMRS NLLB Translation Service")

device = "cuda" if torch.cuda.is_available() else "cpu"
tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
model = AutoModelForSeq2SeqLM.from_pretrained(MODEL_NAME).to(device)


class TranslateRequest(BaseModel):
    text: str
    source_lang: str
    target_lang: str


@app.get("/health")
def health():
    return {"status": "ok", "device": device}


@app.post("/translate")
def translate(req: TranslateRequest):
    if not req.text.strip():
        return {"translation": ""}

    try:
        tokenizer.src_lang = req.source_lang
        inputs = tokenizer(req.text, return_tensors="pt").to(device)
        target_id = tokenizer.convert_tokens_to_ids(req.target_lang)

        generated = model.generate(
            **inputs,
            forced_bos_token_id=target_id,
            max_length=512,
        )
        translation = tokenizer.batch_decode(generated, skip_special_tokens=True)[0]
        return {"translation": translation}
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Translation failed: {exc}")
