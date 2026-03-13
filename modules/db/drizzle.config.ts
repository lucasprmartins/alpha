import dotenv from "dotenv";
import { defineConfig } from "drizzle-kit";

dotenv.config({ path: "../../apps/server/.env", override: true });

export default defineConfig({
  out: "./src/migrations",
  dialect: "postgresql",
  schema: "./src/schema",
  dbCredentials: {
    url: process.env.DATABASE_URL as string,
  },
  schemaFilter: ["public", "auth"],
  migrations: {
    prefix: "index",
    table: "migrations",
    schema: "drizzle",
  },
  breakpoints: true,
  strict: true,
});
