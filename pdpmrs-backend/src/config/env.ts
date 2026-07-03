import dotenv from "dotenv";
dotenv.config();

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: parseInt(process.env.PORT ?? "4000", 10),

  databaseUrl: required("DATABASE_URL", "postgresql://pdpmrs:pdpmrs@localhost:5432/pdpmrs"),

  redisUrl: process.env.REDIS_URL ?? "redis://localhost:6379",
  redisTtlSeconds: parseInt(process.env.REDIS_TTL_SECONDS ?? "3600", 10),

  jwt: {
    secret: required("JWT_SECRET", "dev-secret-change-me"),
    expiresIn: process.env.JWT_EXPIRES_IN ?? "7d",
  },

  fileStorage: {
    uploadDir: process.env.UPLOAD_DIR ?? "./uploads",
    maxFileSizeMb: parseInt(process.env.MAX_FILE_SIZE_MB ?? "10", 10),
  },

  reservation: {
    expiryHours: parseInt(process.env.RESERVATION_EXPIRY_HOURS ?? "48", 10),
    expirationJobCron: process.env.RESERVATION_EXPIRATION_CRON ?? "*/10 * * * *",
  },

  mail: {
    host: process.env.SMTP_HOST ?? "localhost",
    port: parseInt(process.env.SMTP_PORT ?? "1025", 10),
    user: process.env.SMTP_USER ?? "",
    pass: process.env.SMTP_PASS ?? "",
    from: process.env.MAIL_FROM ?? "no-reply@pdpmrs.local",
    secure: process.env.SMTP_SECURE === "true",
  },

  ai: {
    // PaddleOCR HTTP serving wrapper (see docker/paddleocr)
    ocrServiceUrl: process.env.OCR_SERVICE_URL ?? "http://localhost:8866/ocr",
    // Qwen via an OpenAI-compatible endpoint (Ollama / vLLM)
    llmBaseUrl: process.env.LLM_BASE_URL ?? "http://localhost:11434/v1",
    llmApiKey: process.env.LLM_API_KEY ?? "ollama",
    llmModel: process.env.LLM_MODEL ?? "qwen2.5:7b-instruct",
    // NLLB translation serving wrapper (see docker/nllb)
    translationServiceUrl: process.env.TRANSLATION_SERVICE_URL ?? "http://localhost:8010/translate",
    requestTimeoutMs: parseInt(process.env.AI_REQUEST_TIMEOUT_MS ?? "30000", 10),
  },

  integrations: {
    medicineProviderBaseUrl: process.env.MEDICINE_PROVIDER_BASE_URL ?? "",
    medicineProviderApiKey: process.env.MEDICINE_PROVIDER_API_KEY ?? "",
    geocodingBaseUrl: process.env.GEOCODING_BASE_URL ?? "https://nominatim.openstreetmap.org",
    geocodingApiKey: process.env.GEOCODING_API_KEY ?? "",
  },

  corsOrigin: process.env.CORS_ORIGIN ?? "*",
};
