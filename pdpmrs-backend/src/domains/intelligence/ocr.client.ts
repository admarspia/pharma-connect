import axios from "axios";
import fs from "fs";
import { env } from "../../config/env";
import { logger } from "../../common/logger";
import { ApiError } from "../../common/ApiError";

export interface OcrLine {
  text: string;
  confidence: number;
  box: number[][]; // 4 points polygon
}

export interface OcrResult {
  fullText: string;
  lines: OcrLine[];
  meanConfidence: number;
}

/**
 * Calls the PaddleOCR serving wrapper (docker/paddleocr) with a base64
 * image and returns structured line-level OCR output.
 *
 * This is a real network call, not a mock. If the OCR service is
 * unreachable the caller is responsible for falling back to
 * AI-Limited Mode (see design doc section 6.3) rather than blocking
 * the upload flow.
 */
export async function runOcr(filePath: string): Promise<OcrResult> {
  const image = fs.readFileSync(filePath).toString("base64");

  try {
    const { data } = await axios.post(
      env.ai.ocrServiceUrl,
      { image_base64: image },
      { timeout: env.ai.requestTimeoutMs }
    );

    const lines: OcrLine[] = (data.results ?? []).map((r: any) => ({
      text: r.text,
      confidence: r.confidence,
      box: r.box,
    }));

    const fullText = lines.map((l) => l.text).join("\n");
    const meanConfidence =
      lines.length > 0 ? lines.reduce((s, l) => s + l.confidence, 0) / lines.length : 0;

    return { fullText, lines, meanConfidence };
  } catch (err) {
    logger.warn("PaddleOCR service call failed", { error: (err as Error).message });
    throw ApiError.internal("OCR service unavailable", { service: "paddleocr" });
  }
}
