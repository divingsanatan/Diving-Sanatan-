"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { useBlog } from "../BlogContext";
import { useRouter } from "next/navigation";
import {
  Plus,
  Minus,
  Search,
  Calendar,
  ChevronDown,
  Check,
  MessageSquare,
  HelpCircle,
  Sparkles,
  Settings,
  Compass,
  Flower,
  Heart,
  Mail,
  User,
  Quote
} from "lucide-react";

interface FAQItem {
  id: string;
  category: string;
  question: string;
  answer: string;
  verified: boolean;
}

// 27 FAQ Questions to match counts in Browse Category Grid
const FAQ_DATA: FAQItem[] = [
  // Practices (6 items)
  {
    id: "prac-1",
    category: "practices",
    question: "How do I choose the right healing practice for me?",
    answer: "Choosing the right healing practice begins with identifying your primary goals—whether physical, emotional, or spiritual. We recommend starting with a holistic consultation or trying gentle practices like yoga or meditation to see what resonates with you.",
    verified: true,
  },
  {
    id: "prac-2",
    category: "practices",
    question: "Are your practices safe for beginners?",
    answer: "Yes, all of our guided practices are designed to be accessible to beginners. Our healers provide step-by-step guidance, and we encourage you to go at your own comfortable pace.",
    verified: true,
  },
  {
    id: "prac-3",
    category: "practices",
    question: "What is the difference between meditation and pranayama?",
    answer: "Meditation focuses on quietening the mind and cultivating mindfulness, whereas pranayama is the yogic practice of breath control. Breathwork is often used as a powerful precursor to deepen meditation states.",
    verified: false,
  },
  {
    id: "prac-4",
    category: "practices",
    question: "How often should I engage in guided practices?",
    answer: "For optimal benefits, we recommend daily practice, even if only for 10-15 minutes. Consistency is much more effective than doing long, infrequent sessions.",
    verified: true,
  },
  {
    id: "prac-5",
    category: "practices",
    question: "Do I need any special equipment for breathwork?",
    answer: "No special equipment is needed. A comfortable, quiet space to sit or lie down, a yoga mat or cushion, and comfortable clothing are all you need to start.",
    verified: false,
  },
  {
    id: "prac-6",
    category: "practices",
    question: "Can I practice chakra alignment on my own?",
    answer: "Yes, while professional sessions provide deep diagnostics and clearing, you can maintain your energy flow through daily meditation, using seed mantras, and visualization techniques.",
    verified: true,
  },

  // Healing (5 items)
  {
    id: "heal-1",
    category: "healing",
    question: "What is holistic healing?",
    answer: "Holistic healing is an approach that considers the whole person—body, mind, emotions, and spirit. It aims to restore balance and promote overall well-being through natural practices, energy work, and mindful living.",
    verified: true,
  },
  {
    id: "heal-2",
    category: "healing",
    question: "What can I expect in a healing session?",
    answer: "In a standard healing session, you will discuss your history and goals, followed by a non-invasive energetic scan or alignment technique. You'll remain fully clothed and comfortable, feeling deep relaxation, gentle warmth, or emotional release.",
    verified: true,
  },
  {
    id: "heal-3",
    category: "healing",
    question: "How long does it take to see results?",
    answer: "While many clients report immediate feelings of peace, stress relief, or clarity after their first session, long-term healing is a journey. Committing to a consistent 3 to 6-week practice typically yields the most profound, lasting shifts.",
    verified: true,
  },
  {
    id: "heal-4",
    category: "healing",
    question: "Can energy healing help with physical ailments?",
    answer: "Energy healing is a complementary therapy that helps release somatic tension and lower stress. While it does not replace medical treatment, it supports the body's natural healing systems and improves recovery times.",
    verified: false,
  },
  {
    id: "heal-5",
    category: "healing",
    question: "How does distance healing work?",
    answer: "Distance healing operates on the principle that energy is not bound by space or time. The practitioner establishes a conscious connection with your energy field through focused intention and conducts the session remotely.",
    verified: true,
  },

  // Spirituality (7 items)
  {
    id: "spirit-1",
    category: "spirituality",
    question: "What is spiritual well-being?",
    answer: "Spiritual well-being involves finding meaning, purpose, and connection in life. It doesn't require adhering to a specific religion; it's about connecting with your inner self, nature, or a higher consciousness.",
    verified: true,
  },
  {
    id: "spirit-2",
    category: "spirituality",
    question: "How does grounding help my spiritual growth?",
    answer: "Grounding anchors your energy to the Earth, helping to discharge excess emotional or mental static. It provides a stable foundation, allowing you to explore higher spiritual states without feeling spaced out.",
    verified: true,
  },
  {
    id: "spirit-3",
    category: "spirituality",
    question: "What is the meaning of the lotus symbol in spiritual traditions?",
    answer: "The lotus represents purity, spiritual awakening, and resilience. Just as the lotus grows in muddy water and blooms untarnished, it symbolizes the soul's path to overcoming challenges and achieving enlightenment.",
    verified: false,
  },
  {
    id: "spirit-4",
    category: "spirituality",
    question: "What are Solfeggio frequencies?",
    answer: "Solfeggio frequencies are an ancient 6-tone scale of sound vibrations used in sacred music and healing. Each frequency (like 528Hz or 432Hz) is associated with specific energetic qualities, such as emotional release or transformation.",
    verified: true,
  },
  {
    id: "spirit-5",
    category: "spirituality",
    question: "How can I identify my primary chakra blockage?",
    answer: "Blockages often manifest physically or emotionally in areas corresponding to the chakra. For instance, difficulty speaking your truth indicates a Throat Chakra block, while feeling anxious about survival points to the Root Chakra.",
    verified: true,
  },
  {
    id: "spirit-6",
    category: "spirituality",
    question: "What is the role of crystals in spiritual practice?",
    answer: "Crystals act as energetic amplifiers. Their stable mineral structures vibrate at specific frequencies, which can help align and stabilize our own energy fields when held, worn, or placed nearby.",
    verified: false,
  },
  {
    id: "spirit-7",
    category: "spirituality",
    question: "How do I connect with my intuition?",
    answer: "Connecting with intuition requires quietening the analytical mind. Meditation, spending time in silence, journaling, and learning to trust your initial gut feelings are all effective ways to strengthen this inner guidance.",
    verified: true,
  },

  // Account & Booking (4 items)
  {
    id: "book-1",
    category: "booking",
    question: "How do I book a consultation?",
    answer: "You can book a session by clicking the 'Book a Consultation' button at the top of the page, choosing your preferred practitioner and time slot, and completing the secure checkout process.",
    verified: true,
  },
  {
    id: "book-2",
    category: "booking",
    question: "What is your cancellation policy?",
    answer: "We allow free cancellations or rescheduling up to 24 hours before your scheduled session. Within 24 hours, cancellations may be subject to a 50% reservation fee.",
    verified: true,
  },
  {
    id: "book-3",
    category: "booking",
    question: "Can I book a session for someone else?",
    answer: "Yes, you can purchase a session as a gift. Just enter the recipient's details during booking, or contact our support team to issue a personalized gift voucher.",
    verified: false,
  },
  {
    id: "book-4",
    category: "booking",
    question: "Do you offer package discounts?",
    answer: "Yes! We offer discounted bundles for 3, 5, or 10 sessions. You can browse these package options in our Services section or discuss them during your initial consultation.",
    verified: true,
  },

  // General (5 items)
  {
    id: "gen-1",
    category: "general",
    question: "How do I contact customer support?",
    answer: "You can reach our support team by clicking 'Contact Support' at the bottom of the page, or by emailing us directly at support@divingsanatan.com. We aim to respond within 24 hours.",
    verified: true,
  },
  {
    id: "gen-2",
    category: "general",
    question: "Where are you located?",
    answer: "We offer both online virtual sessions worldwide and in-person consultations at our serene wellness center in Rishikesh, India.",
    verified: true,
  },
  {
    id: "gen-3",
    category: "general",
    question: "Are my sessions confidential?",
    answer: "Yes, absolute confidentiality is a cornerstone of our practice. Any information shared during consultations or healing sessions remains completely private between you and your practitioner.",
    verified: true,
  },
  {
    id: "gen-4",
    category: "general",
    question: "Is holistic wellness suitable for all ages?",
    answer: "Yes, our gentle practices are safe and beneficial for individuals of all ages, from children to seniors. We adapt our techniques to suit the specific physical and emotional needs of each client.",
    verified: false,
  },
  {
    id: "gen-5",
    category: "general",
    question: "Do you offer custom wellness plans?",
    answer: "Yes, we specialize in tailoring holistic packages that combine energy healing, guided meditation, and lifestyle guidance based on your personal wellness assessment.",
    verified: true,
  },
];

