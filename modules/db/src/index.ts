import { env } from "@app/config/env";
import { SQL } from "bun";
import { drizzle } from "drizzle-orm/bun-sql";

const client = new SQL(env.DATABASE_URL);
export const db = drizzle({ client });
