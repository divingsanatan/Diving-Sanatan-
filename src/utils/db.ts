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

export interface DatabaseSchema {
  services: Service[];
  practitioners: Practitioner[];
  bookings: Booking[];
  reviews: Review[];
  blogs: Blog[];
  user_profiles?: UserProfileItem[];
  pending_changes?: PendingChangeItem[];
  agent_runs?: AgentRunItem[];
  distribution_log?: DistributionLogItem[];
  keyword_rankings?: KeywordRankingItem[];
  pillarGuides?: any[];
}

// Initial high-fidelity seed data
const initialData: DatabaseSchema = {
  services: [
    {
      id: "srv-1",
      name: "Aura Balancing",
      price: 120,
      duration: "1 Hour",
      rating: 4.9,
      practitioner: "Dr. Elara Vance",
      category: "Energy",
      image: "aura_balancing",
      description: "A comprehensive energy purification designed to balance your auric fields, align your chakras, and restore your inner vitality.",
    },
    {
      id: "srv-2",
      name: "Crystal Healing",
      price: 90,
      duration: "1.5 Hours",
      rating: 4.8,
      practitioner: "Dr. Elara Vance",
      category: "Energy",
      image: "crystal_healing",
      description: "Uses mineral crystals placed on key chakra nodes to clear blockages, release deep-rooted physical stress, and manifest positive thoughts.",
    },
    {
      id: "srv-3",
      name: "Chakra Clearing",
      price: 150,
      duration: "1 Hour",
      rating: 4.9,
      practitioner: "Dr. Elara Vance",
      category: "Energy",
      image: "chakra_clearing",
      description: "Targeted purification session activating your 7 primary energy centers. Includes acoustic tuning bowls and aromatherapy elements.",
    },
    {
      id: "srv-4",
      name: "Mindfulness Meditation",
      price: 75,
      duration: "1 Hour",
      rating: 4.8,
      practitioner: "Master Zephyr",
      category: "Meditation",
      image: "mindfulness_meditation",
      description: "Learn breathing disciplines, conscious visualization, and deep grounding techniques to calm your active mind and control stress levels.",
    },
    {
      id: "srv-5",
      name: "Anxiety Release Session",
      price: 140,
      duration: "1.5 Hours",
      rating: 4.9,
      practitioner: "Dr. Elara Vance",
      category: "Meditation",
      image: "anxiety_release",
      description: "A tailored therapeutic program combining somatic breathing patterns and soft reiki sequences to rapidly dissolve anxiety triggers.",
    },
    {
      id: "srv-6",
      name: "Spiritual Counseling",
      price: 110,
      duration: "1 Hour",
      rating: 4.9,
      practitioner: "Dr. Celeste Thorne",
      category: "Counseling",
      image: "spiritual_counseling",
      description: "One-on-one psychological-spiritual integration to discuss career blockages, inner child transitions, and overall life path alignment.",
    },
  ],
  practitioners: [
    {
      id: "prac-1",
      name: "Dr. Elara Vance",
      specialty: "Energy Therapist & Reiki Master",
      bio: "Dr. Elara Vance has spent over 15 years studying holistic health systems across Asia and Europe. She specializes in auric cleansing, alignment, and targeted crystals layouts to cultivate physical healing and mental quietude.",
      rating: 4.9,
      reviewsCount: 128,
      image: "elara_vance",
    },
    {
      id: "prac-2",
      name: "Master Zephyr",
      specialty: "Meditation Guide & Sound Healer",
      bio: "Master Zephyr guides seekers into deep tranquility using sacred sound bowls and guided breathwork routines. His meditation exercises focus on lowering heart rate variability and accessing higher states of peace.",
      rating: 4.8,
      reviewsCount: 94,
      image: "master_zephyr",
    },
    {
      id: "prac-3",
      name: "Dr. Celeste Thorne",
      specialty: "Spiritual Counselor & Metaphysician",
      bio: "Dr. Celeste Thorne bridges psychological counseling with metaphysical wisdom. She assists individuals in overcoming transition points, identifying limiting subconscious patterns, and restoring absolute clarity of purpose.",
      rating: 4.9,
      reviewsCount: 82,
      image: "celeste_thorne",
    },
  ],
  bookings: [
    {
      id: "bk-1",
      serviceId: "srv-1",
      serviceName: "Aura Balancing",
      practitionerId: "prac-1",
      practitionerName: "Dr. Elara Vance",
      date: "2026-06-14",
      timeSlot: "10:00 AM",
      price: 120,
      clientName: "Sumeet",
      clientEmail: "sumeet@example.com",
      clientPhone: "+1 (555) 019-2834",
      notes: "Feeling heavily fatigued and stressed lately. Excited to try aura alignment.",
      status: "confirmed",
      paymentStatus: "paid",
    },
  ],
  reviews: [
    {
      id: "rv-1",
      serviceId: "srv-1",
      serviceName: "Aura Balancing",
      practitionerId: "prac-1",
      practitionerName: "Dr. Elara Vance",
      clientName: "Jonathan K.",
      rating: 5,
      comment: "Absolutely transcendental experience. I walked in carrying weeks of work stress and left feeling lightweight, centered, and deeply peaceful.",
      date: "2026-05-28T14:32:00.000Z",
    },
    {
      id: "rv-2",
      serviceId: "srv-4",
      serviceName: "Mindfulness Meditation",
      practitionerId: "prac-2",
      practitionerName: "Master Zephyr",
      clientName: "Sarah M.",
      rating: 5,
      comment: "Master Zephyr has a calm energy that instantly grounds you. The breathwork exercises helped control my hyperventilating tendencies.",
      date: "2026-06-02T10:15:00.000Z",
    },
    {
      id: "rv-3",
      serviceId: "srv-6",
      serviceName: "Spiritual Counseling",
      practitionerId: "prac-3",
      practitionerName: "Dr. Celeste Thorne",
      clientName: "Liam P.",
      rating: 4,
      comment: "A highly insightful integration. Dr. Celeste helped me map my subconscious blockers and gave me daily journal prompts to stay on track.",
      date: "2026-06-05T16:40:00.000Z",
    },
  ],
  blogs: [
    {
      id: "bl-1",
      title: "The Healing Power of Amethyst Crystals",
      category: "Crystals",
      author: "Dr. Elara Vance",
      content: "Amethyst is more than just a beautiful purple mineral; it is a natural tranquilizer. In energy medicine, amethyst is renowned for its high vibrational resonance that aligns directly with the Crown and Third Eye chakras. By placing amethyst stones around your sleeping quarters or wearing them during meditation, you allow the crystal's natural high-frequency currents to clear residual static from your aura. This encourages deep sleep, filters negative psychic thoughts, and fosters an environment of cognitive stillness. When beginning crystal layouts, ensure you cleanse your amethyst under cool salt water and charge it during a full moon cycle for peak efficacy.",
      date: "2026-05-18",
      readTime: "5 Min Read",
      image: "amethyst_crystals",
    },
    {
      id: "bl-2",
      title: "Unlocking the Chakras: A Beginner's Guide",
      category: "Energy Healing",
      author: "Dr. Celeste Thorne",
      content: "Chakras are the spinning energetic vortices that govern our emotional, mental, and biological wellness. Derived from the Sanskrit word for 'wheel', our seven primary chakras act as transformer stations along the spine—from the Root (Muladhara) at the tailbone to the Crown (Sahasrara) at the peak of the skull. When emotional trauma or daily stress triggers physical constriction, our chakras can become sluggish or completely blocked. This manifest as brain fog, chronic exhaustion, or physical tension. By utilizing targeted visualizations, color therapy, and vocalized mantras, you can break up stagnant energy and restore a free, healthy flow of vital force (Prana) throughout your system.",
      date: "2026-05-24",
      readTime: "8 Min Read",
      image: "chakras_guide",
    },
    {
      id: "bl-3",
      title: "Mindfulness and Anxiety: Breathing Through Stress",
      category: "Mindfulness",
      author: "Master Zephyr",
      content: "In moments of high anxiety, our sympathetic nervous system triggers the fight-or-flight cycle. Our breathing becomes shallow, chest muscles contract, and cortisol floods our bloodstream. The fastest portal back to equilibrium is your breath. By practicing conscious pranayama or box breathing (inhaling for 4 seconds, holding for 4, exhaling for 4, and holding empty for 4), you signal to your vagus nerve that you are safe. This activates the parasympathetic nervous system, lowering heart rate and bringing hyperactive neural circuits back to baseline. Make it a daily ritual: spend 10 minutes every morning sitting in silence, focusing solely on the tactile feeling of air entering and exiting your nostrils.",
      date: "2026-06-01",
      readTime: "6 Min Read",
      image: "breathing_stress",
    },
    {
      id: "vblog-1",
      slug: "chakra-shorts-awakening-the-heart-node",
      title: "Chakra Shorts: Awakening the Heart Node",
      category: "Video Transcripts",
      author: "Master Zephyr",
      content: "Sound wave healing acts as a direct conduit to rebalance our primary energetic nodes. In this short video session, we explore 528Hz crystal sound bowl frequencies and how sound vibrations release physical tension stored around the heart center.",
      date: "2026-06-10",
      readTime: "5 Min Watch",
      image: "/images/insight_video.png",
      content_type: "video",
      video_embed_url: "https://www.youtube.com/embed/dQw4w9WgXcQ",
      video_transcript: `00:00 Currently, sound wave healing acts as a conduit to rebalance our primary nodes.
00:06 By using sound bowls tuned to 528Hz, we target cellular water crystals.
00:14 Key insights show that chakra blockages are often somatic reactions to stress.
00:22 Practitioners can use targeted vibration maps to dissolve localized anxieties.
00:29 The transcript here acts as a reference log for your personal audio sessions.`,
      section: "video-transcripts"
    },
    {
      id: "vblog-2",
      slug: "aura-alignment-mineral-energy-fields",
      title: "Aura Alignment & Mineral Energy Fields",
      category: "Video Transcripts",
      author: "Dr. Elara Vance",
      content: "Explore quartz crystal energy transmissions and piezoelectric field stabilization. Learn how placement near nerve meridians calms voltage spikes in the nervous system.",
      date: "2026-06-15",
      readTime: "6 Min Watch",
      image: "/images/insight_space.png",
      content_type: "video",
      video_embed_url: "https://www.youtube.com/embed/L_LUpnjgPso",
      video_transcript: `00:00 Welcome to the study of quartz energy transmissions.
00:08 Crystals carry stable crystalline structures that output continuous frequencies.
00:16 When placed near active nerve endings, they help normalize nervous voltage.
00:25 We call this process piezo-energy stabilizing.
00:33 Remember to wash your gems monthly under cold running spring water.`,
      section: "video-transcripts"
    },
  ],
  pending_changes: [
    {
      id: "pc-1",
      agent_name: "on_page_content_quality",
      change_type: "content_edit",
      target_entity: "blogs",
      target_id: "bl-2",
      proposed_data: {
        meta_title: "Unlocking the Chakras: Complete Beginner's Energy Guide",
        meta_description: "Discover how authentic chakra balancing techniques clear blocked Prana energy and relieve physical stress in Bhopal.",
        focus_keyword: "chakra healing Bhopal",
        author_bio: "Authored by Dr. Celeste Thorne, Senior Holistics Specialist with 14 years experience.",
        reviewed_by: "Dr. Elara Vance, Master Reiki Practitioner",
        tldr: "Chakras govern physical and emotional vitality. Using focused visualization and sound tuning bowls clears stagnant energy stations.",
        featured_image_alt: "Infographic of 7 human chakra energy centers along the spine",
        schema_type: "Article"
      },
      current_data: { blogId: "bl-2", title: "Unlocking the Chakras: A Beginner's Guide" },
      reason: "On-Page Audit Agent found missing focus keyword and missing E-E-A-T author credentials. High potential for position #1 ranking.",
      status: "pending",
      created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString()
    },
    {
      id: "pc-2",
      agent_name: "technical_seo",
      change_type: "technical_fix",
      target_entity: "blogs",
      target_id: "bl-1",
      proposed_data: {
        canonical_url: "https://divingsanatan.online/blog/healing-power-amethyst-crystals",
        robots_directive: "index, follow",
        featured_image_alt: "Cleaned amethyst crystal cluster for crown chakra meditation"
      },
      current_data: { blogId: "bl-1", title: "The Healing Power of Amethyst Crystals" },
      reason: "Technical SEO Agent flagged missing image alt attribute and missing canonical URL tag.",
      status: "pending",
      created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString()
    }
  ],
  agent_runs: [
    {
      id: "run-101",
      agent_name: "on_page_content_quality",
      status: "completed",
      started_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
      completed_at: new Date(Date.now() - 1000 * 60 * 14).toISOString(),
      items_processed: 3,
      run_summary: { eeatScore: 88, proposalsGenerated: 1 }
    },
    {
      id: "run-102",
      agent_name: "technical_seo",
      status: "completed",
      started_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
      completed_at: new Date(Date.now() - 1000 * 60 * 44).toISOString(),
      items_processed: 5,
      run_summary: { issuesDetected: 2, fixesProposed: 1 }
    },
    {
      id: "run-103",
      agent_name: "monitoring_reporting",
      status: "completed",
      started_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
      completed_at: new Date(Date.now() - 1000 * 60 * 119).toISOString(),
      items_processed: 6,
      run_summary: { keywordsTracked: 6, avgPosition: 3.8 }
    }
  ],
  distribution_log: [
    {
      id: "dist-1",
      target: "indexnow",
      status: "success",
      pushed_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
      response_summary: { message: "IndexNow ping submitted to Bing & Yandex", host: "divingsanatan.online" }
    },
    {
      id: "dist-2",
      target: "gsc_index_request",
      status: "success",
      pushed_at: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
      response_summary: { message: "Google Search Console sitemap resubmit successful" }
    }
  ],
  keyword_rankings: [
    {
      id: "kw-1",
      keyword_text: "chakra healing Bhopal",
      url: "https://divingsanatan.online/services",
      position: 1,
      search_engine: "google",
      location: "IN",
      checked_at: new Date(Date.now() - 1000 * 60 * 120).toISOString()
    },
    {
      id: "kw-2",
      keyword_text: "reiki therapist Bhopal",
      url: "https://divingsanatan.online/services",
      position: 2,
      search_engine: "google",
      location: "IN",
      checked_at: new Date(Date.now() - 1000 * 60 * 120).toISOString()
    },
    {
      id: "kw-3",
      keyword_text: "sound healing therapy",
      url: "https://divingsanatan.online/services",
      position: 4,
      search_engine: "google",
      location: "US",
      checked_at: new Date(Date.now() - 1000 * 60 * 120).toISOString()
    },
    {
      id: "kw-4",
      keyword_text: "aura cleansing techniques",
      url: "https://divingsanatan.online/blog",
      position: 3,
      search_engine: "google",
      location: "US",
      checked_at: new Date(Date.now() - 1000 * 60 * 120).toISOString()
    }
  ],
  user_profiles: [
    {
      id: "admin-divingsanatan",
      email: "divingsanatan@gmail.com",
      password: "375ff6d6533836073e53b8f43c2f31d51ac3b79c0971bae5d5d0e0a0a9f1d1d1",
      role: "super_admin",
      name: "Diving Sanatan Admin",
      phone: "+91 9876543210",
      created_at: new Date().toISOString()
    }
  ]
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
    if (!parsed.pending_changes || parsed.pending_changes.length === 0) {
      parsed.pending_changes = initialData.pending_changes;
      modified = true;
    }
    if (!parsed.agent_runs || parsed.agent_runs.length === 0) {
      parsed.agent_runs = initialData.agent_runs;
      modified = true;
    }
    if (!parsed.distribution_log || parsed.distribution_log.length === 0) {
      parsed.distribution_log = initialData.distribution_log;
      modified = true;
    }
    if (!parsed.keyword_rankings || parsed.keyword_rankings.length === 0) {
      parsed.keyword_rankings = initialData.keyword_rankings;
      modified = true;
    }
    if (!parsed.user_profiles || parsed.user_profiles.length === 0) {
      parsed.user_profiles = initialData.user_profiles;
      modified = true;
    }

    if (!parsed.blogs) {
      parsed.blogs = [];
    }
    initialData.blogs.forEach((seedBlog) => {
      if (!parsed.blogs.some((b) => b.id === seedBlog.id || (seedBlog.slug && b.slug === seedBlog.slug))) {
        parsed.blogs.push(seedBlog);
        modified = true;
      }
    });

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
