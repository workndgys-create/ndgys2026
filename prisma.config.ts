import "dotenv/config";

import { defineConfig } from "prisma/config";

// Allow building in environments without a DATABASE_URL by falling back to a local
// SQLite file. For real deployments, set DATABASE_URL to your Postgres connection.
const databaseUrl = process.env.DATABASE_URL || "file:./dev.db";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: databaseUrl,
  },
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
});
