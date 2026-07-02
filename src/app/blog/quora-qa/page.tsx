"use client";

import React, { useState, useRef, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  ArrowUp, ArrowDown, Check, MessageSquare, Share2, MoreHorizontal, Star,
  ThumbsUp, Heart, Smile, Image, Film, ChevronDown, Link, Award, Send,
  PlayCircle, Eye, Users, ChevronUp, Copy, CheckCircle2, AlertCircle, LogIn, X, PlusCircle,
  Trash2, Edit, ShieldAlert
} from "lucide-react";
import { Button } from "@/components/ui/Button";

interface HealerReply {
  id: string;
  author: string;
  avatar: string;
  role: string;
  isHealer: boolean;
  content: string;
  date: string;
  likes: number;
  likedByUser?: boolean;
}

interface CommentItem {
  id: string;
  author: string;
  avatar: string;
  role: string;
  content: string;
  date: string;
  likes: number;
  likedByUser?: boolean;
  replies: HealerReply[];
  showReplies: boolean;
}

interface QuestionItem {
  id: string;
  category: string;
  title: string;
  description: string;
  askedBy: string;
  askedByAvatar: string;
  date: string;
  views: string;
  followers: number;
  upvotes: number;
  commentsCount: number;
  upvotedByUser?: "up" | "down" | null;
  followedByUser?: boolean;
  bestAnswer?: {
    healerName: string;
    healerAvatar: string;
    healerRole: string;
    healerCredentials: string;
    date: string;
    content: string;
    bullets: string[];
    conclusion: string;
    likes: number;
    likedByUser?: boolean;
    thankedByUser?: boolean;
  };
  comments: CommentItem[];
}

