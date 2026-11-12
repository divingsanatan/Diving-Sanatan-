// Serves the live /llms.txt (see rewrites in next.config.ts). Always fresh from the database.
export const dynamic = "force-dynamic";
export { GET } from "@/app/llms.txt/route";
