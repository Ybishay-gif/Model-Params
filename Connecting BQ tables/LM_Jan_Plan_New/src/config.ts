import dotenv from "dotenv";

// In Cloud Run we rely on service env vars, not local .env files baked into the image.
if (!process.env.K_SERVICE) {
  dotenv.config();
}

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

export const config = {
  port: Number(process.env.PORT ?? 8080),
  projectId: required("GOOGLE_CLOUD_PROJECT"),
  dataset: required("BQ_DATASET"),
  adminAccessCode: process.env.ADMIN_ACCESS_CODE || "Kis123kis1!"
};
