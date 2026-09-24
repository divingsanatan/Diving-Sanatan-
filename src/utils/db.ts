import fs from "fs";
import path from "path";

function getDbPaths() {
  const DB_DIR = path.join(process.cwd(), "src", "data");
  const DB_FILE = path.join(DB_DIR, "db.json");
  return { DB_DIR, DB_FILE };
}

export interface Service {
  id: string;
  name: string;
  price: number;
  duration: string;
  rating: number;
  practitioner: string;
  category: string;
  image: string;
  description: string;
}

export interface Practitioner {
  id: string;
  user_id?: string;
  email?: string;
  name: string;
  specialty: string;
  bio: string;
  rating: number;
  reviewsCount: number;
  image: string;
}

export interface Booking {
  id: string;
  serviceId: string;
  serviceName: string;
  practitionerId: string;
  practitionerName: string;
  date: string;
  timeSlot: string;
  price: number;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  notes: string;
  status: "pending" | "confirmed" | "cancelled";
  paymentStatus: "unpaid" | "paid";
}

export interface Review {
  id: string;
  serviceId: string;
  serviceName: string;
  practitionerId: string;
  practitionerName: string;
  clientName: string;
  rating: number;
  comment: string;
  date: string;
}

export interface Blog {
  id: string;
  slug?: string;
  title: string;
  category: string;
  author: string;
  content: string;
  date: string;
  readTime: string;
  image: string;
  images?: string[];
  videos?: string[];
  video_embed_url?: string;
  video_transcript?: string;
  content_type?: string;
  section?: string | null;
  approval_status?: string;
  is_show_featured_page?: boolean;
  meta_title?: string;
  meta_description?: string;
  focus_keyword?: string;
  canonical_url?: string;
  robots_directive?: string;
  author_bio?: string;
  reviewed_by?: string;
  tldr?: string;
  content_format?: string;
  schema_type?: string;
  faq_pairs?: any[];
  featured_image_alt?: string;
  og_image_override?: string;
  tags?: string[];
  pillar_cluster?: string;
  pinned_related_articles?: string[];
  status?: string;
  [key: string]: any;
}

import { slugify } from "./slugify";
export { slugify };


export interface PendingChangeItem {
  id: string;
  agent_name: string;
  change_type: string;
  target_entity: string;
  target_id?: string;
  proposed_data: any;
  current_data?: any;
  reason: string;
  status: "pending" | "approved" | "rejected" | "applied";
  approved_by?: string;
  approved_at?: string;
  created_at: string;
}

export interface AgentRunItem {
  id: string;
  agent_name: string;
  status: string;
  started_at: string;
  completed_at?: string;
  items_processed?: number;
  run_summary?: any;
  error_message?: string;
}

export interface DistributionLogItem {
  id: string;
  pending_change_id?: string | null;
  target: string;
  status: string;
  pushed_at: string;
  response_summary?: any;
}

export interface KeywordRankingItem {
  id: string;
  keyword_id?: string;
  keyword_text: string;
  url: string;
  position: number;
  search_engine: string;
  location: string;
  checked_at: string;
}

export interface UserProfileItem {
  id: string;
  email: string;
  password?: string;
  name: string;
  role: "super_admin" | "admin" | "subadmin" | "guru" | "healer" | "user";
  phone?: string;
  gender?: string;
  dob?: string;
  category?: string;
  created_at?: string;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  image: string;
  bio?: string;
  order_index?: number;
  createdAt?: string;
}

export interface DatabaseSchema {
  services: Service[];
  practitioners: Practitioner[];
  bookings: Booking[];
  reviews: Review[];
  blogs: Blog[];
  team_members?: TeamMember[];
  user_profiles?: UserProfileItem[];
  pending_changes?: PendingChangeItem[];
  agent_runs?: AgentRunItem[];
  distribution_log?: DistributionLogItem[];
  keyword_rankings?: KeywordRankingItem[];
  pillarGuides?: any[];
}


// Empty initial database schema
const initialData: DatabaseSchema = {
  services: [],
  practitioners: [],
  bookings: [],
  reviews: [],
  blogs: [],
  team_members: [],
  user_profiles: [],
  pending_changes: [],
  agent_runs: [],
  distribution_log: [],
  keyword_rankings: []
};

/**
 * Reads database from localized JSON file
 */
export function getDb(): DatabaseSchema {
  try {
    const { DB_DIR, DB_FILE } = getDbPaths();
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), "utf8");
      return initialData;
    }
    
    const content = fs.readFileSync(DB_FILE, "utf8");
    const parsed = JSON.parse(content) as DatabaseSchema;

    let modified = false;
    if (!parsed.services) { parsed.services = []; modified = true; }
    if (!parsed.practitioners) { parsed.practitioners = []; modified = true; }
    if (!parsed.bookings) { parsed.bookings = []; modified = true; }
    if (!parsed.reviews) { parsed.reviews = []; modified = true; }
    if (!parsed.blogs) { parsed.blogs = []; modified = true; }
    if (!parsed.team_members) { parsed.team_members = []; modified = true; }
    if (!parsed.user_profiles) { parsed.user_profiles = []; modified = true; }
    if (!parsed.pending_changes) { parsed.pending_changes = []; modified = true; }
    if (!parsed.agent_runs) { parsed.agent_runs = []; modified = true; }
    if (!parsed.distribution_log) { parsed.distribution_log = []; modified = true; }
    if (!parsed.keyword_rankings) { parsed.keyword_rankings = []; modified = true; }
    if (!parsed.pillarGuides) { parsed.pillarGuides = []; modified = true; }

    if (modified) {
      fs.writeFileSync(DB_FILE, JSON.stringify(parsed, null, 2), "utf8");
    }

    return parsed;
  } catch (error) {
    console.error("Database reading error, using seed data:", error);
    return initialData;
  }
}

/**
 * Saves database state to localized JSON file
 */
export function saveDb(data: DatabaseSchema): boolean {
  try {
    const { DB_DIR, DB_FILE } = getDbPaths();
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf8");
    return true;
  } catch (error) {
    console.error("Database writing error:", error);
    return false;
  }
}