function QuoraQAInner() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const threadId = searchParams.get("thread");
  const focusAsk = searchParams.get("focusAsk");

  // User Authentication State
  const [user, setUser] = useState<{ name: string; email: string; avatar: string } | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Admin and Question/Answer Management States
  const [isLoaded, setIsLoaded] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // Edit Question Modal State
  const [showEditQModal, setShowEditQModal] = useState(false);
  const [editQId, setEditQId] = useState("");
  const [editQTitle, setEditQTitle] = useState("");
  const [editQDesc, setEditQDesc] = useState("");
  const [editQCategory, setEditQCategory] = useState("Mind & Emotions");

  // Answer Modal State
  const [showAnswerModal, setShowAnswerModal] = useState(false);
  const [ansQId, setAnsQId] = useState("");
  const [ansHealerName, setAnsHealerName] = useState("Dr. Meera Sharma");
  const [ansHealerAvatar, setAnsHealerAvatar] = useState("/images/anara.png");
  const [ansHealerRole, setAnsHealerRole] = useState("Healer");
  const [ansHealerCredentials, setAnsHealerCredentials] = useState("Holistic Therapist • 12 years experience");
  const [ansContent, setAnsContent] = useState("");
  const [ansBulletsStr, setAnsBulletsStr] = useState("");
  const [ansConclusion, setAnsConclusion] = useState("");
  const [loginPurpose, setLoginPurpose] = useState<"comment" | "ask" | "like" | "generic">("generic");
  const [loginUsername, setLoginUsername] = useState("");
  const [loginEmail, setLoginEmail] = useState("");

  // Leaderboard Modal State
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  // New Question Form States
  const [newQTitle, setNewQTitle] = useState("");
  const [newQDesc, setNewQDesc] = useState("");
  const [newQCategory, setNewQCategory] = useState("Mind & Emotions");

  // New Comment State
  const [newComment, setNewComment] = useState("");
  const [sortBy, setSortBy] = useState("Newest");
  const [showSortDropdown, setShowSortDropdown] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const triggerToast = (msg: string) => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setToastMessage(msg);
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // Questions Database
  const [questions, setQuestions] = useState<QuestionItem[]>([
    {
      id: "anxiety-reduction",
      category: "Mind & Emotions",
      title: "How can I reduce anxiety naturally?",
      description: "Looking for natural and holistic ways to manage anxiety without medication.",
      askedBy: "Ananya",
      askedByAvatar: "🧘‍♀️",
      date: "May 10, 2025",
      views: "1.2K",
      followers: 23,
      upvotes: 128,
      commentsCount: 18,
      bestAnswer: {
        healerName: "Dr. Meera Sharma",
        healerAvatar: "/images/anara.png",
        healerRole: "Healer",
        healerCredentials: "Holistic Therapist • 12 years experience",
        date: "May 10, 2025",
        content: "Anxiety often stems from an overactive mind and nervous system. Here are some natural and holistic ways that truly help:",
        bullets: [
          "Breathwork: Practice 4-7-8 breathing or alternate nostril breathing daily.",
          "Meditation: 10–15 minutes of mindfulness meditation can calm your thoughts.",
          "Yoga: Gentle asanas like Child's Pose, Forward Fold, and Legs-Up-The-Wall help relax the body.",
          "Herbs: Ashwagandha, Brahmi, and Jatamansi are known to support the nervous system.",
          "Lifestyle: Regular sleep, a sattvic diet, sunlight, and digital detox are game changers."
        ],
        conclusion: "Consistency is the key. Start small, stay regular, and your mind will thank you.",
        likes: 86
      },
      comments: [
        {
          id: "c-1",
          author: "Ritika S.",
          avatar: "👩",
          role: "Community Member",
          content: "Breathwork has been life-changing for me. The 4-7-8 technique really helps at night!",
          date: "May 11, 2025",
          likes: 12,
          replies: [
            {
              id: "r-1-1",
              author: "Dr. Meera Sharma",
              avatar: "⚕️",
              role: "Holistic Therapist • Healer",
              isHealer: true,
              content: "So glad to hear that, Ritika! Consistency is magic ✨",
              date: "May 11, 2025",
              likes: 5
            }
          ],
          showReplies: true
        },
        {
          id: "c-2",
          author: "Arjun Patel",
          avatar: "👨",
          role: "Community Member",
          content: "Which time is best to do meditation for anxiety?",
          date: "May 11, 2025",
          likes: 2,
          replies: [
            {
              id: "r-2-1",
              author: "Dr. Meera Sharma",
              avatar: "⚕️",
              role: "Holistic Therapist • Healer",
              isHealer: true,
              content: "Early morning or right before bed works best for most people.",
              date: "May 11, 2025",
              likes: 4
            }
          ],
          showReplies: true
        },
        {
          id: "c-3",
          author: "Neha Verma",
          avatar: "👧",
          role: "Community Member",
          content: "Can diet really impact anxiety?",
          date: "May 12, 2025",
          likes: 2,
          replies: [
            {
              id: "r-3-1",
              author: "Dr. Meera Sharma",
              avatar: "⚕️",
              role: "Holistic Therapist • Healer",
              isHealer: true,
              content: "Absolutely! Avoid caffeine, sugar, and processed foods. Choose warm, home-cooked meals, include more greens, nuts, and herbal teas.",
              date: "May 12, 2025",
              likes: 6
            }
          ],
          showReplies: true
        }
      ]
    },
    {
      id: "pcos-chakra",
      category: "Chakra Healing",
      title: "Can chakra healing help PCOS symptoms?",
      description: "I've been dealing with PCOS-related hormone volatility and fatigue for a year. Can balancing the Lower Abdomen nodes help stabilize cortisol levels?",
      askedBy: "Aditi S.",
      askedByAvatar: "👩",
      date: "May 8, 2025",
      views: "950",
      followers: 12,
      upvotes: 42,
      commentsCount: 5,
      bestAnswer: {
        healerName: "Dr. Meera Sharma",
        healerAvatar: "/images/anara.png",
        healerRole: "Healer",
        healerCredentials: "Holistic Therapist • 12 years experience",
        date: "May 9, 2025",
        content: "Yes, absolutely. PCOS is heavily linked to nervous system hypersensitivity and high cortisol. By introducing focused chakra therapy, we soothe Svadhisthana (Sacral) and Muladhara (Root) nodes, calming fight-or-flight endocrine pathways:",
        bullets: [
          "Sacral Node Alignment: Practice Svadhisthana sound baths at 417Hz daily.",
          "Crystals Integration: Place Orange Calcite or Carnelian on the lower abdomen during guided meditations.",
          "Pranayama: Alternate nostril breathing for 10 minutes to calm the pituitary gland.",
          "Sattvic Diet: Reduce inflammatory foods, processed sugars, and high-caffeine beverages."
        ],
        conclusion: "Realigning lower energy nodes helps restore overall hormonal harmony. We recommend starting with a 3-week daily alignment practice.",
        likes: 32
      },
      comments: [
        {
          id: "c-p1",
          author: "Aditi S.",
          avatar: "👩",
          role: "Community Member",
          content: "Thank you for these crystal recommendations! I've started using Carnelian.",
          date: "May 10, 2025",
          likes: 8,
          replies: [],
          showReplies: false
        }
      ]
    },
    {
      id: "hands-warmth",
      category: "Aura & Energy",
      title: "What causes sudden warmth in palms during meditation?",
      description: "Sometimes during deep meditation, my palms start feeling extremely hot. Does this relate to reiki or active energy channels?",
      askedBy: "Rohan K.",
      askedByAvatar: "👨",
      date: "May 5, 2025",
      views: "720",
      followers: 8,
      upvotes: 28,
      commentsCount: 3,
      bestAnswer: {
        healerName: "Guru Dev",
        healerAvatar: "🧘",
        healerRole: "Energy Master",
        healerCredentials: "Kundalini Master • 15 years experience",
        date: "May 6, 2025",
        content: "This is a classical sign of prana (vital force) activation. Minor energy channels in your palms are opening up. Here is what is happening:",
        bullets: [
          "Prana Flow: Deep concentration directs energy downward and outward into the hand extremities.",
          "Minor Chakras Activation: The hand chakras are responsible for healing transmission and energy scanning.",
          "Thermal Transference: The warmth is a physical manifestation of high-frequency energy flow."
        ],
        conclusion: "You are ready to explore healing applications, such as Reiki or sound bowl projection. Embrace the warmth and focus on directing it intentionally.",
        likes: 19
      },
      comments: [
        {
          id: "c-h1",
          author: "Rohan K.",
          avatar: "👨",
          role: "Community Member",
          content: "This happens to me too! Good to know it is normal prana flow.",
          date: "May 7, 2025",
          likes: 4,
          replies: [],
          showReplies: false
        }
      ]
    },
    {
      id: "throat-chakra-blockage",
      category: "Chakra Healing",
      title: "How do I clear a blocked Throat Chakra (Vishuddha)?",
      description: "Lately I find it hard to express my feelings clearly and feel a constant tightness in my neck during conversations. Can sound healing help balance the Throat Chakra?",
      askedBy: "Meera K.",
      askedByAvatar: "👩",
      date: "May 3, 2025",
      views: "640",
      followers: 15,
      upvotes: 35,
      commentsCount: 2,
      bestAnswer: {
        healerName: "Dr. Meera Sharma",
        healerAvatar: "/images/anara.png",
        healerRole: "Healer",
        healerCredentials: "Holistic Therapist • 12 years experience",
        date: "May 4, 2025",
        content: "A blocked Throat Chakra (Vishuddha) directly restricts self-expression and truth. Sound therapy using the frequency of 741Hz or chanting the HAM seed mantra is highly effective to restore energy flow:",
        bullets: [
          "HAM Mantra: Chant the HAM sound for 10-15 minutes in a comfortable sitting posture.",
          "Blue Lace Agate: Place this crystal on your neck during throat chakra meditations.",
          "Sound Therapy: Listen to 741Hz Solfeggio frequency vibrations daily.",
          "Journaling: Practice uncensored stream-of-consciousness writing to release blocked emotions."
        ],
        conclusion: "Speak your truth gently, and let the sound vibrations wash away the mental blocks.",
        likes: 15
      },
      comments: []
    },
    {
      id: "protect-energy-crowds",
      category: "Aura & Energy",
      title: "How to protect my energy field in crowded places?",
      description: "As an empath, I feel extremely drained after visiting shopping malls or taking public transport. What crystals or practices can help shield my aura?",
      askedBy: "Kabir M.",
      askedByAvatar: "👨",
      date: "May 1, 2025",
      views: "810",
      followers: 18,
      upvotes: 56,
      commentsCount: 3,
      bestAnswer: {
        healerName: "Guru Dev",
        healerAvatar: "🧘",
        healerRole: "Energy Master",
        healerCredentials: "Kundalini Master • 15 years experience",
        date: "May 2, 2025",
        content: "Empaths naturally absorb the emotional energy of their surroundings. To shield your aura, you must establish clear boundaries and activate a protective energy shield before stepping out:",
        bullets: [
          "Aura Shielding: Visualize a bright white or violet sphere of light surrounding your body.",
          "Protective Crystals: Carry Black Tourmaline, Hematite, or Labradorite in your pocket.",
          "Salt Bath: Take a warm bath with Epsom salt after returning home to cleanse residual energy.",
          "Rooting Practice: Keep your feet flat on the ground and feel anchored to the Earth."
        ],
        conclusion: "A healthy aura acts as a filter, not a sponge. Shield daily and cleanse regularly.",
        likes: 24
      },
      comments: []
    },
    {
      id: "solfeggio-528hz-healing",
      category: "Meditation & Mindfulness",
      title: "What makes the 528Hz frequency so special for healing?",
      description: "I keep seeing 528Hz mentioned everywhere in sound healing videos as the 'Love Frequency' or 'Transformation Frequency'. What is the science behind it?",
      askedBy: "Sneha G.",
      askedByAvatar: "👧",
      date: "Apr 28, 2025",
      views: "1.1K",
      followers: 20,
      upvotes: 78,
      commentsCount: 4,
      bestAnswer: {
        healerName: "Dr. Meera Sharma",
        healerAvatar: "/images/anara.png",
        healerRole: "Healer",
        healerCredentials: "Holistic Therapist • 12 years experience",
        date: "Apr 29, 2025",
        content: "528Hz is one of the core Solfeggio frequencies. It is traditionally associated with cell regeneration and DNA repair, helping bring the body into a state of deep relaxation:",
        bullets: [
          "Cellular Resonance: Studies suggest sound at 528Hz stimulates cellular repair pathways.",
          "Solar Plexus Activation: This frequency realigns the Manipura chakra, boosting confidence.",
          "Stress Reduction: Sound baths at 528Hz reduce cortisol levels significantly within 20 minutes."
        ],
        conclusion: "Incorporate 528Hz meditation sessions into your evening routine for deep, restorative rest.",
        likes: 38
      },
      comments: []
    },
    {
      id: "self-reiki-stress",
      category: "Reiki Healing",
      title: "Can I perform self-Reiki for quick stress relief?",
      description: "I recently finished a Reiki Level 1 course but feel unsure how to execute a session on myself when feeling overwhelmed at work. What are the key hand positions?",
      askedBy: "Rahul V.",
      askedByAvatar: "👦",
      date: "Apr 25, 2025",
      views: "520",
      followers: 9,
      upvotes: 19,
      commentsCount: 1,
      bestAnswer: {
        healerName: "Guru Dev",
        healerAvatar: "🧘",
        healerRole: "Energy Master",
        healerCredentials: "Kundalini Master • 15 years experience",
        date: "Apr 26, 2025",
        content: "Yes, self-Reiki is a beautiful tool for immediate centering. Even a 5-minute session in your office chair can redirect nervous energy:",
        bullets: [
          "Center Yourself: Rub your hands together, place them over your heart, and set a clear healing intention.",
          "Third Eye / Crown Position: Place your hands gently on your forehead and eyes to quiet a racing mind.",
          "Throat & Heart Position: Place one hand on your throat and the other on your chest to balance emotional expression.",
          "Solar Plexus Position: Place hands on the upper abdomen to calm any physical anxiety sensations."
        ],
        conclusion: "Reiki flows wherever it is needed. Trust your hands, breathe deeply, and allow the energy to work.",
        likes: 12
      },
      comments: []
    },
    {
      id: "sound-bowls-insomnia",
      category: "Meditation & Mindfulness",
      title: "Do Tibetan singing bowls actually help with chronic insomnia?",
      description: "I've struggled with waking up at 3 AM for months. Will listening to Tibetan singing bowls or crystal bowls help me stay asleep?",
      askedBy: "Priya S.",
      askedByAvatar: "👩",
      date: "Apr 20, 2025",
      views: "930",
      followers: 25,
      upvotes: 62,
      commentsCount: 3,
      bestAnswer: {
        healerName: "Dr. Meera Sharma",
        healerAvatar: "/images/anara.png",
        healerRole: "Healer",
        healerCredentials: "Holistic Therapist • 12 years experience",
        date: "Apr 21, 2025",
        content: "Yes, sound bowls are highly effective for sleep disorders. They work by entraining brainwaves from active Beta states into slow Theta and Delta states associated with deep sleep:",
        bullets: [
          "Brainwave Entrainment: The slow harmonic frequencies induce alpha/theta states, quieting active thoughts.",
          "Vibrational Healing: The physical resonance relaxes tense muscle tissue and regulates breathing.",
          "Nighttime Ritual: Listen to crystal bowl audio for 30 minutes before sleep without screen exposure."
        ],
        conclusion: "Creating a dedicated sound-healing environment before bed transforms sleep quality over time.",
        likes: 41
      },
      comments: []
    }
  ]);

  // Load questions from localStorage or initialize with defaults
  useEffect(() => {
    const stored = localStorage.getItem("divingsanatan_quora_questions");
    if (stored) {
      try {
        setQuestions(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse stored questions", e);
      }
    }
    setIsLoaded(true);
  }, []);

  // Save questions to localStorage on changes
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("divingsanatan_quora_questions", JSON.stringify(questions));
    }
  }, [questions, isLoaded]);

  // Load User Auth Session & Periodically Check Admin Session
  useEffect(() => {
    const checkUser = () => {
      try {
        const session = localStorage.getItem("divingsanatan_user_session");
        if (session) {
          setUser(JSON.parse(session));
        } else {
          setUser(null);
        }
      } catch (e) {
        setUser(null);
      }
    };
    const checkAdmin = () => {
      const auth = window.sessionStorage.getItem("divingsanatan_admin_auth");
      setIsAdmin(auth === "true");
    };
    checkUser();
    checkAdmin();
    const timer = setInterval(() => {
      checkUser();
      checkAdmin();
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Handle URL parameters for ask-question focus
  useEffect(() => {
    if (focusAsk && !threadId) {
      const askTitleInput = document.getElementById("ask-title-input");
      if (askTitleInput) {
        askTitleInput.focus();
        askTitleInput.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [focusAsk, threadId]);

  // Clamp currentPage to totalPages if page goes out of bounds
  useEffect(() => {
    const totalPages = Math.ceil(questions.length / itemsPerPage);
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [questions.length, itemsPerPage, currentPage]);

  // Handle Authentication Mock Submission
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const name = loginUsername.trim() || "Amit Sharma";
    const email = loginEmail.trim() || "amit@example.com";

    const isHealer = name.toLowerCase().includes("healer") || name.toLowerCase().includes("meera") || name.toLowerCase().includes("dev") || email.toLowerCase().includes("admin");
    const avatar = isHealer ? (name.includes("Dev") ? "🧘" : "⚕️") : "👤";

    const sessionObj = { name, email, avatar, role: isHealer ? "Healer" : "Community Member" };
    localStorage.setItem("divingsanatan_user_session", JSON.stringify(sessionObj));
    setUser(sessionObj);

    if (isHealer) {
      window.sessionStorage.setItem("divingsanatan_admin_auth", "true");
      setIsAdmin(true);
    }

    setShowLoginModal(false);
    setLoginUsername("");
    setLoginEmail("");

    triggerToast(`Welcome to the community, ${name}!`);

    // Focus input based on purpose
    setTimeout(() => {
      if (loginPurpose === "comment") {
        const commentEl = document.getElementById("add-comment-input");
        if (commentEl) commentEl.focus();
      } else if (loginPurpose === "ask") {
        const askEl = document.getElementById("ask-title-input");
        if (askEl) askEl.focus();
      }
    }, 500);
  };

  // Navigating to listing page
  const navigateToListing = () => {
    router.push("/blog/quora-qa");
  };

  // Navigating to detail page
  const navigateToDetail = (qId: string) => {
    router.push(`/blog/quora-qa?thread=${qId}`);
  };

  // Asking a new question (must be logged in)
  const handlePostQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      router.push("/profile");
      return;
    }

    if (!newQTitle.trim()) return;

    const newQuestion: QuestionItem = {
      id: `q-${Date.now()}`,
      category: newQCategory,
      title: newQTitle.trim(),
      description: newQDesc.trim() || "Waiting for healer diagnostics...",
      askedBy: user.name,
      askedByAvatar: "👤",
      date: "Just now",
      views: "1",
      followers: 1,
      upvotes: 0,
      commentsCount: 0,
      comments: []
    };

    setQuestions([newQuestion, ...questions]);
    setNewQTitle("");
    setNewQDesc("");
    triggerToast("Your question has been posted to the board!");
    navigateToDetail(newQuestion.id);
  };

  // Admin Question and Answer Actions
  const handleOpenEditModal = (q: QuestionItem) => {
    setEditQId(q.id);
    setEditQTitle(q.title);
    setEditQDesc(q.description);
    setEditQCategory(q.category);
    setShowEditQModal(true);
  };

  const handleSaveEditQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    setQuestions(prev =>
      prev.map(q =>
        q.id === editQId
          ? {
            ...q,
            title: editQTitle.trim(),
            description: editQDesc.trim(),
            category: editQCategory
          }
          : q
      )
    );
    setShowEditQModal(false);
    triggerToast("Question details updated!");
  };

  const handleDeleteQuestion = (qId: string) => {
    if (!window.confirm("Are you sure you want to delete this question?")) return;
    setQuestions(prev => prev.filter(q => q.id !== qId));
    triggerToast("Question deleted from the board.");
    if (threadId === qId) {
      navigateToListing();
    }
  };

  const handleOpenAnswerModal = (q: QuestionItem) => {
    setAnsQId(q.id);
    if (q.bestAnswer) {
      setAnsHealerName(q.bestAnswer.healerName);
      setAnsHealerAvatar(q.bestAnswer.healerAvatar);
      setAnsHealerRole(q.bestAnswer.healerRole || "Healer");
      setAnsHealerCredentials(q.bestAnswer.healerCredentials);
      setAnsContent(q.bestAnswer.content);
      setAnsBulletsStr(q.bestAnswer.bullets.join("\n"));
      setAnsConclusion(q.bestAnswer.conclusion);
    } else {
      setAnsHealerName("Dr. Meera Sharma");
      setAnsHealerAvatar("/images/anara.png");
      setAnsHealerRole("Healer");
      setAnsHealerCredentials("Holistic Therapist • 12 years experience");
      setAnsContent("");
      setAnsBulletsStr("");
      setAnsConclusion("");
    }
    setShowAnswerModal(true);
  };

  const handleSaveAnswer = (e: React.FormEvent) => {
    e.preventDefault();
    const bullets = ansBulletsStr
      .split("\n")
      .map(b => b.trim())
      .filter(b => b.length > 0);

    setQuestions(prev =>
      prev.map(q => {
        if (q.id === ansQId) {
          return {
            ...q,
            bestAnswer: {
              healerName: ansHealerName.trim(),
              healerAvatar: ansHealerAvatar.trim(),
              healerRole: ansHealerRole.trim(),
              healerCredentials: ansHealerCredentials.trim(),
              date: q.bestAnswer?.date || "Just now",
              content: ansContent.trim(),
              bullets,
              conclusion: ansConclusion.trim(),
              likes: q.bestAnswer?.likes || 0,
              likedByUser: q.bestAnswer?.likedByUser || false,
              thankedByUser: q.bestAnswer?.thankedByUser || false
            }
          };
        }
        return q;
      })
    );
    setShowAnswerModal(false);
    triggerToast("Healer answer saved successfully!");
  };

  const handleDeleteAnswer = (qId: string) => {
    if (!window.confirm("Are you sure you want to remove the healer answer?")) return;
    setQuestions(prev =>
      prev.map(q => {
        if (q.id === qId) {
          const { bestAnswer, ...rest } = q;
          return rest as QuestionItem;
        }
        return q;
      })
    );
    triggerToast("Healer answer removed.");
  };

  // Details Page Operations
  const activeQuestion = questions.find(q => q.id === threadId) || questions[0];

  const handleQuestionUpvote = (qId: string) => {
    if (!user) {
      router.push("/profile");
      return;
    }
    setQuestions(prev =>
      prev.map(q => {
        if (q.id === qId) {
          const currentlyUpvoted = q.upvotedByUser;
          if (currentlyUpvoted === "up") {
            return { ...q, upvotedByUser: null, upvotes: q.upvotes - 1 };
          } else {
            const diff = currentlyUpvoted === "down" ? 2 : 1;
            return { ...q, upvotedByUser: "up", upvotes: q.upvotes + diff };
          }
        }
        return q;
      })
    );
    triggerToast("Vote updated!");
  };

  const handleQuestionDownvote = (qId: string) => {
    if (!user) {
      router.push("/profile");
      return;
    }
    setQuestions(prev =>
      prev.map(q => {
        if (q.id === qId) {
          const currentlyUpvoted = q.upvotedByUser;
          if (currentlyUpvoted === "down") {
            return { ...q, upvotedByUser: null, upvotes: q.upvotes + 1 };
          } else {
            const diff = currentlyUpvoted === "up" ? -2 : -1;
            return { ...q, upvotedByUser: "down", upvotes: q.upvotes + diff };
          }
        }
        return q;
      })
    );
  };

  const handleFollowQuestionToggle = (qId: string) => {
    if (!user) {
      router.push("/profile");
      return;
    }
    setQuestions(prev =>
      prev.map(q => {
        if (q.id === qId) {
          const followed = !q.followedByUser;
          return {
            ...q,
            followedByUser: followed,
            followers: followed ? q.followers + 1 : q.followers - 1
          };
        }
        return q;
      })
    );
    const q = questions.find(item => item.id === qId);
    if (q) {
      triggerToast(!q.followedByUser ? "Now following this question!" : "Unfollowed question");
    }
  };

  const handleBestAnswerLikeToggle = (qId: string) => {
    if (!user) {
      router.push("/profile");
      return;
    }
    setQuestions(prev =>
      prev.map(q => {
        if (q.id === qId && q.bestAnswer) {
          const liked = !q.bestAnswer.likedByUser;
          return {
            ...q,
            bestAnswer: {
              ...q.bestAnswer,
              likedByUser: liked,
              likes: liked ? q.bestAnswer.likes + 1 : q.bestAnswer.likes - 1
            }
          };
        }
        return q;
      })
    );
  };

  const handleBestAnswerThank = (qId: string) => {
    if (!user) {
      router.push("/profile");
      return;
    }
    setQuestions(prev =>
      prev.map(q => {
        if (q.id === qId && q.bestAnswer) {
          const thanked = !q.bestAnswer.thankedByUser;
          if (thanked) {
            triggerToast("Sent appreciation to healer!");
          }
          return {
            ...q,
            bestAnswer: {
              ...q.bestAnswer,
              thankedByUser: thanked
            }
          };
        }
        return q;
      })
    );
  };

  const handlePostComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      router.push("/profile");
      return;
    }

    if (!newComment.trim()) return;

    const newCommentObj: CommentItem = {
      id: `c-${Date.now()}`,
      author: user.name,
      avatar: "👤",
      role: "Community Member",
      content: newComment.trim(),
      date: "Just now",
      likes: 0,
      replies: [],
      showReplies: true
    };

    setQuestions(prev =>
      prev.map(q => {
        if (q.id === threadId) {
          return {
            ...q,
            commentsCount: q.commentsCount + 1,
            comments: [newCommentObj, ...q.comments]
          };
        }
        return q;
      })
    );

    setNewComment("");
    triggerToast("Your comment has been added!");
  };

  const handleLikeComment = (commentId: string) => {
    if (!user) {
      router.push("/profile");
      return;
    }
    setQuestions(prev =>
      prev.map(q => {
        if (q.id === threadId) {
          return {
            ...q,
            comments: q.comments.map(c => {
              if (c.id === commentId) {
                const liked = !c.likedByUser;
                return {
                  ...c,
                  likedByUser: liked,
                  likes: liked ? c.likes + 1 : c.likes - 1
                };
              }
              return c;
            })
          };
        }
        return q;
      })
    );
  };

  const handleLikeReply = (commentId: string, replyId: string) => {
    if (!user) {
      router.push("/profile");
      return;
    }
    setQuestions(prev =>
      prev.map(q => {
        if (q.id === threadId) {
          return {
            ...q,
            comments: q.comments.map(c => {
              if (c.id === commentId) {
                return {
                  ...c,
                  replies: c.replies.map(r => {
                    if (r.id === replyId) {
                      const liked = !r.likedByUser;
                      return {
                        ...r,
                        likedByUser: liked,
                        likes: liked ? r.likes + 1 : r.likes - 1
                      };
                    }
                    return r;
                  })
                };
              }
              return c;
            })
          };
        }
        return q;
      })
    );
  };

  const toggleReplies = (commentId: string) => {
    setQuestions(prev =>
      prev.map(q => {
        if (q.id === threadId) {
          return {
            ...q,
            comments: q.comments.map(c => c.id === commentId ? { ...c, showReplies: !c.showReplies } : c)
          };
        }
        return q;
      })
    );
  };

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      triggerToast("Discussion link copied to clipboard!");
    }
  };

  const focusCommentInput = () => {
    const el = document.getElementById("add-comment-input");
    if (el) {
      el.focus();
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  return (
    <div className="qa-detail-page">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="toast-notification">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Admin Mode active banner */}
      {isAdmin && (
        <div className="admin-status-banner glass-panel" style={{ marginBottom: '20px' }}>
          <div className="admin-status-content">
            <span className="admin-pulse-dot"></span>
            <span className="admin-status-text">
              <strong>Administrator Mode Active</strong> — You can edit or delete any question, and write certified healer answers.
            </span>
          </div>
          <button
            className="admin-logout-trigger-btn"
            onClick={() => {
              window.sessionStorage.removeItem("divingsanatan_admin_auth");
              setIsAdmin(false);
              triggerToast("Logged out of Admin Mode");
            }}
          >
            Exit Admin Mode
          </button>
        </div>
      )}

      {/* Breadcrumbs */}
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <span className="breadcrumb-item" onClick={navigateToListing}>Blog</span>
        <span className="breadcrumb-separator">&gt;</span>
        <span className="breadcrumb-item" onClick={navigateToListing}>Q&A Community</span>
        {threadId && (
          <>
            <span className="breadcrumb-separator">&gt;</span>
            <span className="breadcrumb-item active">{activeQuestion.title}</span>
          </>
        )}
      </nav>

      {/* Main Two-Column Content Grid */}
      <div className="qa-layout-grid">

        {/* Left Column: Listings or Details depending on threadId */}
        <div className="qa-main-column">

          {!threadId ? (
            /* Q&A COMMUNITY LISTINGS HOME */
            <div className="qa-listings-view">
              <div className="qa-header-card-mini glass-panel">
                <h1 className="page-main-title">Q&A Community Board</h1>
                <p className="page-main-subtitle">
                  Ask our certified practitioners questions about energy alignment, sound therapy, and crystals.
                </p>
              </div>

              {/* Ask a Question Card */}
              <div className="ask-question-container glass-panel">
                {user ? (
                  <form onSubmit={handlePostQuestion} className="ask-q-form">
                    <div className="form-header-row">
                      <PlusCircle size={20} className="purple-icon" />
                      <h3 className="form-title">Ask the community and healers</h3>
                    </div>

                    <div className="input-group">
                      <label htmlFor="ask-title-input">Question title</label>
                      <input
                        id="ask-title-input"
                        type="text"
                        placeholder="e.g. What is the best crystal for Sacral Chakra balancing?"
                        value={newQTitle}
                        onChange={(e) => setNewQTitle(e.target.value)}
                        className="glass-input ask-input"
                        required
                      />
                    </div>

                    <div className="input-group">
                      <label htmlFor="ask-desc-input">Additional context or description</label>
                      <textarea
                        id="ask-desc-input"
                        rows={2}
                        placeholder="Provide details about what you are experiencing..."
                        value={newQDesc}
                        onChange={(e) => setNewQDesc(e.target.value)}
                        className="glass-input ask-textarea"
                      />
                    </div>

                    <div className="form-footer-row">
                      <div className="select-wrapper">
                        <label htmlFor="ask-category-select">Category</label>
                        <select
                          id="ask-category-select"
                          value={newQCategory}
                          onChange={(e) => setNewQCategory(e.target.value)}
                          className="category-dropdown"
                        >
                          <option value="Mind & Emotions">Mind & Emotions</option>
                          <option value="Chakra Healing">Chakra Healing</option>
                          <option value="Aura & Energy">Aura & Energy</option>
                          <option value="Meditation & Mindfulness">Meditation & Mindfulness</option>
                          <option value="Reiki Healing">Reiki Healing</option>
                        </select>
                      </div>

                      <button type="submit" className="submit-q-btn">
                        Post Question
                      </button>
                    </div>
                  </form>
                ) : ""}
              </div>

              {/* Active Discussions List */}
              <div className="listings-section">
                <h2 className="listings-heading">Active discussions</h2>

                <div className="discussions-list">
                  {questions.map((q) => (
                    <div key={q.id} className="discussion-card glass-panel hover-glow">
                      <div className="card-top-row">
                        <div className="card-top-left">
                          <span className="category-tag-small">{q.category}</span>
                          <span className="asked-by-tag">Asked by <strong>{q.askedBy}</strong></span>
                        </div>
                        {isAdmin && (
                          <div className="card-admin-actions">
                            <button
                              className="admin-inline-btn edit-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenEditModal(q);
                              }}
                              title="Edit Question"
                            >
                              <Edit size={12} />
                            </button>
                            <button
                              className="admin-inline-btn delete-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteQuestion(q.id);
                              }}
                              title="Delete Question"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        )}
                      </div>

                      <h3 className="discussion-card-title" onClick={() => navigateToDetail(q.id)}>
                        {q.title}
                      </h3>
                      <p className="discussion-card-desc">
                        {q.description}
                      </p>

                      <div className="card-bottom-row">
                        <div className="card-stats">
                          <span>{q.upvotes} Upvotes</span>
                          <span>•</span>
                          <span>{q.commentsCount} Comments</span>
                          <span>•</span>
                          <span>{q.views} Views</span>
                        </div>

                        <button
                          className="read-discussion-btn"
                          onClick={() => navigateToDetail(q.id)}
                        >
                          Read Answers &rarr;
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Q&A THREAD DETAIL VIEW */
            <div className="qa-detail-view">
              {/* Question Header Card */}
              <div className="question-header-card glass-panel">
                <div className="q-badge-row">
                  <span className="category-tag">{activeQuestion.category}</span>
                </div>

                <div className="q-title-section">
                  <div className="q-title-left">
                    <h1 className="question-main-title">{activeQuestion.title}</h1>
                    <p className="question-desc-text">{activeQuestion.description}</p>
                  </div>
                  <div className="meditation-avatar-wrapper">
                    <img
                      src="/images/meditation_aura.png"
                      alt="Meditation Aura"
                      className="meditation-aura-graphic"
                    />
                  </div>
                </div>

                {/* Author details */}
                <div className="q-author-row">
                  <div className="author-info">
                    <div className="author-avatar">{activeQuestion.askedByAvatar}</div>
                    <div className="author-meta-details">
                      <span className="author-name">{activeQuestion.askedBy}</span>
                      <span className="meta-text">• Asked {activeQuestion.date} • in <span className="highlight-category">{activeQuestion.category}</span></span>
                    </div>
                  </div>

                  <div className="author-actions">
                    <button
                      className={`follow-author-btn ${activeQuestion.followedByUser ? "active" : ""}`}
                      onClick={() => handleFollowQuestionToggle(activeQuestion.id)}
                    >
                      {activeQuestion.followedByUser ? "Following" : "Follow"}
                    </button>
                    <button className="icon-action-btn" aria-label="More options">
                      <MoreHorizontal size={18} />
                    </button>
                  </div>
                </div>

                {/* Action Bar */}
                <div className="question-action-bar">
                  <div className="vote-button-group">
                    <button
                      className={`vote-btn upvote ${activeQuestion.upvotedByUser === "up" ? "active" : ""}`}
                      onClick={() => handleQuestionUpvote(activeQuestion.id)}
                      aria-label="Upvote question"
                    >
                      <ArrowUp size={16} />
                      <span className="vote-count">{activeQuestion.upvotes}</span>
                    </button>
                    <button
                      className={`vote-btn downvote ${activeQuestion.upvotedByUser === "down" ? "active" : ""}`}
                      onClick={() => handleQuestionDownvote(activeQuestion.id)}
                      aria-label="Downvote question"
                    >
                      <ArrowDown size={16} />
                    </button>
                  </div>

                  <div className="best-answer-badge">
                    <CheckCircle2 size={16} className="chk-icon" />
                    <span>Best Answer</span>
                  </div>

                  <button className="action-link-btn" onClick={focusCommentInput}>
                    <MessageSquare size={16} />
                    <span>{activeQuestion.commentsCount} Comments</span>
                  </button>

                  <button className="action-link-btn" onClick={handleCopyLink}>
                    <Share2 size={16} />
                    <span>Share</span>
                  </button>

                  <button className="icon-action-btn" aria-label="More options">
                    <MoreHorizontal size={18} />
                  </button>
                </div>
                {isAdmin && (
                  <div className="admin-thread-actions">
                    <button
                      className="admin-action-pill edit"
                      onClick={() => handleOpenEditModal(activeQuestion)}
                    >
                      <Edit size={14} />
                      <span>Edit Question</span>
                    </button>
                    <button
                      className="admin-action-pill delete"
                      onClick={() => handleDeleteQuestion(activeQuestion.id)}
                    >
                      <Trash2 size={14} />
                      <span>Delete Question</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Best Answer Card */}
              {activeQuestion.bestAnswer && (
                <div className="best-answer-card glass-panel">
                  <div className="best-answer-badge-header">
                    <Star size={16} fill="#a855f7" color="#a855f7" />
                    <span>Best Answer</span>
                  </div>

                  {/* Healer Header Info */}
                  <div className="healer-header-row">
                    <div className="healer-profile-box">
                      <div className="healer-avatar-circle">
                        {activeQuestion.bestAnswer.healerAvatar.startsWith("/") ? (
                          <img
                            src={activeQuestion.bestAnswer.healerAvatar}
                            alt={activeQuestion.bestAnswer.healerName}
                            className="healer-avatar-img"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="fallback-avatar-text">{activeQuestion.bestAnswer.healerAvatar}</div>
                        )}
                      </div>
                      <div className="healer-profile-details">
                        <div className="healer-name-row">
                          <span className="healer-name">{activeQuestion.bestAnswer.healerName}</span>
                          <span className="healer-tag-pill">Healer</span>
                        </div>
                        <span className="healer-credentials">{activeQuestion.bestAnswer.healerCredentials}</span>
                      </div>
                    </div>

                    <div className="healer-date">{activeQuestion.bestAnswer.date}</div>
                  </div>

                  {/* Answer Content */}
                  <div className="best-answer-body">
                    <p className="answer-intro">{activeQuestion.bestAnswer.content}</p>

                    <ul className="bullet-points-list">
                      {activeQuestion.bestAnswer.bullets.map((bullet, idx) => {
                        const parts = bullet.split(":");
                        if (parts.length > 1) {
                          return (
                            <li key={idx}>
                              <span className="bullet-topic">{parts[0]}:</span>
                              {parts.slice(1).join(":")}
                            </li>
                          );
                        }
                        return <li key={idx}>{bullet}</li>;
                      })}
                    </ul>

                    <p className="answer-conclusion">{activeQuestion.bestAnswer.conclusion}</p>
                  </div>

                  {/* Liked row */}
                  <div className="liked-row">
                    <div className="stacked-avatars">
                      <span className="stack-avatar sat-1">👩</span>
                      <span className="stack-avatar sat-2">🧔</span>
                      <span className="stack-avatar sat-3">👧</span>
                    </div>
                    <span className="liked-text">Liked by {activeQuestion.bestAnswer.likes} people</span>
                  </div>

                  {/* Interactions Bar */}
                  <div className="answer-actions-bar">
                    <button
                      className={`interaction-btn like-btn ${activeQuestion.bestAnswer.likedByUser ? "active" : ""}`}
                      onClick={() => handleBestAnswerLikeToggle(activeQuestion.id)}
                    >
                      <ThumbsUp size={16} />
                      <span>Like ({activeQuestion.bestAnswer.likes})</span>
                    </button>

                    <button className="interaction-btn" onClick={focusCommentInput}>
                      <MessageSquare size={16} />
                      <span>Reply</span>
                    </button>

                    <button className="interaction-btn" onClick={handleCopyLink}>
                      <Share2 size={16} />
                      <span>Share</span>
                    </button>

                    <button
                      className={`interaction-btn thank-btn ${activeQuestion.bestAnswer.thankedByUser ? "active" : ""}`}
                      onClick={() => handleBestAnswerThank(activeQuestion.id)}
                    >
                      <Heart size={16} fill={activeQuestion.bestAnswer.thankedByUser ? "#ec4899" : "none"} color={activeQuestion.bestAnswer.thankedByUser ? "#ec4899" : "currentColor"} />
                      <span>Thank you!</span>
                    </button>

                    <button className="icon-action-btn" aria-label="More options">
                      <MoreHorizontal size={18} />
                    </button>
                    {isAdmin && (
                      <>
                        <button
                          className="interaction-btn admin-edit-ans"
                          onClick={() => handleOpenAnswerModal(activeQuestion)}
                        >
                          <Edit size={14} style={{ marginRight: '4px' }} />
                          <span>Edit Answer</span>
                        </button>
                        <button
                          className="interaction-btn admin-delete-ans"
                          onClick={() => handleDeleteAnswer(activeQuestion.id)}
                        >
                          <Trash2 size={14} style={{ marginRight: '4px' }} />
                          <span>Remove Answer</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}

              {!activeQuestion.bestAnswer && (
                <div className="no-answer-card glass-panel" style={{ margin: '20px 0' }}>
                  <div className="no-answer-content">
                    <Star size={24} className="star-icon-muted" />
                    <div className="no-answer-text">
                      <h4 className="no-answer-title">Pending Practitioner Guidance</h4>
                      <p className="no-answer-desc">No certified healer has provided a structured answer yet.</p>
                    </div>
                  </div>
                  {isAdmin && (
                    <button
                      className="provide-answer-btn"
                      onClick={() => handleOpenAnswerModal(activeQuestion)}
                    >
                      🩺 Provide Healer Answer
                    </button>
                  )}
                </div>
              )}

              {/* Comments Thread Section */}
              <div className="comments-thread-section">
                <div className="comments-header">
                  <h3 className="comments-count-title">{activeQuestion.commentsCount} Comments</h3>

                  <div className="sort-dropdown-container">
                    <button
                      className="sort-dropdown-btn"
                      onClick={() => setShowSortDropdown(!showSortDropdown)}
                    >
                      <span>Sort by: <strong>{sortBy}</strong></span>
                      <ChevronDown size={14} />
                    </button>
                    {showSortDropdown && (
                      <div className="sort-menu glass-panel">
                        <button onClick={() => { setSortBy("Newest"); setShowSortDropdown(false); }}>Newest</button>
                        <button onClick={() => { setSortBy("Top Liked"); setShowSortDropdown(false); }}>Top Liked</button>
                        <button onClick={() => { setSortBy("Oldest"); setShowSortDropdown(false); }}>Oldest</button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Add Comment Input Form */}
                <form onSubmit={handlePostComment} className="add-comment-box glass-panel">
                  <div className="user-avatar-small">{user ? "👤" : "🕉️"}</div>
                  <div className="comment-input-area">
                    <textarea
                      id="add-comment-input"
                      rows={1}
                      placeholder={user ? "Add a thoughtful comment..." : "Sign in to join the discussion and post comments..."}
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      onClick={() => {
                        if (!user) {
                          setLoginPurpose("comment");
                          setShowLoginModal(true);
                        }
                      }}
                      className="comment-textarea"
                    />
                    <div className="comment-toolbar">
                      <div className="toolbar-icons">
                        <button type="button" className="toolbar-icon-btn" aria-label="Add emoji"><Smile size={16} /></button>
                        <button type="button" className="toolbar-icon-btn" aria-label="Add image"><Image size={16} /></button>
                        <button type="button" className="toolbar-icon-btn" aria-label="Add video"><Film size={16} /></button>
                      </div>
                      <button type="submit" className="comment-submit-btn">Comment</button>
                    </div>
                  </div>
                </form>

                {/* Comments List */}
                <div className="comments-list">
                  {activeQuestion.comments.map((comment) => (
                    <div key={comment.id} className="comment-item-container">
                      {/* Top-level Comment */}
                      <div className="comment-card">
                        <div className="comment-header-row">
                          <div className="commenter-profile">
                            <div className="commenter-avatar">{comment.avatar}</div>
                            <div className="commenter-details">
                              <span className="commenter-name">{comment.author}</span>
                              <span className="comment-date">{comment.date}</span>
                            </div>
                          </div>
                          <button className="icon-action-btn" aria-label="Options">
                            <MoreHorizontal size={14} />
                          </button>
                        </div>

                        <p className="comment-content-text">{comment.content}</p>

                        <div className="comment-actions-row">
                          <button
                            className={`comment-act-btn ${comment.likedByUser ? "active" : ""}`}
                            onClick={() => {
                              if (!user) {
                                setLoginPurpose("generic");
                                setShowLoginModal(true);
                              } else {
                                handleLikeComment(comment.id);
                              }
                            }}
                          >
                            <Heart size={14} fill={comment.likedByUser ? "#ef4444" : "none"} color={comment.likedByUser ? "#ef4444" : "currentColor"} />
                            <span>Like ({comment.likes})</span>
                          </button>
                          <button className="comment-act-btn" onClick={focusCommentInput}>
                            <span>Reply</span>
                          </button>
                          <button className="comment-act-btn" onClick={handleCopyLink}>
                            <span>Share</span>
                          </button>
                        </div>
                      </div>

                      {/* Nested Replies */}
                      {comment.replies && comment.replies.length > 0 && comment.showReplies && (
                        <div className="nested-replies-list">
                          {comment.replies.map((reply) => (
                            <div key={reply.id} className="reply-card">
                              <div className="comment-header-row">
                                <div className="commenter-profile">
                                  <div className="commenter-avatar reply-healer-avatar">{reply.avatar}</div>
                                  <div className="commenter-details">
                                    <div className="commenter-name-row">
                                      <span className="commenter-name">{reply.author}</span>
                                      {reply.isHealer && <span className="reply-healer-badge">Healer</span>}
                                    </div>
                                    <span className="comment-date">{reply.date}</span>
                                  </div>
                                </div>
                                <button className="icon-action-btn" aria-label="Options">
                                  <MoreHorizontal size={14} />
                                </button>
                              </div>

                              <p className="comment-content-text">{reply.content}</p>

                              <div className="comment-actions-row">
                                <button
                                  className={`comment-act-btn ${reply.likedByUser ? "active" : ""}`}
                                  onClick={() => {
                                    if (!user) {
                                      setLoginPurpose("generic");
                                      setShowLoginModal(true);
                                    } else {
                                      handleLikeReply(comment.id, reply.id);
                                    }
                                  }}
                                >
                                  <Heart size={14} fill={reply.likedByUser ? "#ef4444" : "none"} color={reply.likedByUser ? "#ef4444" : "currentColor"} />
                                  <span>Like ({reply.likes})</span>
                                </button>
                                <button className="comment-act-btn" onClick={focusCommentInput}>
                                  <span>Reply</span>
                                </button>
                                <button className="comment-act-btn" onClick={handleCopyLink}>
                                  <span>Share</span>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Toggle Replies button */}
                      {comment.replies && comment.replies.length > 0 && (
                        <button
                          className="view-replies-toggle-btn"
                          onClick={() => toggleReplies(comment.id)}
                        >
                          {comment.showReplies ? (
                            <>
                              <ChevronUp size={14} />
                              <span>Hide reply</span>
                            </>
                          ) : (
                            <>
                              <ChevronDown size={14} />
                              <span>View {comment.replies.length} reply</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Load More Button */}
                <div className="load-more-container">
                  <button className="load-more-btn" onClick={() => triggerToast("Loading more comments...")}>
                    <span>Load More Comments</span>
                    <ChevronDown size={16} />
                  </button>
                </div>
              </div>

              {/* Back to List banner */}
              <div className="bottom-promo-banner-card">
                <div className="banner-content-box">
                  <h2 className="banner-title">Done reading? Explore more questions.</h2>
                  <p className="banner-subtitle">
                    Go back to our community board to see other energy and wellness discussions.
                  </p>
                  <button className="banner-ask-btn" onClick={navigateToListing}>
                    <span>Back to Q&A Board</span>
                  </button>
                </div>
                <div className="banner-bubbles-graphic">
                  <div className="speech-bubble bubble-left">
                    <div className="dot"></div>
                    <div className="dot"></div>
                    <div className="dot"></div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Sidebar Stats, Quotes, Related Questions, Top Contributors, Share */}
        <aside className="qa-right-column">
          {/* About Q&A Board (Home view) or About this Question (Details view) */}
          <div className="qa-right-card glass-panel">
            <h4 className="right-card-title">{threadId ? "About this question" : "About the Board"}</h4>

            {threadId ? (
              <div className="about-stats-list">
                <div className="about-stat-item">
                  <div className="stat-avatar-circle">👩</div>
                  <div className="stat-info">
                    <span className="stat-label">Asked by</span>
                    <span className="stat-value">{activeQuestion.askedBy}</span>
                  </div>
                </div>

                <div className="about-stat-item">
                  <div className="stat-icon-circle"><Award size={14} /></div>
                  <div className="stat-info">
                    <span className="stat-label">Category</span>
                    <span className="stat-value text-highlight">{activeQuestion.category}</span>
                  </div>
                </div>

                <div className="about-stat-item">
                  <div className="stat-icon-circle"><Eye size={14} /></div>
                  <div className="stat-info">
                    <span className="stat-label">Views</span>
                    <span className="stat-value">{activeQuestion.views} views</span>
                  </div>
                </div>

                <div className="about-stat-item">
                  <div className="stat-icon-circle"><Users size={14} /></div>
                  <div className="stat-info">
                    <span className="stat-label">Followers</span>
                    <span className="stat-value">{activeQuestion.followers} followers</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="about-stats-list">
                <div className="about-stat-item">
                  <div className="stat-icon-circle"><Award size={14} /></div>
                  <div className="stat-info">
                    <span className="stat-label">Topics</span>
                    <span className="stat-value">Chakras, Reiki, Sound, Aura</span>
                  </div>
                </div>
                <div className="about-stat-item">
                  <div className="stat-icon-circle"><Users size={14} /></div>
                  <div className="stat-info">
                    <span className="stat-label">Practitioners</span>
                    <span className="stat-value">Dr. Meera Sharma, Guru Dev</span>
                  </div>
                </div>
                <div className="about-stat-item">
                  <div className="stat-icon-circle"><MessageSquare size={14} /></div>
                  <div className="stat-info">
                    <span className="stat-label">Total Answers</span>
                    <span className="stat-value">460+ verified answers</span>
                  </div>
                </div>
              </div>
            )}

            {threadId && (
              <button
                className={`follow-question-action-btn ${activeQuestion.followedByUser ? "active" : ""}`}
                onClick={() => handleFollowQuestionToggle(activeQuestion.id)}
              >
                {activeQuestion.followedByUser ? (
                  <>
                    <Check size={16} />
                    <span>Following Question</span>
                  </>
                ) : (
                  <span>Follow Question</span>
                )}
              </button>
            )}
          </div>

          {/* Inspirational Quote Card */}
          <div className="qa-right-card quote-side-card">
            <div className="quote-mark-icon-large">“</div>
            <p className="spiritual-quote-text">
              In stillness, we find clarity. In clarity, we find peace.
            </p>

            <div className="quote-lotus-graphic-wrapper">
              <svg viewBox="0 0 100 100" className="quote-lotus-graphic">
                <path d="M50 25 C45 45 35 60 50 80 C65 60 55 45 50 25 Z" fill="none" stroke="#7c3aed" strokeWidth="2.5" strokeOpacity="0.2" />
                <path d="M50 80 C35 75 25 60 20 40 C35 50 45 60 50 80 Z" fill="none" stroke="#7c3aed" strokeWidth="2.5" strokeOpacity="0.2" />
                <path d="M50 80 C65 75 75 60 80 40 C65 50 55 60 50 80 Z" fill="none" stroke="#7c3aed" strokeWidth="2.5" strokeOpacity="0.2" />
              </svg>
            </div>

            <div className="quote-attribution">— Ancient Wisdom</div>
          </div>

          {/* Related Questions Card */}
          <div className="qa-right-card glass-panel">
            <h4 className="right-card-title flex-between">
              <span>Related questions</span>
            </h4>

            <div className="related-questions-list">
              {[
                { id: "anxiety-reduction", q: "What are quick ways to calm anxiety?", ans: "256 answers" },
                { id: "pcos-chakra", q: "Can chakra healing help PCOS?", ans: "198 answers" },
                { id: "hands-warmth", q: "How does yoga help with anxiety?", ans: "142 answers" }
              ].map((item, idx) => (
                <div key={idx} className="related-q-item" onClick={() => navigateToDetail(item.id)}>
                  <div className="q-mark-badge">?</div>
                  <div className="related-q-info">
                    <span className="related-q-title">{item.q}</span>
                    <span className="related-q-answers-count">{item.ans}</span>
                  </div>
                </div>
              ))}
            </div>

            <button className="right-card-action-btn" onClick={navigateToListing}>
              View All Questions
            </button>
          </div>

          {/* Top Contributors Card */}
          <div className="qa-right-card glass-panel">
            <h4 className="right-card-title">Top contributors</h4>

            <div className="contributors-list">
              {[
                { name: "Dr. Meera Sharma", role: "Healer", points: "1.2K points", avatar: "⚕️" },
                { name: "Guru Dev", role: "Healer", points: "980 points", avatar: "🧘" },
                { name: "Ishita Anand", role: "Community Member", points: "640 points", avatar: "👩" },
                { name: "Rohit Malhotra", role: "Community Member", points: "520 points", avatar: "👨" }
              ].map((c, idx) => (
                <div key={idx} className="contributor-item">
                  <div className="contributor-profile-box">
                    <div className="contributor-avatar-small">{c.avatar}</div>
                    <div className="contributor-info-details">
                      <div className="contributor-name-badge">
                        <span className="contributor-name">{c.name}</span>
                        {c.role === "Healer" && <span className="healer-badge-small">Healer</span>}
                      </div>
                      <span className="contributor-points">{c.points}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button className="right-card-action-btn" onClick={() => setShowLeaderboard(true)}>
              View Leaderboard
            </button>
          </div>

          {/* Share Board Card */}
          <div className="qa-right-card glass-panel">
            <h4 className="right-card-title">Share the board</h4>
            <p className="share-card-subtitle">
              Help others by sharing this valuable discussion.
            </p>

            <div className="share-social-row">
              <button className="social-icon-btn facebook" onClick={() => triggerToast("Sharing to Facebook...")} aria-label="Share on Facebook">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
              </button>
              <button className="social-icon-btn twitter" onClick={() => triggerToast("Sharing to X...")} aria-label="Share on X">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
              </button>
              <button className="social-icon-btn whatsapp" onClick={() => triggerToast("Sharing to WhatsApp...")} aria-label="Share on WhatsApp">
                <MessageSquare size={16} />
              </button>
              <button className="social-icon-btn linkedin" onClick={() => triggerToast("Sharing to LinkedIn...")} aria-label="Share on LinkedIn">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" /></svg>
              </button>
              <button className="social-icon-btn link" onClick={handleCopyLink} aria-label="Copy link">
                <Link size={16} />
              </button>
            </div>

            <button className="copy-link-btn" onClick={handleCopyLink}>
              <Copy size={14} />
              <span>Copy Link</span>
            </button>
          </div>
        </aside>
      </div>

      {/* Leaderboard Modal Dialog */}
      {showLeaderboard && (
        <div className="leaderboard-modal-overlay">
          <div className="leaderboard-modal-content glass-panel">
            <div className="modal-header">
              <h3 className="modal-title">Q&A Leaderboard</h3>
              <button className="close-btn" onClick={() => setShowLeaderboard(false)}>✕</button>
            </div>

            <div className="leaderboard-table">
              <div className="table-header-row">
                <span>Rank</span>
                <span>Contributor</span>
                <span>Role</span>
                <span className="text-right">Points</span>
              </div>
              <div className="table-body">
                {[
                  { rank: 1, name: "Dr. Meera Sharma", role: "Healer", points: 1250, avatar: "⚕️" },
                  { rank: 2, name: "Guru Dev", role: "Healer", points: 980, avatar: "🧘" },
                  { rank: 3, name: "Ishita Anand", role: "Community Member", points: 640, avatar: "👩" },
                  { rank: 4, name: "Rohit Malhotra", role: "Community Member", points: 520, avatar: "👨" },
                  { rank: 5, name: "Ananya", role: "Community Member", points: 430, avatar: "🧘‍♀️" },
                  { rank: 6, name: "Siddharth K.", role: "Community Member", points: 390, avatar: "👦" }
                ].map((item, idx) => (
                  <div key={idx} className="table-row">
                    <span className="rank-num">#{item.rank}</span>
                    <span className="col-user">
                      <span className="user-avatar-emoji">{item.avatar}</span>
                      <span className="user-name">{item.name}</span>
                    </span>
                    <span>
                      {item.role === "Healer" ? (
                        <span className="healer-badge-small">Healer</span>
                      ) : (
                        <span className="member-badge-small">Member</span>
                      )}
                    </span>
                    <span className="text-right font-bold">{item.points}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="modal-footer">
              <Button size="sm" onClick={() => setShowLeaderboard(false)}>Close</Button>
            </div>
          </div>
        </div>
      )}

      {/* Sign In Glassmorphic Modal Overlay */}
      {showLoginModal && (
        <div className="leaderboard-modal-overlay">
          <div className="login-modal-content glass-panel">
            <div className="modal-header">
              <div className="modal-title-with-subtitle">
                <h3 className="modal-title">Join the Community</h3>
                <span className="modal-subtitle">
                  {loginPurpose === "comment" ? "Sign in to write comments and replies." :
                    loginPurpose === "ask" ? "Sign in to post questions to our healers." :
                      "Sign in to interact with discussions."}
                </span>
              </div>
              <button className="close-btn" onClick={() => setShowLoginModal(false)}><X size={16} /></button>
            </div>

            <form onSubmit={handleLoginSubmit} className="login-form-fields">
              <div className="input-group">
                <label htmlFor="login-username">Your name</label>
                <input
                  id="login-username"
                  type="text"
                  placeholder="e.g. Amit Sharma"
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  className="glass-input login-input"
                  required
                />
              </div>

              <div className="input-group">
                <label htmlFor="login-email">Email Address</label>
                <input
                  id="login-email"
                  type="email"
                  placeholder="amit@example.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="glass-input login-input"
                  required
                />
              </div>

              <button type="submit" className="login-btn-submit">
                Sign In & Continue
              </button>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                <button
                  type="button"
                  className="demo-login-quick"
                  onClick={() => {
                    setLoginUsername("Dr. Meera Sharma");
                    setLoginEmail("meera@divingsanatan.com");
                  }}
                >
                  Auto-fill Healer Credentials (Dr. Meera Sharma)
                </button>
                <button
                  type="button"
                  className="demo-login-quick"
                  onClick={() => {
                    setLoginUsername("Amit Sharma");
                    setLoginEmail("amit@example.com");
                  }}
                >
                  Auto-fill Member Credentials (Amit Sharma)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Question Glassmorphic Modal */}
      {showEditQModal && (
        <div className="leaderboard-modal-overlay">
          <div className="login-modal-content glass-panel">
            <div className="modal-header">
              <div className="modal-title-with-subtitle">
                <h3 className="modal-title" style={{ color: '#3b0764', fontFamily: 'var(--font-serif)', fontSize: '1.25rem', fontWeight: 700 }}>Edit Question Details</h3>
                <span className="modal-subtitle">Modify the question title, category, or description.</span>
              </div>
              <button className="close-btn" onClick={() => setShowEditQModal(false)}><X size={16} /></button>
            </div>

            <form onSubmit={handleSaveEditQuestion} className="login-form-fields">
              <div className="input-group">
                <label htmlFor="edit-q-title">Question Title</label>
                <input
                  id="edit-q-title"
                  type="text"
                  value={editQTitle}
                  onChange={(e) => setEditQTitle(e.target.value)}
                  className="glass-input login-input"
                  required
                />
              </div>

              <div className="input-group">
                <label htmlFor="edit-q-desc">Description / Context</label>
                <textarea
                  id="edit-q-desc"
                  rows={3}
                  value={editQDesc}
                  onChange={(e) => setEditQDesc(e.target.value)}
                  className="glass-input ask-textarea"
                />
              </div>

              <div className="input-group">
                <label htmlFor="edit-q-category">Category</label>
                <select
                  id="edit-q-category"
                  value={editQCategory}
                  onChange={(e) => setEditQCategory(e.target.value)}
                  className="category-dropdown"
                >
                  <option value="Mind & Emotions">Mind & Emotions</option>
                  <option value="Chakra Healing">Chakra Healing</option>
                  <option value="Aura & Energy">Aura & Energy</option>
                  <option value="Meditation & Mindfulness">Meditation & Mindfulness</option>
                  <option value="Reiki Healing">Reiki Healing</option>
                </select>
              </div>

              <div className="modal-actions-row" style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                <button type="button" className="btn-cancel-admin" style={{ flex: 1 }} onClick={() => setShowEditQModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="login-btn-submit" style={{ flex: 1, margin: 0 }}>
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Answer Question Glassmorphic Modal */}
      {showAnswerModal && (
        <div className="leaderboard-modal-overlay">
          <div className="login-modal-content glass-panel" style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <div className="modal-title-with-subtitle">
                <h3 className="modal-title" style={{ color: '#3b0764', fontFamily: 'var(--font-serif)', fontSize: '1.25rem', fontWeight: 700 }}>Provide Healer Answer</h3>
                <span className="modal-subtitle">Write an expert response with structured bullet recommendations.</span>
              </div>
              <button className="close-btn" onClick={() => setShowAnswerModal(false)}><X size={16} /></button>
            </div>

            <form onSubmit={handleSaveAnswer} className="login-form-fields" style={{ maxHeight: '60vh', overflowY: 'auto', paddingRight: '8px' }}>
              <div className="input-group">
                <label htmlFor="ans-healer-name">Healer Name</label>
                <input
                  id="ans-healer-name"
                  type="text"
                  value={ansHealerName}
                  onChange={(e) => setAnsHealerName(e.target.value)}
                  className="glass-input login-input"
                  required
                />
              </div>

              <div className="input-group">
                <label htmlFor="ans-healer-credentials">Credentials / Experience</label>
                <input
                  id="ans-healer-credentials"
                  type="text"
                  value={ansHealerCredentials}
                  onChange={(e) => setAnsHealerCredentials(e.target.value)}
                  className="glass-input login-input"
                  required
                />
              </div>

              <div className="input-group">
                <label htmlFor="ans-healer-avatar">Avatar Image URL or Emoji</label>
                <input
                  id="ans-healer-avatar"
                  type="text"
                  value={ansHealerAvatar}
                  onChange={(e) => setAnsHealerAvatar(e.target.value)}
                  className="glass-input login-input"
                  required
                />
              </div>

              <div className="input-group">
                <label htmlFor="ans-content">Introduction Paragraph</label>
                <textarea
                  id="ans-content"
                  rows={3}
                  placeholder="Explain the background diagnostics of the issue..."
                  value={ansContent}
                  onChange={(e) => setAnsContent(e.target.value)}
                  className="glass-input ask-textarea"
                  required
                />
              </div>

              <div className="input-group">
                <label htmlFor="ans-bullets">Recommendations (One per line)</label>
                <textarea
                  id="ans-bullets"
                  rows={4}
                  placeholder="Topic: Details&#10;Topic 2: Details 2"
                  value={ansBulletsStr}
                  onChange={(e) => setAnsBulletsStr(e.target.value)}
                  className="glass-input ask-textarea"
                />
                <small style={{ fontSize: '0.7rem', color: '#6b7280' }}>Separate items by new lines. Use colons for bold topics.</small>
              </div>

              <div className="input-group">
                <label htmlFor="ans-conclusion">Conclusion Paragraph</label>
                <textarea
                  id="ans-conclusion"
                  rows={2}
                  placeholder="Consistency is key..."
                  value={ansConclusion}
                  onChange={(e) => setAnsConclusion(e.target.value)}
                  className="glass-input ask-textarea"
                  required
                />
              </div>

              <div className="modal-actions-row" style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                <button type="button" className="btn-cancel-admin" style={{ flex: 1 }} onClick={() => setShowAnswerModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="login-btn-submit" style={{ flex: 1, margin: 0 }}>
                  Save Answer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Embedded Styling */}
      <style jsx global>{`
        /* Root variable references */
        .qa-detail-page {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 20px;
          animation: fadeSlideIn 0.5s ease-out;
        }

        /* Q&A Listings Home styling */
        .qa-listings-view {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .qa-header-card-mini {
          padding: 24px !important;
          border-radius: 20px;
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(243, 232, 255, 0.8) 100%);
        }
        .page-main-title {
          font-family: var(--font-serif);
          font-size: 1.8rem;
          color: #3b0764;
          font-weight: 750 !important;
          margin-bottom: 6px;
        }
        .page-main-subtitle {
          font-size: 0.88rem;
          color: #5b21b6;
        }

        /* Ask Question Form styling */
        .ask-question-container {
          padding: 24px !important;
          border-radius: 20px;
        }
        .ask-q-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .form-header-row {
          display: flex;
          align-items: center;
          gap: 8px;
          border-bottom: 1px solid rgba(0,0,0,0.04);
          padding-bottom: 10px;
        }
        .form-title {
          font-family: var(--font-serif);
          font-size: 1.15rem;
          color: #3b0764;
          font-weight: 750 !important;
        }
        .purple-icon {
          color: #7c3aed;
        }
        .input-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .input-group label {
          font-size: 0.76rem;
          font-weight: 700;
          color: #5b21b6;
          text-transform: uppercase;
          letter-spacing: 0.02em;
        }
        .ask-input {
          font-size: 0.88rem;
          padding: 10px 14px;
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.5);
        }
        .ask-textarea {
          font-size: 0.88rem;
          padding: 10px 14px;
          border-radius: 10px;
          resize: vertical;
          min-height: 52px;
          font-family: var(--font-sans);
          background: rgba(255, 255, 255, 0.5);
        }
        .form-footer-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: 16px;
        }
        .select-wrapper {
          display: flex;
          flex-direction: column;
          gap: 4px;
          min-width: 180px;
        }
        .category-dropdown {
          background: #ffffff;
          border: 1px solid rgba(124, 58, 237, 0.3);
          border-radius: 10px;
          padding: 8px 12px;
          font-size: 0.82rem;
          font-family: var(--font-sans);
          outline: none;
          color: #4b5563;
        }
        .submit-q-btn {
          background: #581c87;
          color: #ffffff;
          border: none;
          padding: 10px 24px;
          border-radius: 12px;
          font-weight: 700;
          font-size: 0.82rem;
          cursor: pointer;
          transition: background-color 0.2s ease, transform 0.1s ease;
          box-shadow: 0 4px 10px rgba(88, 28, 135, 0.2);
        }
        .submit-q-btn:hover {
          background: #451070;
        }

        /* Login Banner Guest styling */
        .login-banner-container {
          background: linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%);
          border: 1px dashed rgba(124, 58, 237, 0.4);
          border-radius: 16px;
          padding: 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
        }
        .login-banner-content {
          display: flex;
          align-items: flex-start;
          gap: 12px;
        }
        .banner-icon {
          color: #7c3aed;
          flex-shrink: 0;
          margin-top: 2px;
        }
        .banner-text-box {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .banner-title {
          font-family: var(--font-serif);
          font-size: 1.05rem;
          font-weight: 750 !important;
          color: #3b0764;
          margin: 0;
        }
        .banner-desc {
          font-size: 0.78rem;
          color: #6b7280;
          line-height: 1.4;
        }
        .login-trigger-btn {
          background: #7c3aed;
          color: #ffffff;
          border: none;
          border-radius: 10px;
          padding: 8px 16px;
          font-size: 0.78rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 6px;
          cursor: pointer;
          transition: background-color 0.2s ease;
          box-shadow: 0 2px 6px rgba(124, 58, 237, 0.2);
          white-space: nowrap;
        }
        .login-trigger-btn:hover {
          background: #6d28d9;
        }

        /* active discussions listing styling */
        .listings-section {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .listings-heading {
          font-family: var(--font-sans);
          font-size: 1.05rem;
          color: #111827;
          font-weight: 750 !important;
          border-bottom: 1.5px solid rgba(0,0,0,0.04);
          padding-bottom: 8px;
        }
        .discussions-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .discussion-card {
          padding: 24px !important;
          border-radius: 20px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          cursor: pointer;
          transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s ease;
        }
        .discussion-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(124, 58, 237, 0.08);
        }
        .card-top-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .category-tag-small {
          background: #faf5ff;
          color: #7c3aed;
          font-size: 0.65rem;
          font-weight: 800;
          padding: 4px 10px;
          border-radius: 9999px;
          border: 1px solid rgba(124, 58, 237, 0.15);
          text-transform: uppercase;
        }
        .asked-by-tag {
          font-size: 0.72rem;
          color: #6b7280;
        }
        .discussion-card-title {
          font-family: var(--font-serif);
          font-size: 1.35rem;
          color: #3b0764;
          font-weight: 750 !important;
          margin: 0;
          line-height: 1.3;
          transition: color 0.2s ease;
        }
        .discussion-card:hover .discussion-card-title {
          color: #7c3aed;
        }
        .discussion-card-desc {
          font-size: 0.88rem;
          color: #4b5563;
          line-height: 1.45;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .card-bottom-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-top: 1px solid rgba(0,0,0,0.03);
          padding-top: 12px;
          margin-top: 4px;
        }
        .card-stats {
          display: flex;
          gap: 8px;
          font-size: 0.72rem;
          color: #9ca3af;
          font-weight: 500;
        }
        .read-discussion-btn {
          background: transparent;
          border: 1px solid rgba(168, 85, 247, 0.3);
          color: #7c3aed;
          font-size: 0.76rem;
          font-weight: 700;
          font-family: var(--font-sans);
          padding: 6px 14px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .discussion-card:hover .read-discussion-btn {
          background: #7c3aed;
          color: #ffffff;
          border-color: #7c3aed;
        }

        /* Toast notifications */
        .toast-notification {
          position: fixed;
          bottom: 30px;
          right: 30px;
          background: #4c1d95;
          color: #ffffff;
          padding: 14px 24px;
          border-radius: 12px;
          font-weight: 600;
          font-size: 0.88rem;
          box-shadow: 0 10px 30px rgba(76, 29, 149, 0.35);
          z-index: 1000;
          animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          border: 1px solid rgba(168, 85, 247, 0.3);
        }

        /* Breadcrumbs styling */
        .breadcrumbs {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.8rem;
          color: #6b7280;
          font-weight: 500;
          margin-bottom: 8px;
          flex-wrap: wrap;
        }
        .breadcrumb-item {
          cursor: pointer;
          transition: color 0.2s ease;
        }
        .breadcrumb-item:hover:not(.active) {
          color: #7c3aed;
        }
        .breadcrumb-item.active {
          color: #4b5563;
          font-weight: 600;
          cursor: default;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 320px;
        }
        .breadcrumb-separator {
          color: #d1d5db;
        }

        /* Layout Grid */
        .qa-layout-grid {
          display: grid;
          grid-template-columns: 1fr 310px;
          gap: 32px;
          align-items: flex-start;
          width: 100%;
        }

        .qa-main-column {
          display: flex;
          flex-direction: column;
          gap: 24px;
          min-width: 0;
        }

        .qa-right-column {
          display: flex;
          flex-direction: column;
          gap: 24px;
          position: sticky;
          top: 94px;
          max-height: calc(100vh - 110px);
          overflow-y: auto;
          scrollbar-width: none;
          padding-bottom: 10px;
        }
        .qa-right-column::-webkit-scrollbar {
          display: none;
        }

        /* Question Header Card styling */
        .question-header-card {
          padding: 32px !important;
          border-radius: 24px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .category-tag {
          background: #f3e8ff;
          color: #6b21a8;
          font-size: 0.72rem;
          font-weight: 700;
          padding: 6px 12px;
          border-radius: 9999px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          border: 1px solid rgba(168, 85, 247, 0.15);
        }

        .q-title-section {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 24px;
        }
        .q-title-left {
          flex: 1;
        }

        .question-main-title {
          font-size: 2rem;
          font-weight: 700 !important;
          color: #2e0854;
          line-height: 1.25 !important;
          margin-bottom: 10px;
          font-family: var(--font-serif);
        }
        .question-desc-text {
          font-size: 1.05rem;
          color: #4b5563;
          line-height: 1.5;
        }

        .meditation-avatar-wrapper {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          overflow: hidden;
          background: linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%);
          border: 2px solid rgba(168, 85, 247, 0.25);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          box-shadow: 0 4px 15px rgba(168, 85, 247, 0.15);
        }
        .meditation-aura-graphic {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transform: scale(1.05);
        }

        .q-author-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 0;
          border-top: 1px solid rgba(0,0,0,0.04);
          border-bottom: 1px solid rgba(0,0,0,0.04);
        }
        .author-info {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .author-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #edd8fc;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.95rem;
          box-shadow: 0 2px 5px rgba(0,0,0,0.05);
        }
        .author-meta-details {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.8rem;
          color: #6b7280;
        }
        .author-name {
          font-weight: 700;
          color: #1f2937;
        }
        .highlight-category {
          color: #7c3aed;
          font-weight: 600;
        }

        .follow-author-btn {
          background: transparent;
          border: 1.5px solid #a855f7;
          color: #7c3aed;
          padding: 6px 16px;
          border-radius: 20px;
          font-size: 0.78rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .follow-author-btn:hover {
          background: rgba(168, 85, 247, 0.08);
        }
        .follow-author-btn.active {
          background: #7c3aed;
          color: #ffffff;
          border-color: #7c3aed;
        }

        /* Action Bar styling */
        .question-action-bar {
          display: flex;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
        }
        .vote-button-group {
          display: flex;
          align-items: center;
          background: #f3f4f6;
          border-radius: 20px;
          overflow: hidden;
          border: 1px solid rgba(0,0,0,0.05);
        }
        .vote-btn {
          border: none;
          background: transparent;
          padding: 8px 14px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          color: #4b5563;
          transition: all 0.2s ease;
        }
        .vote-btn:hover {
          background: #e5e7eb;
          color: #111827;
        }
        .vote-btn.upvote.active {
          background: #ede9fe;
          color: #7c3aed;
        }
        .vote-btn.downvote.active {
          background: #fee2e2;
          color: #ef4444;
        }
        .vote-count {
          font-size: 0.85rem;
          font-weight: 700;
        }

        .best-answer-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          background: #ecfdf5;
          color: #065f46;
          font-weight: 700;
          font-size: 0.78rem;
          padding: 8px 14px;
          border-radius: 20px;
          border: 1px solid rgba(16, 185, 129, 0.15);
        }
        .best-answer-badge .chk-icon {
          color: #10b981;
        }

        .action-link-btn {
          border: none;
          background: transparent;
          display: flex;
          align-items: center;
          gap: 6px;
          color: #6b7280;
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
          transition: color 0.2s ease;
          padding: 8px 10px;
        }
        .action-link-btn:hover {
          color: #7c3aed;
        }
        .icon-action-btn {
          border: none;
          background: transparent;
          color: #9ca3af;
          cursor: pointer;
          padding: 8px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background-color 0.2s ease, color 0.2s ease;
        }
        .icon-action-btn:hover {
          background: rgba(0,0,0,0.03);
          color: #4b5563;
        }

        /* Best Answer Card styling */
        .best-answer-card {
          padding: 32px !important;
          border-radius: 24px;
          border-left: 4px solid #a855f7 !important;
          display: flex;
          flex-direction: column;
          gap: 22px;
          box-shadow: 0 4px 20px rgba(168, 85, 247, 0.04);
        }
        .best-answer-badge-header {
          display: flex;
          align-items: center;
          gap: 6px;
          color: #8b5cf6;
          font-size: 0.76rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .healer-header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-bottom: 4px;
        }
        .healer-profile-box {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .healer-avatar-circle {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: linear-gradient(135deg, #fbcfe8 0%, #e9d5ff 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.2rem;
          overflow: hidden;
          border: 1px solid rgba(168, 85, 247, 0.2);
          box-shadow: 0 2px 6px rgba(168, 85, 247, 0.1);
        }
        .healer-avatar-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .healer-profile-details {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .healer-name-row {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .healer-name {
          font-family: var(--font-serif);
          font-size: 1.15rem;
          font-weight: 700;
          color: #3b0764;
        }
        .healer-tag-pill {
          background: #faf5ff;
          color: #a855f7;
          border: 1px solid rgba(168, 85, 247, 0.2);
          font-size: 0.65rem;
          font-weight: 750;
          padding: 2px 8px;
          border-radius: 4px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .healer-credentials {
          font-size: 0.76rem;
          color: #6b7280;
        }
        .healer-date {
          font-size: 0.78rem;
          color: #9ca3af;
        }

        .best-answer-body {
          font-size: 1.02rem;
          color: #374151;
          line-height: 1.65;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .bullet-points-list {
          padding-left: 20px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .bullet-points-list li {
          color: #4b5563;
        }
        .bullet-topic {
          font-weight: 700;
          color: #2e0854;
          margin-right: 4px;
        }

        .liked-row {
          display: flex;
          align-items: center;
          gap: 10px;
          padding-top: 4px;
        }
        .stacked-avatars {
          display: flex;
          align-items: center;
        }
        .stack-avatar {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: #f3f4f6;
          border: 1.5px solid #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.65rem;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .sat-2 { margin-left: -6px; }
        .sat-3 { margin-left: -6px; }
        
        .liked-text {
          font-size: 0.78rem;
          color: #6b7280;
          font-weight: 600;
        }

        .answer-actions-bar {
          display: flex;
          align-items: center;
          gap: 12px;
          padding-top: 14px;
          border-top: 1px solid rgba(0,0,0,0.04);
          flex-wrap: wrap;
        }
        .interaction-btn {
          border: 1px solid rgba(0,0,0,0.06);
          background: transparent;
          border-radius: 12px;
          padding: 8px 16px;
          font-size: 0.8rem;
          font-weight: 600;
          color: #4b5563;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: all 0.2s ease;
        }
        .interaction-btn:hover {
          background: #faf5ff;
          border-color: rgba(168, 85, 247, 0.2);
          color: #7c3aed;
        }
        .interaction-btn.like-btn.active {
          background: #ede9fe;
          border-color: rgba(168, 85, 247, 0.25);
          color: #7c3aed;
        }
        .interaction-btn.thank-btn.active {
          background: #fdf2f8;
          border-color: rgba(236, 72, 153, 0.25);
          color: #db2777;
        }

        /* Comments Thread styling */
        .comments-thread-section {
          display: flex;
          flex-direction: column;
          gap: 20px;
          margin-top: 10px;
        }
        .comments-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1.5px solid rgba(0,0,0,0.04);
          padding-bottom: 12px;
        }
        .comments-count-title {
          font-size: 1.25rem;
          font-weight: 700 !important;
          color: #2e0854;
        }

        .sort-dropdown-container {
          position: relative;
        }
        .sort-dropdown-btn {
          border: none;
          background: transparent;
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.8rem;
          color: #4b5563;
          font-family: var(--font-sans);
          cursor: pointer;
          padding: 6px 12px;
          border-radius: 8px;
          transition: background-color 0.2s ease;
        }
        .sort-dropdown-btn:hover {
          background: rgba(0,0,0,0.03);
        }
        .sort-menu {
          position: absolute;
          top: 100%;
          right: 0;
          width: 140px;
          margin-top: 6px;
          border-radius: 12px;
          z-index: 100;
          padding: 6px;
          display: flex;
          flex-direction: column;
          gap: 2px;
          box-shadow: 0 8px 24px rgba(0,0,0,0.08);
        }
        .sort-menu button {
          border: none;
          background: transparent;
          width: 100%;
          text-align: left;
          padding: 8px 12px;
          font-size: 0.8rem;
          font-weight: 500;
          color: #4b5563;
          border-radius: 6px;
          cursor: pointer;
          transition: background-color 0.2s ease, color 0.2s ease;
        }
        .sort-menu button:hover {
          background: #f3e8ff;
          color: #6b21a8;
        }

        /* Add Comment box styling */
        .add-comment-box {
          display: flex;
          gap: 12px;
          padding: 20px !important;
          border-radius: 20px;
          background: rgba(255, 255, 255, 0.95);
        }
        .user-avatar-small {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: #e9d5ff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.05rem;
          flex-shrink: 0;
          box-shadow: 0 2px 6px rgba(0,0,0,0.05);
        }
        .comment-input-area {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .comment-textarea {
          width: 100%;
          border: none;
          background: transparent;
          outline: none;
          resize: none;
          font-family: var(--font-sans);
          font-size: 0.9rem;
          color: #1f2937;
          min-height: 24px;
        }
        .comment-textarea::placeholder {
          color: #9ca3af;
        }
        .comment-toolbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 10px;
          border-top: 1px solid rgba(0,0,0,0.04);
        }
        .toolbar-icons {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .toolbar-icon-btn {
          border: none;
          background: transparent;
          color: #9ca3af;
          cursor: pointer;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background-color 0.2s ease, color 0.2s ease;
        }
        .toolbar-icon-btn:hover {
          background: #faf5ff;
          color: #8b5cf6;
        }
        .comment-submit-btn {
          border: none;
          background: #581c87;
          color: #ffffff;
          font-family: var(--font-sans);
          font-size: 0.8rem;
          font-weight: 700;
          padding: 8px 20px;
          border-radius: 10px;
          cursor: pointer;
          transition: background-color 0.2s ease;
          box-shadow: 0 4px 10px rgba(88, 28, 135, 0.2);
        }
        .comment-submit-btn:hover {
          background: #451070;
        }

        /* Comments List styling */
        .comments-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .comment-item-container {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .comment-card {
          background: #ffffff;
          border: 1px solid rgba(0,0,0,0.04);
          border-radius: 16px;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.005);
          transition: transform 0.2s ease;
        }

        .comment-header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .commenter-profile {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .commenter-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #f3f4f6;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.9rem;
          box-shadow: inset 0 2px 4px rgba(0,0,0,0.03);
          border: 1px solid rgba(0,0,0,0.03);
        }
        .commenter-details {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .commenter-name-row {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .commenter-name {
          font-size: 0.85rem;
          font-weight: 700;
          color: #1f2937;
        }
        .comment-date {
          font-size: 0.72rem;
          color: #9ca3af;
        }

        .comment-content-text {
          font-size: 0.9rem;
          color: #4b5563;
          line-height: 1.5;
        }

        .comment-actions-row {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .comment-act-btn {
          border: none;
          background: transparent;
          font-family: var(--font-sans);
          font-size: 0.76rem;
          font-weight: 600;
          color: #9ca3af;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 4px;
          transition: color 0.2s ease;
          padding: 4px 6px;
        }
        .comment-act-btn:hover {
          color: #7c3aed;
        }
        .comment-act-btn.active {
          color: #ef4444;
        }

        /* Nested replies */
        .nested-replies-list {
          margin-left: 32px;
          padding-left: 12px;
          border-left: 2px solid #ede9fe;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .reply-card {
          background: #faf5ff;
          border: 1px solid rgba(168, 85, 247, 0.05);
          border-radius: 14px;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .reply-healer-avatar {
          background: #fdf4ff;
          border: 1px solid rgba(168, 85, 247, 0.1);
        }
        .reply-healer-badge {
          background: #edd8fc;
          color: #7c3aed;
          font-size: 0.62rem;
          font-weight: 750;
          padding: 1px 6px;
          border-radius: 4px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .view-replies-toggle-btn {
          border: none;
          background: transparent;
          color: #7c3aed;
          font-family: var(--font-sans);
          font-size: 0.78rem;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 4px;
          margin-left: 32px;
          padding: 4px 8px;
          border-radius: 6px;
          width: fit-content;
          transition: background-color 0.2s ease;
        }
        .view-replies-toggle-btn:hover {
          background: #faf5ff;
        }

        /* Load More button */
        .load-more-container {
          display: flex;
          justify-content: center;
          margin-top: 10px;
        }
        .load-more-btn {
          border: 1px solid rgba(168, 85, 247, 0.15);
          background: #ffffff;
          padding: 10px 24px;
          border-radius: 12px;
          font-family: var(--font-sans);
          font-size: 0.8rem;
          font-weight: 700;
          color: #7c3aed;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: all 0.2s ease;
          box-shadow: 0 2px 8px rgba(0,0,0,0.02);
        }
        .load-more-btn:hover {
          background: #faf5ff;
          border-color: rgba(168, 85, 247, 0.3);
          transform: translateY(-1px);
        }

        /* Bottom Promo banner */
        .bottom-promo-banner-card {
          background: linear-gradient(135deg, #4c1d95 0%, #31105c 100%);
          border-radius: 24px;
          padding: 36px 40px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          position: relative;
          overflow: hidden;
          box-shadow: 0 10px 30px rgba(76, 29, 149, 0.25);
          color: #ffffff;
          gap: 32px;
        }
        .bottom-promo-banner-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: radial-gradient(circle at 10% 20%, rgba(168, 85, 247, 0.15) 0%, transparent 60%);
          pointer-events: none;
        }

        .banner-content-box {
          display: flex;
          flex-direction: column;
          gap: 12px;
          max-width: 480px;
          position: relative;
          z-index: 2;
        }
        .banner-title {
          font-family: var(--font-serif);
          font-size: 1.8rem;
          font-weight: 700 !important;
          color: #f3e8ff;
          line-height: 1.25 !important;
        }
        .banner-subtitle {
          font-size: 0.95rem;
          color: #d8b4fe;
          line-height: 1.5;
        }
        .banner-ask-btn {
          width: fit-content;
          border: none;
          background: #ffffff;
          color: #4c1d95;
          font-family: var(--font-sans);
          font-size: 0.85rem;
          font-weight: 700;
          padding: 12px 24px;
          border-radius: 14px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        }
        .banner-ask-btn:hover {
          background: #f3e8ff;
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(0,0,0,0.15);
        }

        .banner-bubbles-graphic {
          width: 140px;
          height: 100px;
          position: relative;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .speech-bubble {
          position: absolute;
          border-radius: 18px;
          padding: 12px;
          display: flex;
          gap: 4px;
          box-shadow: 0 4px 15px rgba(0,0,0,0.15);
        }
        .speech-bubble .dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: currentColor;
          opacity: 0.5;
        }
        .bubble-left {
          background: #ffffff;
          color: #8b5cf6;
          top: 10px;
          left: 10px;
          width: 60px;
          height: 40px;
          border-bottom-left-radius: 0;
          animation: floatOrb 5s infinite alternate ease-in-out;
        }
        .bubble-right {
          background: #c084fc;
          color: #ffffff;
          bottom: 10px;
          right: 10px;
          width: 70px;
          height: 44px;
          border-bottom-right-radius: 0;
          animation: floatOrb 6s infinite alternate-reverse ease-in-out;
        }

        /* Right Sidebar card general styling */
        .qa-right-card {
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .right-card-title {
          font-family: var(--font-sans);
          font-size: 1.02rem;
          color: #111827;
          font-weight: 750 !important;
          margin: 0;
          border-bottom: 1px solid rgba(0,0,0,0.04);
          padding-bottom: 12px;
        }
        .right-card-title.flex-between {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .follow-question-action-btn {
          width: 100%;
          background: #581c87;
          color: #ffffff;
          border: none;
          padding: 12px;
          border-radius: 12px;
          font-weight: 700;
          font-size: 0.8rem;
          font-family: var(--font-sans);
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          box-shadow: 0 4px 12px rgba(88, 28, 135, 0.2);
        }
        .follow-question-action-btn:hover {
          background: #451070;
        }
        .follow-question-action-btn.active {
          background: #ecfdf5;
          color: #065f46;
          border: 1px solid rgba(16, 185, 129, 0.2);
          box-shadow: none;
        }

        /* About Stats List */
        .about-stats-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .about-stat-item {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .stat-avatar-circle {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: #edd8fc;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.8rem;
          border: 1px solid rgba(168, 85, 247, 0.1);
        }
        .stat-icon-circle {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: #f5f3ff;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #7c3aed;
          border: 1px solid rgba(124, 58, 237, 0.1);
        }
        .stat-info {
          display: flex;
          flex-direction: column;
          gap: 1px;
        }
        .stat-label {
          font-size: 0.68rem;
          color: #9ca3af;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.02em;
        }
        .stat-value {
          font-size: 0.82rem;
          font-weight: 700;
          color: #4b5563;
        }
        .stat-value.text-highlight {
          color: #7c3aed;
        }

        /* quote card styling */
        .quote-side-card {
          background: linear-gradient(135deg, #fdf4ff 0%, #fae8ff 100%);
          border: 1px solid rgba(168, 85, 247, 0.15) !important;
          border-radius: 24px;
          text-align: center;
          position: relative;
          overflow: hidden;
          padding: 30px 24px;
          gap: 12px;
        }
        .quote-mark-icon-large {
          font-family: var(--font-serif);
          font-size: 4rem;
          line-height: 1;
          color: #c084fc;
          opacity: 0.3;
          height: 24px;
          margin-top: -10px;
        }
        .spiritual-quote-text {
          font-family: var(--font-serif);
          font-size: 1.15rem;
          font-style: italic;
          color: #3b0764;
          line-height: 1.45;
          margin: 0;
          font-weight: 600;
          position: relative;
          z-index: 2;
        }
        .quote-lotus-graphic-wrapper {
          display: flex;
          justify-content: center;
          margin: 4px 0;
        }
        .quote-lotus-graphic {
          width: 44px;
          height: 38px;
        }
        .quote-attribution {
          font-size: 0.72rem;
          color: #a855f7;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        /* Related Questions List styling */
        .related-questions-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .related-q-item {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          cursor: pointer;
          transition: transform 0.2s ease;
        }
        .related-q-item:hover {
          transform: translateX(4px);
        }
        .q-mark-badge {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #f3e8ff;
          border: 1px solid rgba(168, 85, 247, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #6b21a8;
          font-size: 0.65rem;
          font-weight: 800;
          margin-top: 2px;
          flex-shrink: 0;
        }
        .related-q-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .related-q-title {
          font-size: 0.8rem;
          font-weight: 700;
          color: #1f2937;
          line-height: 1.35;
          transition: color 0.2s ease;
        }
        .related-q-item:hover .related-q-title {
          color: #7c3aed;
        }
        .related-q-answers-count {
          font-size: 0.68rem;
          color: #6b7280;
        }
        .right-card-action-btn {
          width: 100%;
          border: 1px solid rgba(168, 85, 247, 0.15);
          background: #ffffff;
          padding: 10px;
          border-radius: 10px;
          font-family: var(--font-sans);
          font-size: 0.76rem;
          font-weight: 700;
          color: #7c3aed;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 1px 3px rgba(0,0,0,0.01);
        }
        .right-card-action-btn:hover {
          background: #faf5ff;
          border-color: rgba(168, 85, 247, 0.3);
        }

        /* Contributors List styling */
        .contributors-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .contributor-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .contributor-profile-box {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .contributor-avatar-small {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: #faf5ff;
          border: 1px solid rgba(168, 85, 247, 0.15);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.9rem;
          box-shadow: inset 0 2px 4px rgba(0,0,0,0.02);
        }
        .contributor-info-details {
          display: flex;
          flex-direction: column;
          gap: 1px;
        }
        .contributor-name-badge {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .contributor-name {
          font-size: 0.8rem;
          font-weight: 700;
          color: #1f2937;
        }
        .healer-badge-small {
          background: #faf5ff;
          color: #a855f7;
          border: 1px solid rgba(168, 85, 247, 0.25);
          font-size: 0.58rem;
          font-weight: 750;
          padding: 1px 5px;
          border-radius: 3px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .member-badge-small {
          background: #f3f4f6;
          color: #4b5563;
          border: 1px solid rgba(0,0,0,0.06);
          font-size: 0.58rem;
          font-weight: 750;
          padding: 1px 5px;
          border-radius: 3px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .contributor-points {
          font-size: 0.7rem;
          color: #6b7280;
        }

        /* Share Card styling */
        .share-card-subtitle {
          font-size: 0.76rem;
          color: #6b7280;
          margin-top: -6px;
        }
        .share-social-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }
        .social-icon-btn {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: 1px solid rgba(0,0,0,0.06);
          background: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
          color: #4b5563;
        }
        .social-icon-btn:hover {
          color: #ffffff;
          transform: translateY(-2px);
        }
        .social-icon-btn.facebook:hover { background: #3b5998; border-color: #3b5998; }
        .social-icon-btn.twitter:hover { background: #1da1f2; border-color: #1da1f2; }
        .social-icon-btn.whatsapp:hover { background: #25d366; border-color: #25d366; }
        .social-icon-btn.linkedin:hover { background: #0077b5; border-color: #0077b5; }
        .social-icon-btn.link:hover { background: #7c3aed; border-color: #7c3aed; }
        
        .copy-link-btn {
          width: 100%;
          background: #ffffff;
          border: 1px solid rgba(0,0,0,0.06);
          padding: 10px;
          border-radius: 10px;
          font-family: var(--font-sans);
          font-size: 0.76rem;
          font-weight: 700;
          color: #4b5563;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          transition: all 0.2s ease;
        }
        .copy-link-btn:hover {
          background: #faf5ff;
          border-color: rgba(124, 58, 237, 0.2);
          color: #7c3aed;
        }

        /* Leaderboard Modal overlay */
        .leaderboard-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.35);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          animation: fadeSlideIn 0.25s ease-out;
        }
        .leaderboard-modal-content {
          width: 90%;
          max-width: 480px;
          padding: 24px !important;
          border-radius: 20px;
          display: flex;
          flex-direction: column;
          gap: 20px;
          box-shadow: 0 20px 50px rgba(0,0,0,0.15);
        }
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .modal-title {
          font-family: var(--font-serif);
          font-size: 1.35rem;
          font-weight: 700 !important;
          color: #2e0854;
        }
        .close-btn {
          border: none;
          background: transparent;
          font-size: 1rem;
          cursor: pointer;
          color: #9ca3af;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          transition: all 0.2s ease;
        }
        .close-btn:hover {
          background: rgba(0,0,0,0.03);
          color: #4b5563;
        }

        .leaderboard-table {
          display: flex;
          flex-direction: column;
          border: 1px solid rgba(0,0,0,0.05);
          border-radius: 12px;
          overflow: hidden;
          background: #ffffff;
        }
        .table-header-row {
          display: grid;
          grid-template-columns: 50px 1fr 100px 70px;
          padding: 10px 16px;
          background: #f9fafb;
          border-bottom: 1px solid rgba(0,0,0,0.05);
          font-size: 0.72rem;
          font-weight: 700;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .table-body {
          display: flex;
          flex-direction: column;
        }
        .table-row {
          display: grid;
          grid-template-columns: 50px 1fr 100px 70px;
          padding: 12px 16px;
          border-bottom: 1px solid rgba(0,0,0,0.03);
          font-size: 0.8rem;
          align-items: center;
          color: #4b5563;
        }
        .table-row:last-child {
          border-bottom: none;
        }
        .rank-num {
          font-weight: 700;
          color: #6b21a8;
        }
        .col-user {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .user-avatar-emoji {
          font-size: 1.05rem;
        }
        .user-name {
          font-weight: 600;
          color: #1f2937;
        }
        .font-bold {
          font-weight: 700;
        }
        .text-right {
          text-align: right;
        }

        .modal-footer {
          display: flex;
          justify-content: flex-end;
        }

        /* Login Modal specific styling */
        .login-modal-content {
          width: 90%;
          max-width: 440px;
          padding: 30px !important;
          border-radius: 24px;
          display: flex;
          flex-direction: column;
          gap: 24px;
          box-shadow: 0 20px 60px rgba(124, 58, 237, 0.2);
          background: rgba(255, 255, 255, 0.95);
        }
        .modal-title-with-subtitle {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .modal-subtitle {
          font-size: 0.78rem;
          color: #6b7280;
          line-height: 1.3;
        }
        .login-form-fields {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .login-input {
          font-size: 0.88rem;
          padding: 12px 14px;
          border-radius: 10px;
        }
        .login-btn-submit {
          width: 100%;
          background: #581c87;
          color: #ffffff;
          border: none;
          padding: 12px;
          border-radius: 12px;
          font-weight: 700;
          font-size: 0.85rem;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 4px 12px rgba(88, 28, 135, 0.25);
          margin-top: 6px;
        }
        .login-btn-submit:hover {
          background: #451070;
        }
        .demo-login-quick {
          border: none;
          background: transparent;
          color: #7c3aed;
          font-size: 0.78rem;
          font-weight: 700;
          cursor: pointer;
          text-decoration: underline;
          text-align: center;
          margin-top: -4px;
          font-family: var(--font-sans);
          transition: color 0.2s ease;
        }
        .demo-login-quick:hover {
          color: #4c1d95;
        }

        /* Responsiveness */
        @media (max-width: 968px) {
          .qa-layout-grid {
            grid-template-columns: 1fr;
          }
          .qa-right-column {
            position: static;
            max-height: none;
            overflow: visible;
          }
          .bottom-promo-banner-card {
            padding: 30px;
            flex-direction: column;
            align-items: flex-start;
          }
          .banner-bubbles-graphic {
            align-self: flex-end;
            margin-top: -40px;
          }
        }
        @media (max-width: 640px) {
          .question-header-card, .best-answer-card {
            padding: 20px !important;
          }
          .question-main-title {
            font-size: 1.5rem;
          }
          .q-title-section {
            flex-direction: column-reverse;
          }
          .meditation-avatar-wrapper {
            align-self: flex-start;
          }
          .healer-header-row {
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
          }
          .healer-date {
            align-self: flex-end;
          }
          .banner-bubbles-graphic {
            display: none;
          }
          .login-banner-container {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
          }
          .login-trigger-btn {
            width: 100%;
            justify-content: center;
          }
          .form-footer-row {
            flex-direction: column;
            align-items: stretch;
            gap: 12px;
          }
          .submit-q-btn {
            width: 100%;
          }
        }

        /* ADMIN CUSTOM STYLES */
        .admin-status-banner {
          background: linear-gradient(135deg, rgba(88, 28, 135, 0.9) 0%, rgba(124, 58, 237, 0.8) 100%) !important;
          color: #ffffff;
          padding: 14px 24px !important;
          border-radius: 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          box-shadow: 0 8px 30px rgba(124, 58, 237, 0.25);
          animation: fadeSlideIn 0.4s ease-out;
        }
        .admin-status-content {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .admin-pulse-dot {
          width: 8px;
          height: 8px;
          background: #4ade80;
          border-radius: 50%;
          display: inline-block;
          box-shadow: 0 0 10px #4ade80;
          animation: adminPulse 1.5s infinite;
        }
        @keyframes adminPulse {
          0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(74, 222, 128, 0.7); }
          70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(74, 222, 128, 0); }
          100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(74, 222, 128, 0); }
        }
        .admin-status-text {
          font-size: 0.85rem;
        }
        .admin-logout-trigger-btn {
          background: rgba(255, 255, 255, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.3);
          color: #ffffff;
          padding: 6px 14px;
          border-radius: 8px;
          font-size: 0.78rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .admin-logout-trigger-btn:hover {
          background: #ffffff;
          color: #581c87;
        }

        .card-top-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
        }
        .card-top-left {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .card-admin-actions {
          display: flex;
          gap: 6px;
        }
        .admin-inline-btn {
          background: rgba(255, 255, 255, 0.6);
          border: 1px solid rgba(0, 0, 0, 0.05);
          width: 28px;
          height: 28px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.82rem;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .admin-inline-btn:hover {
          background: #ffffff;
          transform: translateY(-1px);
        }
        .admin-inline-btn.edit-btn:hover {
          border-color: rgba(124, 58, 237, 0.3);
          box-shadow: 0 2px 8px rgba(124, 58, 237, 0.1);
        }
        .admin-inline-btn.delete-btn:hover {
          border-color: rgba(239, 68, 68, 0.3);
          box-shadow: 0 2px 8px rgba(239, 68, 68, 0.1);
        }

        .admin-thread-actions {
          display: flex;
          gap: 10px;
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid rgba(0,0,0,0.05);
        }
        .admin-action-pill {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 14px;
          border-radius: 8px;
          font-size: 0.78rem;
          font-weight: 700;
          cursor: pointer;
          background: rgba(255,255,255,0.7);
          border: 1px solid rgba(0,0,0,0.06);
          transition: all 0.2s ease;
        }
        .admin-action-pill:hover {
          background: #ffffff;
          transform: translateY(-1px);
        }
        .admin-action-pill.edit {
          color: #7c3aed;
        }
        .admin-action-pill.edit:hover {
          border-color: rgba(124, 58, 237, 0.3);
          box-shadow: 0 4px 10px rgba(124, 58, 237, 0.1);
        }
        .admin-action-pill.delete {
          color: #ef4444;
        }
        .admin-action-pill.delete:hover {
          border-color: rgba(239, 68, 68, 0.3);
          box-shadow: 0 4px 10px rgba(239, 68, 68, 0.1);
        }

        .no-answer-card {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 24px !important;
          border-radius: 20px;
          background: linear-gradient(135deg, rgba(255,255,255,0.7) 0%, rgba(243,244,246,0.6) 100%);
          gap: 20px;
        }
        .no-answer-content {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .star-icon-muted {
          color: #d1d5db;
        }
        .no-answer-text {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .no-answer-title {
          font-family: var(--font-serif);
          font-size: 1rem;
          color: #4b5563;
          font-weight: 700;
        }
        .no-answer-desc {
          font-size: 0.8rem;
          color: #6b7280;
        }
        .provide-answer-btn {
          background: #7c3aed;
          color: #ffffff;
          border: none;
          padding: 10px 20px;
          border-radius: 12px;
          font-size: 0.8rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 4px 12px rgba(124, 58, 237, 0.2);
          white-space: nowrap;
        }
        .provide-answer-btn:hover {
          background: #6d28d9;
          transform: translateY(-1px);
        }

        .btn-cancel-admin {
          background: rgba(0, 0, 0, 0.04);
          color: #4b5563;
          border: 1px solid rgba(0, 0, 0, 0.06);
          padding: 12px;
          border-radius: 12px;
          font-weight: 700;
          font-size: 0.85rem;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .btn-cancel-admin:hover {
          background: rgba(0, 0, 0, 0.08);
        }

        .answer-actions-bar {
          display: flex;
          gap: 12px;
          align-items: center;
        }
        .interaction-btn.admin-edit-ans {
          color: #7c3aed;
        }
        .interaction-btn.admin-edit-ans:hover {
          color: #6d28d9;
        }
        .interaction-btn.admin-delete-ans {
          color: #ef4444;
        }
        .interaction-btn.admin-delete-ans:hover {
          color: #dc2626;
        }
      `}</style>
    </div>
  );
}

export default function QuoraQAPage() {
  return (
    <Suspense fallback={<div className="text-center-pad">Loading Q&A board...</div>}>
      <QuoraQAInner />
    </Suspense>
  );
}
