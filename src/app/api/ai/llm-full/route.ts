// Serves the live /llm-full.txt (see rewrites in next.config.ts). Always fresh from the database.
export const dynamic = "force-dynamic";
export { GET } from "@/app/llm-full.txt/route";