const CATEGORY_NAMES: Record<string, string> = {
  all: "All",
  practices: "Practices",
  healing: "Healing",
  spirituality: "Spirituality",
  booking: "Account & Booking",
  general: "General",
};

// Premium Animated Crystal Ball SVG
const CrystalBallSVG = () => (
  <svg width="180" height="180" viewBox="0 0 200 200" className="crystal-ball-svg">
    <defs>
      <linearGradient id="lotusGrad" x1="0%" y1="100%" x2="0%" y2="0%">
        <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.8" />
        <stop offset="100%" stopColor="#c084fc" stopOpacity="0.2" />
      </linearGradient>
      <radialGradient id="ballGrad" cx="40%" cy="40%" r="60%">
        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
        <stop offset="50%" stopColor="#edd8fc" stopOpacity="0.45" />
        <stop offset="100%" stopColor="#7c3aed" stopOpacity="0.2" />
      </radialGradient>
      <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="8" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
      <filter id="qGlow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="3" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>

    {/* Background rotating rays */}
    <g opacity="0.3" className="glow-rays">
      <circle cx="100" cy="95" r="70" fill="none" stroke="#c084fc" strokeWidth="1" strokeDasharray="4 8" />
      <circle cx="100" cy="95" r="85" fill="none" stroke="#7c3aed" strokeWidth="0.5" strokeDasharray="8 12" />
      <line x1="100" y1="10" x2="100" y2="180" stroke="#7c3aed" strokeWidth="0.5" strokeDasharray="5 5" />
      <line x1="15" y1="95" x2="185" y2="95" stroke="#7c3aed" strokeWidth="0.5" strokeDasharray="5 5" />
    </g>

    {/* Outer glowing halo */}
    <circle cx="100" cy="95" r="55" fill="#fdf4ff" opacity="0.4" filter="url(#glow)" />
    <circle cx="100" cy="95" r="52" fill="none" stroke="#c084fc" strokeWidth="1.5" opacity="0.7" />

    {/* Crystal ball sphere */}
    <circle cx="100" cy="95" r="50" fill="url(#ballGrad)" className="crystal-sphere" />

    {/* Specular reflections on glass */}
    <ellipse cx="82" cy="72" rx="14" ry="7" transform="rotate(-30 82 72)" fill="#ffffff" opacity="0.6" />
    <circle cx="118" cy="120" r="4" fill="#ffffff" opacity="0.4" />

    {/* Question Mark floating inside */}
    <g className="floating-question" filter="url(#qGlow)">
      <path d="M92 82c0-8 6-12 11-12s10 3 10 9c0 5-3 8-7 11s-5 6-5 9" fill="none" stroke="#6b21a8" strokeWidth="6.5" strokeLinecap="round" />
      <circle cx="101" cy="107" r="4" fill="#6b21a8" />
    </g>

    {/* Lotus flower base */}
    <g transform="translate(100, 145) scale(0.95)" className="lotus-base">
      <path d="M-40 -10 C-60 -25 -20 -40 0 -10 C20 -40 60 -25 40 -10 Z" fill="url(#lotusGrad)" stroke="#c084fc" strokeWidth="1" />
      <path d="M-50 0 C-75 -10 -40 -30 -10 -2" fill="url(#lotusGrad)" stroke="#c084fc" strokeWidth="1" />
      <path d="M50 0 C75 -10 40 -30 10 -2" fill="url(#lotusGrad)" stroke="#c084fc" strokeWidth="1" />
      <path d="M-25 5 C-40 -20 0 -35 0 0 C0 -35 40 -20 25 5 Z" fill="#edd8fc" stroke="#7c3aed" strokeWidth="1.2" />
      <path d="M-12 8 C-20 -15 0 -25 0 5 C0 -25 20 -15 12 8 Z" fill="#7c3aed" opacity="0.75" />
    </g>

    <style jsx>{`
      .crystal-ball-svg {
        filter: drop-shadow(0 10px 20px rgba(124, 58, 237, 0.1));
      }
      .floating-question {
        animation: floatQ 3.5s infinite ease-in-out;
        transform-origin: 100px 95px;
      }
      .crystal-sphere {
        animation: sphereGlow 4s infinite alternate ease-in-out;
      }
      .glow-rays {
        animation: spinRays 40s infinite linear;
        transform-origin: 100px 95px;
      }
      @keyframes floatQ {
        0% { transform: translateY(0px) scale(1); }
        50% { transform: translateY(-4px) scale(1.02); }
        100% { transform: translateY(0px) scale(1); }
      }
      @keyframes sphereGlow {
        0% { filter: drop-shadow(0 0 2px rgba(168, 85, 247, 0.15)); }
        100% { filter: drop-shadow(0 0 8px rgba(168, 85, 247, 0.4)); }
      }
      @keyframes spinRays {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
    `}</style>
  </svg>
);

