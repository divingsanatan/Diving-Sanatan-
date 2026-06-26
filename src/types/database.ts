export interface Category {
  id: string;
  name: string;
  createdAt?: string;
}

export interface SocialLinks {
  facebook?: string;
  instagram?: string;
  linkedin?: string;
  youtube?: string;
}

export interface Practitioner {
  id: string;
  name: string;
  specialty: string;
  bio: string;
  rating: number;
  reviewsCount: number;
  image: string;
  createdAt?: string;
  video_url?: string;
  certifications?: string[];
  expertise?: string[];
  social_links?: SocialLinks;
}


export interface Expertise {
  id: string;
  name: string;
  createdAt?: string;
}

export interface Service {
  id: string;
  name: string;
  price: number;
  duration: string;
  rating: number;
  practitioner: string;
  category: string; // Kept for backward compatibility
  categories?: string[]; // Array of category names
  categoryIds?: string[]; // Array of category IDs
  image: string;
  description: string;
  createdAt?: string;
  video_url?: string;
  benefits?: string[];
  process?: string[];
}

export interface Keyword {
  id: string;
  word: string;
  categories?: string[];
  categoryIds?: string[];
  chakras?: string[];
  createdAt?: string;
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
  createdAt?: string;
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
  createdAt?: string;
}

export interface Blog {
  id: string;
  title: string;
  category: string;
  author: string;
  content: string;
  date: string;
  readTime: string;
  image: string;
  images?: string[];
  videos?: string[];
  section?: string | null;
  createdAt?: string;
}

export type GlossaryIllustration = "aura-chart" | "chakra-system" | null;

export interface GlossaryTerm {
  id: string;
  word: string;
  phonetic: string;
  category: string;
  definition: string;
  illustration?: GlossaryIllustration;
  createdAt?: string;
}

export interface ComparisonRowItem {
  label: string;
  valueA: string;
  valueB: string;
}

export interface ComparisonMediaItem {
  type: "image" | "video";
  src: string;
}

export interface ComparisonPage {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  modalityAName: string;
  modalityAPrice: string;
  modalityAServiceId?: string;
  modalityBName: string;
  modalityBPrice: string;
  modalityBServiceId?: string;
  rows: ComparisonRowItem[];
  media: ComparisonMediaItem[];
  serviceIds: string[];
  createdAt?: string;
}
