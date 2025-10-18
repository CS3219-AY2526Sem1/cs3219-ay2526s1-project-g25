import dotenv from "dotenv";
import fs from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Try loading local .env only if it exists (for dev mode)
const envPath = join(__dirname, "../../.env");

if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
  console.log("Local .env loaded successfully.");
} else {
  console.warn("⚠️  No .env file found — using environment variables provided by the system or Docker.");
}

// Log summary (for sanity check)
console.log("Environment loaded:", {
  SUPABASE_URL: process.env.SUPABASE_URL ? "LOADED" : "MISSING",
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? "LOADED" : "MISSING",
  PORT: process.env.PORT || "USING_DEFAULT",
});

export default process.env;
