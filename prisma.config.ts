import "dotenv/config";

import { defineConfig } from "prisma/config";

// Allow building in environments without a DATABASE_URL by falling back to a local
// SQLite file. For real deployments, set DATABASE_URL to your Postgres connection.
const databaseUrl = process.env.DATABASE_URL || "file:./dev.db";
=======
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
 HEAD
    url: databaseUrl,
  },
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
=======
    url: env("DATABASE_URL")
  },
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts"
  }
>>>>>>> c44805af881fec0d8e0261bab301efbefe737c1f
});