// Animated Cozy Lantern SVG for bottom CTA
const CTALanternSVG = () => (
  <svg width="200" height="130" viewBox="0 0 200 130" className="cta-lantern-svg">
    <defs>
      <radialGradient id="lampGlow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#fef08a" stopOpacity="1" />
        <stop offset="35%" stopColor="#facc15" stopOpacity="0.5" />
        <stop offset="75%" stopColor="#ca8a04" stopOpacity="0.15" />
        <stop offset="100%" stopColor="#7c3aed" stopOpacity="0" />
      </radialGradient>
      <linearGradient id="metalGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#1e1b4b" />
        <stop offset="50%" stopColor="#4c1d95" />
        <stop offset="100%" stopColor="#1e1b4b" />
      </linearGradient>
    </defs>

    {/* Ambient Glows */}
    <circle cx="100" cy="75" r="55" fill="url(#lampGlow)" opacity="0.6" />
    <circle cx="150" cy="100" r="30" fill="url(#lampGlow)" opacity="0.4" />

    {/* Fairy Lights string */}
    <path d="M10 20 Q 50 40 90 20 Q 130 40 170 20" fill="none" stroke="#a855f7" strokeWidth="1" opacity="0.4" />
    <circle cx="30" cy="24" r="3" fill="#fef08a" filter="drop-shadow(0 0 3px #facc15)" />
    <circle cx="60" cy="28" r="3.5" fill="#fef08a" filter="drop-shadow(0 0 3px #facc15)" />
    <circle cx="90" cy="20" r="3" fill="#fef08a" filter="drop-shadow(0 0 3px #facc15)" />
    <circle cx="120" cy="28" r="3" fill="#fef08a" filter="drop-shadow(0 0 3px #facc15)" />
    <circle cx="150" cy="24" r="3.5" fill="#fef08a" filter="drop-shadow(0 0 3px #facc15)" />

    {/* Candle 1 */}
    <rect x="30" y="95" width="14" height="22" rx="2" fill="#faf5ff" opacity="0.9" />
    <ellipse cx="37" cy="95" rx="7" ry="2" fill="#edd8fc" />
    <path d="M37 95 Q 34 86 37 81 Q 40 86 37 95" fill="#facc15" className="candle-flame" />

    {/* Candle 2 */}
    <rect x="52" y="85" width="18" height="32" rx="2" fill="#faf5ff" opacity="0.9" />
    <ellipse cx="61" cy="85" rx="9" ry="3" fill="#edd8fc" />
    <path d="M61 85 Q 58 74 61 67 Q 64 74 61 85" fill="#facc15" className="candle-flame-delayed" />

    {/* Candle 3 */}
    <rect x="78" y="100" width="12" height="17" rx="1.5" fill="#faf5ff" opacity="0.9" />
    <ellipse cx="84" cy="100" rx="6" ry="1.5" fill="#edd8fc" />
    <path d="M84 100 Q 81 93 84 88 Q 87 93 84 100" fill="#facc15" className="candle-flame" />

    {/* Lantern */}
    <rect x="130" y="110" width="36" height="8" rx="2" fill="url(#metalGrad)" />
    <rect x="135" y="75" width="26" height="35" rx="3" fill="none" stroke="url(#metalGrad)" strokeWidth="3.5" />
    <ellipse cx="148" cy="95" rx="9" ry="12" fill="url(#lampGlow)" />
    <path d="M148 95 Q 144 83 148 77 Q 152 83 148 95" fill="#fef08a" className="candle-flame" />
    <path d="M133 75 L148 57 L163 75 Z" fill="url(#metalGrad)" />
    <rect x="145" y="52" width="6" height="5" fill="url(#metalGrad)" />
    <circle cx="148" cy="48" r="4" fill="none" stroke="url(#metalGrad)" strokeWidth="2.5" />

    <style jsx>{`
      .candle-flame {
        animation: flicker 1.5s infinite ease-in-out;
        transform-origin: bottom center;
      }
      .candle-flame-delayed {
        animation: flicker 1.8s infinite ease-in-out;
        animation-delay: 0.3s;
        transform-origin: bottom center;
      }
      @keyframes flicker {
        0%, 100% { transform: scale(1) rotate(0deg); opacity: 0.95; }
        50% { transform: scale(1.06) rotate(1.5deg); opacity: 1; fill: #f59e0b; }
        75% { transform: scale(0.96) rotate(-1deg); opacity: 0.9; }
      }
    `}</style>
  </svg>
);

