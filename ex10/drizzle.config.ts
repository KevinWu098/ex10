import { resolve } from "path";
import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

config({ path: resolve(process.cwd(), ".env.local") });

export default defineConfig({
    out: "./drizzle",
    schema: "./src/db/schema.ts",
    dialect: "postgresql",
    dbCredentials: {
        url: process.env.DATABASE_URL!,
    },
});
