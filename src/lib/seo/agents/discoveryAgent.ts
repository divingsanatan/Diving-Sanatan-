import { supabaseServer } from "@/utils/supabaseServer";
import { callNativeAIModel } from "../utils/nativeModel";

export interface DiscoveryResult {
  url: string;
  keywordsDiscovered: string[];
  categoryAssigned: string;
}

export async function runDiscoveryAgent(url: string, content: string): Promise<DiscoveryResult> {
  const systemPrompt = `You are an expert SEO Keyword & Industry Discovery Agent.
Analyze the provided web page content and return a JSON object with:
1. "keywords": an array of 3-5 high-intent focus keywords derived from the text.
2. "category": the primary discipline category (e.g. "Chakra Healing", "Aura & Energy", "Meditation & Mindfulness", "Reiki Healing", "Sound Healing", "Manifestation", "Spiritual Growth").`;

  const userPrompt = `URL: ${url}\nContent Snippet:\n${content.substring(0, 1500)}`;

  const aiResponse = await callNativeAIModel({ systemPrompt, userPrompt });
  const keywordsDiscovered: string[] = Array.isArray(aiResponse.keywords) ? aiResponse.keywords : ["somatic healing", "energy alignment"];
  const categoryAssigned: string = aiResponse.category || "Holistic Wellness";

  // Upsert keywords into keywords table
  for (const word of keywordsDiscovered) {
    const cleanWord = word.trim().toLowerCase();
    if (!cleanWord) continue;

    const kwId = `kw-${Math.random().toString(36).substring(2, 9)}`;
    const { data: existing } = await supabaseServer.from("keywords").select("id").eq("word", cleanWord).single();
    
    if (!existing) {
      await supabaseServer.from("keywords").insert([
        {
          id: kwId,
          word: cleanWord,
          created_at: new Date().toISOString()
        }
      ]);
    }
  }

  return {
    url,
    keywordsDiscovered,
    categoryAssigned
  };
}
