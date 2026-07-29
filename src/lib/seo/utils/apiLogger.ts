import { supabaseServer } from "@/utils/supabaseServer";

export async function logApiUsage(service: string, tokensOrRequests: number, estimatedCost: number) {
  try {
    const { error } = await supabaseServer.from("api_usage_log").insert([
      {
        service,
        tokens_or_requests: tokensOrRequests,
        estimated_cost: estimatedCost,
        logged_at: new Date().toISOString()
      }
    ]);
    if (error) {
      console.error(`Failed to log API usage for ${service}:`, error.message);
    }
  } catch (err) {
    console.error(`Error logging API usage for ${service}:`, err);
  }
}