export default function FAQPage() {
  const router = useRouter();
  const { searchQuery, setSearchQuery } = useBlog();
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Custom accordions state
  const [openAccordions, setOpenAccordions] = useState<Record<string, boolean>>({
    "heal-1": true, // open holistic healing by default
  });

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Reset page when category or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, searchQuery]);

  const categories = ["all", "practices", "healing", "spirituality", "booking", "general"];

  // Handle accordion toggle
  const toggleAccordion = (id: string) => {
    setOpenAccordions((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Scroll to page section
  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // Click on a trending question in the right sidebar
  const handleTrendingClick = (faqId: string) => {
    // 1. Clear search and set category to All so the item is visible
    setSearchQuery("");
    setSelectedCategory("all");

    // 2. Open this specific accordion
    setOpenAccordions((prev) => ({
      ...prev,
      [faqId]: true,
    }));

    // 3. Scroll to the question card smoothly
    setTimeout(() => {
      const cardEl = document.getElementById(`faq-card-${faqId}`);
      if (cardEl) {
        cardEl.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 150);
  };

  // Filter FAQs based on active chip and search query
  const filteredFAQs = FAQ_DATA.filter((faq) => {
    const matchesCategory = selectedCategory === "all" || faq.category === selectedCategory;
    const matchesSearch =
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const totalPages = Math.ceil(filteredFAQs.length / itemsPerPage);
  const paginatedFAQs = filteredFAQs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Category statistics counts
  const categoryCounts = {
    practices: FAQ_DATA.filter(f => f.category === "practices").length,
    healing: FAQ_DATA.filter(f => f.category === "healing").length,
    spirituality: FAQ_DATA.filter(f => f.category === "spirituality").length,
    booking: FAQ_DATA.filter(f => f.category === "booking").length,
    general: FAQ_DATA.filter(f => f.category === "general").length,
  };

  return (
    <div className="faq-columns-layout" id="faq-root">

      {/* 1. MIDDLE COLUMN: Main Content */}
      <div className="faq-main-column">

        {/* Breadcrumbs */}
        <div className="faq-breadcrumbs">
          <span className="crumb-link" onClick={() => router.push("/blog")}>Blog</span>
          <span className="crumb-separator">›</span>
          <span className="crumb-active">FAQ & Help</span>
        </div>

        {/* Header Block with Crystal Ball illustration */}
        <div className="faq-hero-block" id="faq-header-section">
          <div className="hero-left">
            <span className="faq-badge">FAQ Blog</span>
            <h1 className="hero-title">Answers. Guidance.<br />Peace of Mind.</h1>
            <p className="hero-desc">
              Find clear, reliable answers to your questions about holistic healing, spiritual practices, and personal well-being.
            </p>
          </div>
          <div className="hero-right">
            <CrystalBallSVG />
          </div>
        </div>

        {/* Interactive Search input synced with layout search */}
        <div className="page-search-section">
          <div className="page-search-wrapper">
            <Search className="page-search-icon" size={18} strokeWidth={2} />
            <input
              type="text"
              placeholder="Search your question..."
              className="page-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                className="page-search-clear"
                onClick={() => setSearchQuery("")}
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Category Filter Chips */}
        <div className="category-chips-row">
          {categories.map((cat) => (
            <button
              key={cat}
              className={`category-chip ${selectedCategory === cat ? "active" : ""}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {CATEGORY_NAMES[cat]}
            </button>
          ))}
        </div>

        {/* Popular Questions Section */}
        <div className="faq-section-header" id="popular-questions">
          <Settings className="settings-gear-icon" size={20} strokeWidth={2} />
          <h2 className="section-title">Popular Questions</h2>
        </div>

        {/* Accordions List */}
        <div className="faq-accordions-list">
          {filteredFAQs.length === 0 ? (
            <div className="faq-empty-card">
              <HelpCircle className="empty-icon" size={40} />
              <p className="empty-title">No questions found</p>
              <p className="empty-desc">We couldn't find any results matching "{searchQuery}". Try editing your keyword search.</p>
              <Button variant="gold-outline" size="sm" onClick={() => { setSelectedCategory("all"); setSearchQuery(""); }}>
                Reset Filters
              </Button>
            </div>
          ) : (
            paginatedFAQs.map((faq) => {
              const isOpen = !!openAccordions[faq.id];
              return (
                <div
                  key={faq.id}
                  id={`faq-card-${faq.id}`}
                  className={`faq-accordion-card ${isOpen ? "open" : ""}`}
                >
                  <button
                    className="accordion-trigger"
                    onClick={() => toggleAccordion(faq.id)}
                    aria-expanded={isOpen}
                  >
                    <div className="trigger-left-content">
                      <div className="category-icon-circle">
                        {faq.category === "practices" && <Flower size={16} className="lucide-practices" />}
                        {faq.category === "healing" && <Sparkles size={16} className="lucide-healing" />}
                        {faq.category === "spirituality" && <Compass size={16} className="lucide-spirituality" />}
                        {faq.category === "booking" && <Calendar size={16} className="lucide-booking" />}
                        {faq.category === "general" && <HelpCircle size={16} className="lucide-general" />}
                      </div>
                      <span className="question-title-text">{faq.question}</span>
                    </div>
                    <div className="trigger-right-toggle">
                      {isOpen ? (
                        <Minus size={18} strokeWidth={2.5} />
                      ) : (
                        <Plus size={18} strokeWidth={2.5} />
                      )}
                    </div>
                  </button>

                  <div className={`accordion-collapse-wrapper ${isOpen ? "expanded" : "collapsed"}`}>
                    <div className="accordion-content-inner">
                      <div className="accordion-content-divider" />
                      <p className="faq-answer-paragraph">{faq.answer}</p>

                      <div className="faq-card-footer">
                        <div className="footer-tags">
                          <span className="footer-tag">
                            {faq.category === "practices" && <Flower size={12} />}
                            {faq.category === "healing" && <Sparkles size={12} />}
                            {faq.category === "spirituality" && <Compass size={12} />}
                            {faq.category === "booking" && <Calendar size={12} />}
                            {faq.category === "general" && <HelpCircle size={12} />}
                            <span className="tag-name">{CATEGORY_NAMES[faq.category]}</span>
                          </span>
                          <span className="footer-tag">
                            <MessageSquare size={12} />
                            <span className="tag-name">General</span>
                          </span>
                        </div>

                        {faq.verified && (
                          <div className="expert-verified-badge">
                            <Check size={12} className="check-check" />
                            <span>Expert Verified Answer</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="faq-pagination-controls">
            <button
              className="pagination-btn arrow-btn"
              onClick={() => { setCurrentPage(prev => Math.max(prev - 1, 1)); scrollToSection("popular-questions"); }}
              disabled={currentPage === 1}
            >
              ‹ Prev
            </button>

            <div className="pagination-numbers">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(num => (
                <button
                  key={num}
                  className={`pagination-btn number-btn ${currentPage === num ? "active" : ""}`}
                  onClick={() => { setCurrentPage(num); scrollToSection("popular-questions"); }}
                >
                  {num}
                </button>
              ))}
            </div>

            <button
              className="pagination-btn arrow-btn"
              onClick={() => { setCurrentPage(prev => Math.min(prev + 1, totalPages)); scrollToSection("popular-questions"); }}
              disabled={currentPage === totalPages}
            >
              Next ›
            </button>
          </div>
        )}

        <div className="category-cards-grid">
          {/* Card 1: Practices */}
          <div
            className={`category-grid-card practices-card ${selectedCategory === "practices" ? "selected" : ""}`}
            onClick={() => { setSelectedCategory("practices"); scrollToSection("faq-root"); }}
          >
            <div className="grid-card-icon-circle practices-circle">
              <Flower size={20} />
            </div>
            <div className="grid-card-info">
              <h4 className="grid-card-title">Practices</h4>
              <span className="grid-card-count">{categoryCounts.practices} Questions</span>
            </div>
          </div>

          {/* Card 2: Healing */}
          <div
            className={`category-grid-card healing-card ${selectedCategory === "healing" ? "selected" : ""}`}
            onClick={() => { setSelectedCategory("healing"); scrollToSection("faq-root"); }}
          >
            <div className="grid-card-icon-circle healing-circle">
              <Sparkles size={20} />
            </div>
            <div className="grid-card-info">
              <h4 className="grid-card-title">Healing</h4>
              <span className="grid-card-count">{categoryCounts.healing} Questions</span>
            </div>
          </div>

          {/* Card 3: Spirituality */}
          <div
            className={`category-grid-card spirituality-card ${selectedCategory === "spirituality" ? "selected" : ""}`}
            onClick={() => { setSelectedCategory("spirituality"); scrollToSection("faq-root"); }}
          >
            <div className="grid-card-icon-circle spirituality-circle">
              <Compass size={20} />
            </div>
            <div className="grid-card-info">
              <h4 className="grid-card-title">Spirituality</h4>
              <span className="grid-card-count">{categoryCounts.spirituality} Questions</span>
            </div>
          </div>

          {/* Card 4: Account & Booking */}
          <div
            className={`category-grid-card booking-card ${selectedCategory === "booking" ? "selected" : ""}`}
            onClick={() => { setSelectedCategory("booking"); scrollToSection("faq-root"); }}
          >
            <div className="grid-card-icon-circle booking-circle">
              <Calendar size={20} />
            </div>
            <div className="grid-card-info">
              <h4 className="grid-card-title">Account & Booking</h4>
              <span className="grid-card-count">{categoryCounts.booking} Questions</span>
            </div>
          </div>

          {/* Card 5: General */}
          <div
            className={`category-grid-card general-card ${selectedCategory === "general" ? "selected" : ""}`}
            onClick={() => { setSelectedCategory("general"); scrollToSection("faq-root"); }}
          >
            <div className="grid-card-icon-circle general-circle">
              <HelpCircle size={20} />
            </div>
            <div className="grid-card-info">
              <h4 className="grid-card-title">General</h4>
              <span className="grid-card-count">{categoryCounts.general} Questions</span>
            </div>
          </div>
        </div>

        {/* Load More Button */}
        <div className="load-more-container">
          <button className="load-more-btn" onClick={() => alert("All questions loaded successfully.")}>
            <span>Load More Questions</span>
            <ChevronDown size={14} />
          </button>
        </div>

        {/* bottom CTA Banner */}
        <div className="bottom-cta-banner" id="cta-section">
          <div className="cta-left">
            <h2 className="cta-title">Still can't find your answer?</h2>
            <p className="cta-desc">Our support team is here to help you on your healing journey.</p>
            <div className="cta-button-row">
              <button className="cta-btn-primary" onClick={() => router.push("/blog/quora-qa?focusAsk=true")}>
                <MessageSquare size={14} className="cta-btn-icon" />
                <span>Ask a Question</span>
              </button>
              <button className="cta-btn-secondary" onClick={() => router.push("/contact")}>
                Contact Support
              </button>
            </div>
          </div>
          <div className="cta-right">
            <CTALanternSVG />
          </div>
        </div>

      </div>

      {/* 2. RIGHT COLUMN: Page-specific Sidebar */}
      <div className="faq-right-column" id="consultation-section">

        {/* On This Page navigation */}
        <div className="sidebar-widget nav-widget">
          <h4 className="widget-title">
            <Compass size={16} strokeWidth={2.2} className="widget-icon" />
            <span>On This Page</span>
          </h4>
          <ul className="widget-nav-list">
            <li onClick={() => scrollToSection("popular-questions")}>
              <span className="bullet-dot" />
              <span>Popular Questions</span>
            </li>
            <li onClick={() => scrollToSection("browse-questions")}>
              <span className="bullet-dot" />
              <span>Browse All Questions</span>
            </li>
            <li onClick={() => scrollToSection("cta-section")}>
              <span className="bullet-dot" />
              <span>Can't Find Your Answer?</span>
            </li>
            <li onClick={() => scrollToSection("consultation-section")}>
              <span className="bullet-dot" />
              <span>Still Need Help?</span>
            </li>
          </ul>
        </div>

        {/* Wisdom Quote card */}
        <div className="sidebar-widget quote-widget">
          <Quote size={28} className="quote-icon-top" />
          <p className="quote-text">
            The question is not the problem. The answer is the beginning.
          </p>
          <span className="quote-author">— Ancient Wisdom</span>

          {/* Watermark Lotus icon absolute backdrop */}
          <div className="watermark-lotus">
            <svg viewBox="0 0 100 100" width="80" height="70">
              <path d="M50 25 C45 45 35 60 50 80 C65 60 55 45 50 25 Z" fill="none" stroke="#7c3aed" strokeWidth="2.5" strokeOpacity="0.08" />
              <path d="M50 80 C35 75 25 60 20 40 C35 50 45 60 50 80 Z" fill="none" stroke="#7c3aed" strokeWidth="2.5" strokeOpacity="0.08" />
              <path d="M50 80 C65 75 75 60 80 40 C65 50 55 60 50 80 Z" fill="none" stroke="#7c3aed" strokeWidth="2.5" strokeOpacity="0.08" />
            </svg>
          </div>
        </div>

        {/* Trending Questions Widget */}
        <div className="sidebar-widget trending-widget">
          <h4 className="widget-title">
            <Sparkles size={16} strokeWidth={2.2} className="widget-icon-pink" />
            <span>Trending Questions</span>
          </h4>

          <div className="trending-list">
            {/* Item 1 */}
            <div className="trending-item" onClick={() => handleTrendingClick("heal-1")}>
              <div className="trending-number">1</div>
              <div className="trending-info">
                <span className="trending-question">What is holistic healing?</span>
                <span className="trending-tag">Healing</span>
              </div>
            </div>

            {/* Item 2 */}
            <div className="trending-item" onClick={() => handleTrendingClick("heal-2")}>
              <div className="trending-number">2</div>
              <div className="trending-info">
                <span className="trending-question">What can I expect in a healing session?</span>
                <span className="trending-tag">Healing</span>
              </div>
            </div>

            {/* Item 3 */}
            <div className="trending-item" onClick={() => handleTrendingClick("book-1")}>
              <div className="trending-number">3</div>
              <div className="trending-info">
                <span className="trending-question">How do I book a consultation?</span>
                <span className="trending-tag">Account & Booking</span>
              </div>
            </div>

            {/* Item 4 */}
            <div className="trending-item" onClick={() => handleTrendingClick("prac-2")}>
              <div className="trending-number">4</div>
              <div className="trending-info">
                <span className="trending-question">Are your practices safe for beginners?</span>
                <span className="trending-tag">Practices</span>
              </div>
            </div>

            {/* Item 5 */}
            <div className="trending-item" onClick={() => handleTrendingClick("gen-1")}>
              <div className="trending-number">5</div>
              <div className="trending-info">
                <span className="trending-question">How can I contact customer support?</span>
                <span className="trending-tag">General</span>
              </div>
            </div>
          </div>

          <button className="trending-view-all-btn" onClick={() => setSelectedCategory("all")}>
            View All Trending
          </button>
        </div>

        {/* Need Personalized Help / Booking consultation widget */}
        <div className="sidebar-widget help-widget">
          <h4 className="widget-title">Need personalized help?</h4>

          {/* Avatar stack */}
          <div className="avatar-group">
            <img src="/images/anara.png" alt="Expert Healer" className="stacked-avatar shadow-sm" />
            <div className="stacked-avatar avatar-text-one">👩‍⚕️</div>
            <div className="stacked-avatar avatar-text-two">🧘‍♀️</div>
          </div>

          <p className="help-desc">
            Book a 1:1 session with our experts to get guidance tailored to your needs.
          </p>

          <button className="help-booking-btn" onClick={() => router.push("/booking")}>
            <Calendar size={14} className="booking-btn-icon" />
            <span>Book a Consultation</span>
          </button>

          {/* Watermark Lotus icon absolute backdrop */}
          <div className="watermark-lotus-bottom">
            <svg viewBox="0 0 100 100" width="70" height="60">
              <path d="M50 25 C45 45 35 60 50 80 C65 60 55 45 50 25 Z" fill="none" stroke="#7c3aed" strokeWidth="2.5" strokeOpacity="0.06" />
              <path d="M50 80 C35 75 25 60 20 40 C35 50 45 60 50 80 Z" fill="none" stroke="#7c3aed" strokeWidth="2.5" strokeOpacity="0.06" />
              <path d="M50 80 C65 75 75 60 80 40 C65 50 55 60 50 80 Z" fill="none" stroke="#7c3aed" strokeWidth="2.5" strokeOpacity="0.06" />
            </svg>
          </div>
        </div>

      </div>

      <style jsx>{`
        /* Core Two-Column Layout */
        .faq-columns-layout {
          display: grid;
          grid-template-columns: 1fr 280px;
          gap: 36px;
          width: 100%;
          align-items: flex-start;
        }

        /* 1. Middle Column styles */
        .faq-main-column {
          display: flex;
          flex-direction: column;
          gap: 0;
          min-width: 0;
        }

        /* Breadcrumbs */
        .faq-breadcrumbs {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.8rem;
          color: #9ca3af;
          margin-bottom: 16px;
        }
        .crumb-link {
          cursor: pointer;
          transition: color 0.2s;
        }
        .crumb-link:hover {
          color: #7c3aed;
        }
        .crumb-separator {
          color: #d1d5db;
        }
        .crumb-active {
          color: #6b7280;
          font-weight: 500;
        }

        /* Hero block */
        .faq-hero-block {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: transparent;
          margin-bottom: 24px;
          gap: 20px;
        }
        .hero-left {
          flex: 1;
        }
        .faq-badge {
          display: inline-block;
          font-family: var(--font-sans);
          font-size: 0.72rem;
          font-weight: 700;
          color: #7c3aed;
          background: #f5f3ff;
          padding: 4px 10px;
          border-radius: 12px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 12px;
        }
        .hero-title {
          font-family: var(--font-serif);
          font-size: 2.3rem;
          color: #1e1b4b;
          font-weight: 750 !important;
          line-height: 1.2 !important;
          margin-bottom: 12px;
        }
        .hero-desc {
          font-size: 0.92rem;
          color: #6b7280;
          line-height: 1.5;
          max-width: 480px;
          margin: 0;
        }
        .hero-right {
          flex-shrink: 0;
          display: flex;
          justify-content: center;
          align-items: center;
        }

        /* Page Search Input */
        .page-search-section {
          width: 100%;
          margin-bottom: 20px;
        }
        .page-search-wrapper {
          display: flex;
          align-items: center;
          background: #ffffff;
          border: 1px solid rgba(168, 85, 247, 0.15);
          border-radius: 30px;
          padding: 6px 18px;
          position: relative;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.015);
          transition: all 0.3s ease;
        }
        .page-search-wrapper:focus-within {
          border-color: #7c3aed;
          box-shadow: 0 4px 20px rgba(124, 58, 237, 0.08);
        }
        .page-search-icon {
          color: #a855f7;
          margin-right: 12px;
          flex-shrink: 0;
        }
        .page-search-input {
          flex: 1;
          border: none;
          background: transparent;
          outline: none;
          padding: 8px 0;
          font-family: var(--font-sans);
          font-size: 0.9rem;
          color: #1f2937;
        }
        .page-search-input::placeholder {
          color: #9ca3af;
        }
        .page-search-clear {
          border: none;
          background: transparent;
          color: #9ca3af;
          font-size: 0.8rem;
          cursor: pointer;
          padding: 4px;
          transition: color 0.2s;
        }
        .page-search-clear:hover {
          color: #ef4444;
        }

        /* Category chips */
        .category-chips-row {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 32px;
        }
        .category-chip {
          background: #ffffff;
          border: 1px solid rgba(168, 85, 247, 0.15);
          color: #4b5563;
          font-family: var(--font-sans);
          font-size: 0.82rem;
          font-weight: 600;
          padding: 6px 14px;
          border-radius: 30px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .category-chip:hover {
          border-color: #7c3aed;
          color: #7c3aed;
          background: #faf5ff;
        }
        .category-chip.active {
          background: #4c1d95;
          color: #ffffff;
          border-color: #4c1d95;
          box-shadow: 0 4px 10px rgba(76, 29, 149, 0.15);
        }

        /* Section header */
        .faq-section-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 20px;
          border-bottom: 1px solid rgba(168, 85, 247, 0.08);
          padding-bottom: 10px;
        }
        .faq-section-header-margin {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-top: 36px;
          margin-bottom: 20px;
          border-bottom: 1px solid rgba(168, 85, 247, 0.08);
          padding-bottom: 10px;
        }
        .settings-gear-icon {
          color: #a855f7;
        }
        .section-title {
          font-family: var(--font-serif);
          font-size: 1.45rem;
          font-weight: 700 !important;
          color: #1e1b4b;
          margin: 0;
        }

        /* Accordion Cards */
        .faq-accordions-list {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .faq-accordion-card {
          background: #ffffff;
          border: 1px solid rgba(168, 85, 247, 0.1);
          border-radius: 16px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.008);
          overflow: hidden;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .faq-accordion-card:hover {
          border-color: rgba(168, 85, 247, 0.25);
          box-shadow: 0 6px 18px rgba(124, 58, 237, 0.03);
        }
        .faq-accordion-card.open {
          border-color: rgba(168, 85, 247, 0.3);
          box-shadow: 0 8px 24px rgba(124, 58, 237, 0.04);
        }
        .accordion-trigger {
          display: flex;
          width: 100%;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          background: transparent;
          border: none;
          cursor: pointer;
          text-align: left;
        }
        .trigger-left-content {
          display: flex;
          align-items: center;
          gap: 14px;
          flex: 1;
        }
        .category-icon-circle {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .lucide-practices { color: #8b5cf6; }
        .lucide-healing { color: #ec4899; }
        .lucide-spirituality { color: #f59e0b; }
        .lucide-booking { color: #10b981; }
        .lucide-general { color: #3b82f6; }
        
        .faq-accordion-card .category-icon-circle {
          background: #faf5ff;
        }
        .question-title-text {
          font-family: var(--font-sans);
          font-size: 0.95rem;
          font-weight: 600;
          color: #1e1b4b;
          line-height: 1.4;
        }
        .trigger-right-toggle {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #faf5ff;
          color: #7c3aed;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-left: 12px;
          flex-shrink: 0;
          transition: background-color 0.2s;
        }
        .faq-accordion-card:hover .trigger-right-toggle {
          background: #f3e8ff;
        }
        
        .accordion-collapse-wrapper {
          overflow: hidden;
          transition: max-height 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.4s ease;
        }
        .accordion-collapse-wrapper.collapsed {
          max-height: 0;
          opacity: 0;
          pointer-events: none;
        }
        .accordion-collapse-wrapper.expanded {
          max-height: 800px;
          opacity: 1;
        }
        .accordion-content-inner {
          padding: 0 20px 18px 66px;
        }
        .accordion-content-divider {
          height: 1px;
          background: rgba(168, 85, 247, 0.06);
          margin-bottom: 12px;
        }
        .faq-answer-paragraph {
          font-family: var(--font-sans);
          font-size: 0.88rem;
          line-height: 1.6;
          color: #4b5563;
          margin: 0 0 16px;
        }
        
        .faq-card-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 12px;
        }
        .footer-tags {
          display: flex;
          gap: 6px;
        }
        .footer-tag {
          display: flex;
          align-items: center;
          gap: 4px;
          background: #f3f4f6;
          color: #4b5563;
          font-size: 0.72rem;
          font-weight: 500;
          padding: 3px 8px;
          border-radius: 6px;
        }
        .footer-tag :global(svg) {
          opacity: 0.6;
        }
        .expert-verified-badge {
          display: flex;
          align-items: center;
          gap: 4px;
          background: rgba(16, 185, 129, 0.05);
          border: 1px solid rgba(16, 185, 129, 0.15);
          color: #065f46;
          font-size: 0.72rem;
          font-weight: 600;
          padding: 3px 8px;
          border-radius: 6px;
        }
        .check-check {
          color: #10b981;
        }

        /* Empty list card */
        .faq-empty-card {
          background: #ffffff;
          border: 1px solid rgba(168, 85, 247, 0.1);
          border-radius: 20px;
          padding: 36px 20px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }
        .faq-empty-card :global(.empty-icon) {
          color: #a855f7;
          opacity: 0.4;
          margin-bottom: 4px;
        }
        .empty-title {
          font-family: var(--font-serif);
          font-size: 1.25rem;
          font-weight: 750 !important;
          color: #1e1b4b;
          margin: 0;
        }
        .empty-desc {
          font-size: 0.82rem;
          color: #6b7280;
          max-width: 320px;
          line-height: 1.4;
          margin-bottom: 10px;
        }

        /* Category Grid Section */
        .category-cards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }
        .category-grid-card {
          background: #ffffff;
          border: 1px solid rgba(168, 85, 247, 0.08);
          border-radius: 16px;
          padding: 16px 20px;
          display: flex;
          align-items: center;
          gap: 14px;
          cursor: pointer;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.005);
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .category-grid-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(124, 58, 237, 0.04);
        }
        .category-grid-card.selected {
          border-color: #7c3aed;
          background: #fdf4ff;
          box-shadow: 0 4px 15px rgba(124, 58, 237, 0.06);
        }
        .grid-card-icon-circle {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        
        /* Grid card color variations */
        .practices-circle { background: #f5f3ff; color: #7c3aed; }
        .healing-circle { background: #fdf2f8; color: #db2777; }
        .spirituality-circle { background: #fffbeb; color: #d97706; }
        .booking-circle { background: #ecfdf5; color: #059669; }
        .general-circle { background: #eff6ff; color: #2563eb; }

        .grid-card-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .grid-card-title {
          font-family: var(--font-sans);
          font-size: 0.88rem;
          font-weight: 700;
          color: #1f2937;
          margin: 0;
        }
        .grid-card-count {
          font-size: 0.75rem;
          color: #6b7280;
        }

        /* Load More Question button */
        .load-more-container {
          display: flex;
          justify-content: center;
          margin-top: 12px;
          margin-bottom: 40px;
        }
        .load-more-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          background: #ffffff;
          border: 1px solid rgba(168, 85, 247, 0.15);
          color: #7c3aed;
          font-family: var(--font-sans);
          font-size: 0.82rem;
          font-weight: 700;
          padding: 8px 16px;
          border-radius: 30px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .load-more-btn:hover {
          border-color: #7c3aed;
          background: #faf5ff;
          transform: translateY(1px);
        }

        /* Bottom CTA Banner */
        .bottom-cta-banner {
          background: linear-gradient(135deg, #1e1b4b 0%, #3b0764 100%);
          border-radius: 24px;
          padding: 32px 36px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 24px;
          color: #ffffff;
          box-shadow: 0 10px 30px rgba(59, 7, 100, 0.15);
          overflow: hidden;
          position: relative;
        }
        .bottom-cta-banner::before {
          content: "";
          position: absolute;
          width: 250px;
          height: 250px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(168, 85, 247, 0.15) 0%, transparent 70%);
          bottom: -80px;
          right: -40px;
          pointer-events: none;
        }
        .cta-left {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 10px;
          z-index: 2;
        }
        .cta-title {
          font-family: var(--font-serif);
          font-size: 1.75rem;
          color: #ffffff;
          font-weight: 750 !important;
          margin: 0;
          line-height: 1.25 !important;
        }
        .cta-desc {
          color: #d8b4fe;
          font-size: 0.9rem;
          line-height: 1.4;
          margin: 0;
        }
        .cta-button-row {
          display: flex;
          gap: 12px;
          margin-top: 10px;
          flex-wrap: wrap;
        }
        .cta-btn-primary {
          background: #7c3aed;
          color: #ffffff;
          border: none;
          padding: 10px 18px;
          border-radius: 12px;
          font-weight: 700;
          font-size: 0.82rem;
          font-family: var(--font-sans);
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: background-color 0.2s, transform 0.1s;
          box-shadow: 0 4px 12px rgba(124, 58, 237, 0.3);
        }
        .cta-btn-primary:hover {
          background: #6d28d9;
          transform: translateY(-1px);
        }
        .cta-btn-icon {
          flex-shrink: 0;
        }
        .cta-btn-secondary {
          background: transparent;
          color: #ffffff;
          border: 1px solid rgba(255, 255, 255, 0.4);
          padding: 10px 18px;
          border-radius: 12px;
          font-weight: 700;
          font-size: 0.82rem;
          font-family: var(--font-sans);
          cursor: pointer;
          transition: border-color 0.2s, background-color 0.2s;
        }
        .cta-btn-secondary:hover {
          border-color: #ffffff;
          background: rgba(255, 255, 255, 0.08);
        }
        .cta-right {
          flex-shrink: 0;
          z-index: 2;
        }

        /* 2. Right Sidebar widget styles */
        .faq-right-column {
          display: flex;
          flex-direction: column;
          gap: 20px;
          width: 100%;
        }
        .sidebar-widget {
          background: #ffffff;
          border: 1px solid rgba(168, 85, 247, 0.08);
          border-radius: 20px;
          padding: 24px 20px;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.005);
          position: relative;
          overflow: hidden;
        }

        .widget-title {
          font-family: var(--font-sans);
          font-size: 0.95rem;
          font-weight: 700;
          color: #1e1b4b;
          margin: 0 0 16px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .widget-icon {
          color: #7c3aed;
        }
        .widget-icon-pink {
          color: #db2777;
        }

        /* Navigation widget */
        .widget-nav-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .widget-nav-list li {
          font-family: var(--font-sans);
          font-size: 0.82rem;
          font-weight: 600;
          color: #4b5563;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: all 0.2s;
        }
        .bullet-dot {
          width: 5px;
          height: 5px;
          background: #d1d5db;
          border-radius: 50%;
          transition: background-color 0.2s, transform 0.2s;
        }
        .widget-nav-list li:hover {
          color: #7c3aed;
        }
        .widget-nav-list li:hover .bullet-dot {
          background: #7c3aed;
          transform: scale(1.3);
        }

        /* Quote Widget */
        .quote-widget {
          background: #fdf4ff;
          border-color: rgba(168, 85, 247, 0.06);
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .quote-icon-top {
          color: #a855f7;
          opacity: 0.25;
        }
        .quote-text {
          font-family: var(--font-serif);
          font-size: 1.1rem;
          font-style: italic;
          line-height: 1.5;
          color: #3b0764;
          margin: 0;
          z-index: 1;
        }
        .quote-author {
          font-size: 0.76rem;
          font-weight: 700;
          color: #7c3aed;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          z-index: 1;
        }
        .watermark-lotus {
          position: absolute;
          bottom: -15px;
          right: -10px;
          opacity: 0.45;
          pointer-events: none;
        }

        /* Trending Widget */
        .trending-list {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .trending-item {
          display: flex;
          gap: 12px;
          cursor: pointer;
          transition: transform 0.2s ease;
        }
        .trending-item:hover {
          transform: translateX(4px);
        }
        .trending-number {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: #7c3aed;
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.72rem;
          font-weight: 700;
          flex-shrink: 0;
          margin-top: 2px;
        }
        .trending-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-width: 0;
        }
        .trending-question {
          font-family: var(--font-sans);
          font-size: 0.8rem;
          font-weight: 600;
          color: #1f2937;
          line-height: 1.35;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          transition: color 0.2s ease;
        }
        .trending-item:hover .trending-question {
          color: #7c3aed;
        }
        .trending-tag {
          font-size: 0.7rem;
          color: #6b7280;
        }
        .trending-view-all-btn {
          width: 100%;
          background: transparent;
          border: 1px solid rgba(124, 58, 237, 0.35);
          color: #7c3aed;
          font-family: var(--font-sans);
          font-size: 0.8rem;
          font-weight: 700;
          padding: 8px;
          border-radius: 10px;
          cursor: pointer;
          margin-top: 16px;
          transition: all 0.2s;
        }
        .trending-view-all-btn:hover {
          background: #faf5ff;
          border-color: #7c3aed;
        }

        /* Help / Booking Widget */
        .help-widget {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 12px;
        }
        .help-widget .widget-title {
          font-family: var(--font-serif);
          font-size: 1.15rem;
          font-weight: 750 !important;
          color: #1e1b4b;
          margin: 0;
        }
        
        /* Avatar stack */
        .avatar-group {
          display: flex;
          justify-content: center;
          align-items: center;
          margin: 6px 0;
        }
        .stacked-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border: 2px solid #ffffff;
          object-fit: cover;
          margin-left: -8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.1rem;
          background: #f3e8ff;
          flex-shrink: 0;
        }
        .stacked-avatar:first-child {
          margin-left: 0;
          z-index: 3;
        }
        .avatar-text-one {
          z-index: 2;
          background: #fdf2f8;
        }
        .avatar-text-two {
          z-index: 1;
          background: #fffbeb;
        }

        .help-desc {
          font-size: 0.8rem;
          color: #6b7280;
          line-height: 1.45;
          margin: 0;
        }
        .help-booking-btn {
          width: 100%;
          background: #4c1d95;
          color: #ffffff;
          border: none;
          padding: 10px 16px;
          border-radius: 12px;
          font-weight: 700;
          font-size: 0.82rem;
          font-family: var(--font-sans);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          transition: background-color 0.2s, transform 0.1s;
          box-shadow: 0 4px 12px rgba(76, 29, 149, 0.2);
        }
        .help-booking-btn:hover {
          background: #3b0764;
          transform: translateY(-1px);
        }
        .booking-btn-icon {
          flex-shrink: 0;
        }
        .watermark-lotus-bottom {
          position: absolute;
          bottom: -15px;
          left: -15px;
          opacity: 0.35;
          pointer-events: none;
        }

        /* Pagination Controls */
        .faq-pagination-controls {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 16px;
          margin-top: 24px;
          margin-bottom: 24px;
        }
        .pagination-btn {
          background: #ffffff;
          border: 1px solid rgba(168, 85, 247, 0.15);
          color: #4c1d95;
          font-family: var(--font-sans);
          font-size: 0.85rem;
          font-weight: 700;
          padding: 8px 16px;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .pagination-btn:hover:not(:disabled) {
          border-color: #7c3aed;
          background: #faf5ff;
          transform: translateY(-1px);
        }
        .pagination-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
        .pagination-numbers {
          display: flex;
          gap: 8px;
        }
        .number-btn {
          width: 38px;
          height: 38px;
          padding: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
        }
        .number-btn.active {
          background: #4c1d95;
          color: #ffffff;
          border-color: #4c1d95;
          box-shadow: 0 4px 10px rgba(76, 29, 149, 0.15);
        }

        /* Responsiveness adjustments */
        @media (max-width: 1024px) {
          .faq-columns-layout {
            grid-template-columns: 1fr;
          }
          .faq-right-column {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
          }
          .quote-widget {
            display: none; /* Hide decorative quote on tablets to save space */
          }
        }

        @media (max-width: 640px) {
          .faq-right-column {
            grid-template-columns: 1fr;
          }
          .faq-hero-block {
            flex-direction: column;
            align-items: flex-start;
            text-align: left;
          }
          .hero-right {
            width: 100%;
            margin-top: 10px;
          }
          .hero-title {
            font-size: 1.8rem;
          }
          .accordion-content-inner {
            padding: 0 16px 16px 16px;
          }
          .bottom-cta-banner {
            flex-direction: column;
            align-items: stretch;
            padding: 24px;
          }
          .cta-right {
            display: flex;
            justify-content: center;
            margin-top: 12px;
          }
        }
      `}</style>

    </div>
  );
}
