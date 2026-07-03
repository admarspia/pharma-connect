"""
Thin HTTP wrapper around PaddleOCR so the Node.js backend can call it
as a plain REST service (CON-005: the system shall use PaddleOCR for OCR).

POST /ocr  { "image_base64": "..." }
-> { "results": [ { "text": str, "confidence": float, "box": [[x,y]*4] } ] }
"""

import base64
import io

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from PIL import Image
import numpy as np
from paddleocr import PaddleOCR

app = FastAPI(title="PDPMRS PaddleOCR Service")

# lang="en" by default; multilingual prescriptions can pass lang via query
# param in a future iteration. use_angle_cls improves rotated document text.
ocr_engine = PaddleOCR(use_angle_cls=True, lang="en", show_log=False)


class OcrRequest(BaseModel):
    image_base64: str


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/ocr")
def run_ocr(req: OcrRequest):
    try:
        image_bytes = base64.b64decode(req.image_base64)
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        image_np = np.array(image)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Invalid image payload: {exc}")

    raw_result = ocr_engine.ocr(image_np, cls=True)

    results = []
    for page in raw_result or []:
        for box, (text, confidence) in page:
            results.append({"text": text, "confidence": float(confidence), "box": box})

    return {"results": results}
