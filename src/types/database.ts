export interface Category {
  id: string;
  name: string;
  createdAt?: string;
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
  createdAt?: string;
}
