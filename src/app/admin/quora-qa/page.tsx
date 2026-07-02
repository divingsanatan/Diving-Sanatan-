"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { 
  Trash2, Edit, CheckCircle2, AlertCircle, PlusCircle, Star, Search, Filter, X 
} from "lucide-react";

interface HealerReply {
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
  bestAnswer?: HealerReply;
  comments: any[];
}

const initialQuestions: QuestionItem[] = [
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
    comments: []
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
    comments: []
  }
];

export default function QuoraQAAdmin() {
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [activeTab, setActiveTab] = useState("all"); // all, answered, unanswered

  // Modals States
  const [showQModal, setShowQModal] = useState(false);
  const [isEditingQ, setIsEditingQ] = useState(false);
  const [currentQId, setCurrentQId] = useState("");

  const [showAnsModal, setShowAnsModal] = useState(false);
  const [currentAnsQId, setCurrentAnsQId] = useState("");

  // Question Form State
  const [qTitle, setQTitle] = useState("");
  const [qDesc, setQDesc] = useState("");
  const [qCategory, setQCategory] = useState("Mind & Emotions");
  const [qAskedBy, setQAskedBy] = useState("Admin Healer");

  // Answer Form State
  const [ansHealerName, setAnsHealerName] = useState("Dr. Meera Sharma");
  const [ansHealerAvatar, setAnsHealerAvatar] = useState("/images/anara.png");
  const [ansHealerRole, setAnsHealerRole] = useState("Healer");
  const [ansHealerCredentials, setAnsHealerCredentials] = useState("Holistic Therapist • 12 years experience");
  const [ansContent, setAnsContent] = useState("");
  const [ansBulletsStr, setAnsBulletsStr] = useState("");
  const [ansConclusion, setAnsConclusion] = useState("");

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  useEffect(() => {
    // Load from localStorage or fallback
    const stored = localStorage.getItem("divingsanatan_quora_questions");
    if (stored) {
      try {
        setQuestions(JSON.parse(stored));
      } catch (e) {
        setQuestions(initialQuestions);
      }
    } else {
      setQuestions(initialQuestions);
      localStorage.setItem("divingsanatan_quora_questions", JSON.stringify(initialQuestions));
    }
    setLoading(false);
  }, []);

  const saveToStorage = (newQuestions: QuestionItem[]) => {
    setQuestions(newQuestions);
    localStorage.setItem("divingsanatan_quora_questions", JSON.stringify(newQuestions));
  };

  // Question Handlers
  const handleOpenAddQ = () => {
    setIsEditingQ(false);
    setQTitle("");
    setQDesc("");
    setQCategory("Mind & Emotions");
    setQAskedBy("Admin Healer");
    setShowQModal(true);
  };

  const handleOpenEditQ = (q: QuestionItem) => {
    setIsEditingQ(true);
    setCurrentQId(q.id);
    setQTitle(q.title);
    setQDesc(q.description);
    setQCategory(q.category);
    setQAskedBy(q.askedBy);
    setShowQModal(true);
  };

  const handleDeleteQ = (id: string) => {
    if (!window.confirm("Are you sure you want to delete this question?")) return;
    const updated = questions.filter(q => q.id !== id);
    saveToStorage(updated);
    triggerToast("Question deleted from board.");
  };

  const handleQSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!qTitle.trim()) return;

    if (isEditingQ) {
      const updated = questions.map(q => 
        q.id === currentQId 
          ? { ...q, title: qTitle.trim(), description: qDesc.trim(), category: qCategory, askedBy: qAskedBy } 
          : q
      );
      saveToStorage(updated);
      triggerToast("Question updated successfully.");
    } else {
      const newQuestion: QuestionItem = {
        id: `q-${Date.now()}`,
        category: qCategory,
        title: qTitle.trim(),
        description: qDesc.trim(),
        askedBy: qAskedBy.trim() || "Anonymous Seeker",
        askedByAvatar: "👤",
        date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        views: "0",
        followers: 1,
        upvotes: 0,
        commentsCount: 0,
        comments: []
      };
      saveToStorage([newQuestion, ...questions]);
      triggerToast("New question created.");
    }
    setShowQModal(false);
  };

  // Answer Handlers
  const handleOpenAnswer = (q: QuestionItem) => {
    setCurrentAnsQId(q.id);
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
    setShowAnsModal(true);
  };

  const handleAnsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const bullets = ansBulletsStr
      .split("\n")
      .map(b => b.trim())
      .filter(b => b.length > 0);

    const updated = questions.map(q => {
      if (q.id === currentAnsQId) {
        return {
          ...q,
          bestAnswer: {
            healerName: ansHealerName.trim(),
            healerAvatar: ansHealerAvatar.trim(),
            healerRole: ansHealerRole.trim(),
            healerCredentials: ansHealerCredentials.trim(),
            date: q.bestAnswer?.date || new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
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
    });

    saveToStorage(updated);
    setShowAnsModal(false);
    triggerToast("Practitioner reply saved.");
  };

  const handleDeleteAnswer = (qId: string) => {
    if (!window.confirm("Are you sure you want to delete this healer answer?")) return;
    const updated = questions.map(q => {
      if (q.id === qId) {
        const { bestAnswer, ...rest } = q;
        return rest as QuestionItem;
      }
      return q;
    });
    saveToStorage(updated);
    triggerToast("Healer answer removed.");
  };

  // Filter Logic
  const filteredQuestions = questions.filter(q => {
    const matchesSearch = q.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          q.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === "all" || q.category === activeCategory;
    const matchesTab = activeTab === "all" || 
                       (activeTab === "answered" && !!q.bestAnswer) || 
                       (activeTab === "unanswered" && !q.bestAnswer);
    return matchesSearch && matchesCategory && matchesTab;
  });

  return (
    <div className="admin-container">
      {/* Toast */}
      {toastMessage && (
        <div className="toast-notify">
          {toastMessage}
        </div>
      )}

      {/* Header */}
      <div className="admin-header-row">
        <div>
          <h1 className="admin-page-title">Q&A Board Manager</h1>
          <p className="admin-page-subtitle">Manage public spiritual questions and provide expert healer answers.</p>
        </div>
        <Button variant="gold" onClick={handleOpenAddQ}>
          <PlusCircle size={16} style={{ marginRight: '6px' }} />
          Create Question
        </Button>
      </div>

      {/* Filter Toolbar */}
      <div className="admin-toolbar glass-panel">
        <div className="search-bar-wrapper">
          <Search size={16} className="search-icon-admin" />
          <input 
            type="text" 
            placeholder="Search questions..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="admin-search-input"
          />
        </div>

        <div className="category-select-wrapper">
          <Filter size={16} className="filter-icon-admin" />
          <select 
            value={activeCategory} 
            onChange={(e) => setActiveCategory(e.target.value)}
            className="admin-filter-dropdown"
          >
            <option value="all">All Categories</option>
            <option value="Mind & Emotions">Mind & Emotions</option>
            <option value="Chakra Healing">Chakra Healing</option>
            <option value="Aura & Energy">Aura & Energy</option>
            <option value="Meditation & Mindfulness">Meditation & Mindfulness</option>
            <option value="Reiki Healing">Reiki Healing</option>
          </select>
        </div>
      </div>

      {/* Tabs */}
      <div className="category-tabs">
        <button 
          className={`category-tab ${activeTab === "all" ? "active" : ""}`}
          onClick={() => setActiveTab("all")}
        >
          All Questions ({questions.length})
        </button>
        <button 
          className={`category-tab ${activeTab === "answered" ? "active" : ""}`}
          onClick={() => setActiveTab("answered")}
        >
          Answered ({questions.filter(q => !!q.bestAnswer).length})
        </button>
        <button 
          className={`category-tab ${activeTab === "unanswered" ? "active" : ""}`}
          onClick={() => setActiveTab("unanswered")}
        >
          Unanswered ({questions.filter(q => !q.bestAnswer).length})
        </button>
      </div>

      {/* List */}
      {loading ? (
        <div className="loading-state-admin">Loading board data...</div>
      ) : filteredQuestions.length === 0 ? (
        <div className="empty-state-admin">No questions match your current filters.</div>
      ) : (
        <div className="questions-admin-grid">
          {filteredQuestions.map((q) => (
            <Card key={q.id} variant="glass" className="qa-admin-card">
              <div className="card-top-header">
                <span className="cat-badge-tag">{q.category}</span>
                <span className={`status-badge-tag ${q.bestAnswer ? "answered" : "unanswered"}`}>
                  {q.bestAnswer ? (
                    <>
                      <CheckCircle2 size={12} style={{ marginRight: '4px' }} />
                      Answered
                    </>
                  ) : (
                    <>
                      <AlertCircle size={12} style={{ marginRight: '4px' }} />
                      Unanswered
                    </>
                  )}
                </span>
              </div>

              <div className="qa-card-body">
                <h3 className="q-card-title">{q.title}</h3>
                <p className="q-card-description">{q.description || "No context description provided."}</p>
                <div className="q-card-meta">
                  <span>Asked by: <strong>{q.askedBy}</strong></span>
                  <span>•</span>
                  <span>{q.date}</span>
                </div>
              </div>

              {q.bestAnswer && (
                <div className="healer-reply-preview">
                  <div className="healer-preview-header">
                    <Star size={12} fill="#e9d5ff" color="#a855f7" />
                    <span>Best Answer by <strong>{q.bestAnswer.healerName}</strong></span>
                  </div>
                  <p className="healer-preview-body">{q.bestAnswer.content.substring(0, 100)}...</p>
                </div>
              )}

              <div className="qa-card-actions">
                <div className="left-actions">
                  <button className="admin-act-btn answer-btn" onClick={() => handleOpenAnswer(q)}>
                    🩺 {q.bestAnswer ? "Edit Healer Reply" : "Provide Reply"}
                  </button>
                  {q.bestAnswer && (
                    <button className="admin-act-btn remove-answer-btn" onClick={() => handleDeleteAnswer(q.id)}>
                      Remove Reply
                    </button>
                  )}
                </div>
                <div className="right-actions">
                  <button className="admin-act-btn edit-q" onClick={() => handleOpenEditQ(q)}>
                    ✏️ Edit
                  </button>
                  <button className="admin-act-btn delete-q" onClick={() => handleDeleteQ(q.id)}>
                    🗑️ Delete
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create / Edit Question Modal */}
      {showQModal && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel">
            <h2 className="modal-title">{isEditingQ ? "Edit Question Info" : "Create New Question"}</h2>
            <form onSubmit={handleQSubmit}>
              <div className="form-group">
                <label>Question Title</label>
                <input 
                  type="text" 
                  value={qTitle}
                  onChange={(e) => setQTitle(e.target.value)}
                  placeholder="e.g., How do you cleanse rose quartz crystal?"
                  className="form-control"
                  required
                />
              </div>

              <div className="form-group">
                <label>Additional Description / Context</label>
                <textarea 
                  value={qDesc}
                  onChange={(e) => setQDesc(e.target.value)}
                  placeholder="Provide context or details about the issue..."
                  className="form-control"
                  rows={3}
                />
              </div>

              <div className="form-group">
                <label>Category</label>
                <select 
                  value={qCategory}
                  onChange={(e) => setQCategory(e.target.value)}
                  className="form-control"
                >
                  <option value="Mind & Emotions">Mind & Emotions</option>
                  <option value="Chakra Healing">Chakra Healing</option>
                  <option value="Aura & Energy">Aura & Energy</option>
                  <option value="Meditation & Mindfulness">Meditation & Mindfulness</option>
                  <option value="Reiki Healing">Reiki Healing</option>
                </select>
              </div>

              <div className="form-group">
                <label>Asked By (Author)</label>
                <input 
                  type="text" 
                  value={qAskedBy}
                  onChange={(e) => setQAskedBy(e.target.value)}
                  className="form-control"
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowQModal(false)}>
                  Cancel
                </button>
                <Button type="submit" variant="gold">
                  {isEditingQ ? "Save Changes" : "Create"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Answer Question Modal */}
      {showAnsModal && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel" style={{ maxWidth: '550px' }}>
            <h2 className="modal-title">Write Certified Healer Answer</h2>
            <form onSubmit={handleAnsSubmit} style={{ maxHeight: '75vh', overflowY: 'auto', paddingRight: '10px' }}>
              
              <div className="form-row-grid">
                <div className="form-group">
                  <label>Healer Name</label>
                  <input 
                    type="text" 
                    value={ansHealerName}
                    onChange={(e) => setAnsHealerName(e.target.value)}
                    className="form-control"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Role</label>
                  <input 
                    type="text" 
                    value={ansHealerRole}
                    onChange={(e) => setAnsHealerRole(e.target.value)}
                    className="form-control"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Credentials / Bio</label>
                <input 
                  type="text" 
                  value={ansHealerCredentials}
                  onChange={(e) => setAnsHealerCredentials(e.target.value)}
                  placeholder="e.g. Holistic Therapist • 12 years experience"
                  className="form-control"
                  required
                />
              </div>

              <div className="form-group">
                <label>Avatar URL or Emoji symbol</label>
                <input 
                  type="text" 
                  value={ansHealerAvatar}
                  onChange={(e) => setAnsHealerAvatar(e.target.value)}
                  className="form-control"
                  required
                />
              </div>

              <div className="form-group">
                <label>Introductory Diagnostic Paragraph</label>
                <textarea 
                  value={ansContent}
                  onChange={(e) => setAnsContent(e.target.value)}
                  placeholder="Analyze the issue and write your main advice..."
                  className="form-control"
                  rows={4}
                  required
                />
              </div>

              <div className="form-group">
                <label>Structured Recommendations (One per line)</label>
                <textarea 
                  value={ansBulletsStr}
                  onChange={(e) => setAnsBulletsStr(e.target.value)}
                  placeholder="Sacral Node Alignment: Practice sound baths...&#10;Crystals: Use orange calcite..."
                  className="form-control"
                  rows={4}
                />
                <small className="help-text">Separate suggestions by key presses. Use a colon (:) to make a topic bold.</small>
              </div>

              <div className="form-group">
                <label>Encouraging Conclusion Paragraph</label>
                <textarea 
                  value={ansConclusion}
                  onChange={(e) => setAnsConclusion(e.target.value)}
                  placeholder="Consistency is key to spiritual wellness..."
                  className="form-control"
                  rows={2}
                  required
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowAnsModal(false)}>
                  Cancel
                </button>
                <Button type="submit" variant="gold">
                  Save Practitioner Reply
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        .admin-container {
          max-width: 1000px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        
        .toast-notify {
          position: fixed;
          top: 20px;
          right: 20px;
          background: #7c3aed;
          color: #ffffff;
          padding: 12px 24px;
          border-radius: 12px;
          font-weight: 700;
          font-size: 0.85rem;
          box-shadow: 0 8px 30px rgba(124,58,237,0.3);
          z-index: 1100;
          animation: fadeSlideIn 0.3s ease-out;
        }

        .admin-header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .admin-page-title {
          font-size: 1.8rem;
          font-family: var(--font-serif);
          color: #4c1d95;
          margin-bottom: 4px;
        }
        .admin-page-subtitle {
          color: hsl(var(--text-muted));
          font-size: 0.88rem;
        }

        .admin-toolbar {
          display: grid;
          grid-template-columns: 1fr 220px;
          gap: 16px;
          padding: 16px !important;
          border-radius: 14px;
        }
        .search-bar-wrapper {
          display: flex;
          align-items: center;
          background: #ffffff;
          border: 1px solid rgba(124, 58, 237, 0.15);
          border-radius: 10px;
          padding: 0 12px;
          width: 100%;
        }
        .search-icon-admin {
          color: #7c3aed;
          margin-right: 8px;
        }
        .admin-search-input {
          flex: 1;
          border: none;
          background: transparent;
          outline: none;
          padding: 10px 0;
          font-size: 0.85rem;
          color: #1f2937;
        }
        .category-select-wrapper {
          display: flex;
          align-items: center;
          background: #ffffff;
          border: 1px solid rgba(124, 58, 237, 0.15);
          border-radius: 10px;
          padding: 0 12px;
        }
        .filter-icon-admin {
          color: #7c3aed;
          margin-right: 8px;
        }
        .admin-filter-dropdown {
          border: none;
          background: transparent;
          outline: none;
          padding: 10px 0;
          font-size: 0.85rem;
          color: #4b5563;
          width: 100%;
          cursor: pointer;
        }

        .category-tabs {
          display: flex;
          gap: 8px;
          border-bottom: 1.5px solid rgba(0,0,0,0.06);
          padding-bottom: 8px;
        }
        .category-tab {
          background: transparent;
          border: none;
          padding: 10px 20px;
          font-size: 0.85rem;
          font-weight: 700;
          color: hsl(var(--text-muted));
          cursor: pointer;
          border-radius: 8px;
          transition: all 0.2s ease;
        }
        .category-tab:hover, .category-tab.active {
          color: #7c3aed;
          background: rgba(168, 85, 247, 0.06);
        }

        .loading-state-admin, .empty-state-admin {
          text-align: center;
          padding: 48px;
          color: hsl(var(--text-muted));
          font-size: 0.9rem;
          background: rgba(255,255,255,0.4);
          border: 1.5px dashed rgba(124,58,237,0.15);
          border-radius: 16px;
        }

        .questions-admin-grid {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .qa-admin-card {
          padding: 24px !important;
          display: flex;
          flex-direction: column;
          gap: 16px;
          border-radius: 16px;
        }
        .card-top-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .cat-badge-tag {
          background: rgba(124, 58, 237, 0.08);
          border: 1px solid rgba(124, 58, 237, 0.2);
          color: #7c3aed;
          font-size: 0.72rem;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: 6px;
          text-transform: uppercase;
        }
        .status-badge-tag {
          font-size: 0.72rem;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: 6px;
          display: flex;
          align-items: center;
        }
        .status-badge-tag.answered {
          background: rgba(16, 185, 129, 0.08);
          color: #059669;
          border: 1px solid rgba(16, 185, 129, 0.2);
        }
        .status-badge-tag.unanswered {
          background: rgba(245, 158, 11, 0.08);
          color: #d97706;
          border: 1px solid rgba(245, 158, 11, 0.2);
        }

        .qa-card-body {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .q-card-title {
          font-size: 1.15rem;
          font-weight: 750;
          color: #1e1b4b;
          font-family: var(--font-serif);
        }
        .q-card-description {
          font-size: 0.85rem;
          color: #4b5563;
          line-height: 1.5;
        }
        .q-card-meta {
          display: flex;
          gap: 8px;
          font-size: 0.76rem;
          color: #9ca3af;
          margin-top: 4px;
        }

        .healer-reply-preview {
          background: rgba(168, 85, 247, 0.03);
          border: 1px solid rgba(168, 85, 247, 0.1);
          padding: 14px;
          border-radius: 12px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .healer-preview-header {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.76rem;
          color: #7c3aed;
        }
        .healer-preview-body {
          font-size: 0.8rem;
          color: #6b7280;
          font-style: italic;
          line-height: 1.4;
        }

        .qa-card-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-top: 1px solid rgba(0,0,0,0.04);
          padding-top: 14px;
          margin-top: 4px;
        }
        .left-actions, .right-actions {
          display: flex;
          gap: 12px;
        }
        .admin-act-btn {
          background: transparent;
          border: none;
          font-size: 0.8rem;
          font-weight: 700;
          cursor: pointer;
          padding: 6px 12px;
          border-radius: 8px;
          transition: all 0.2s ease;
        }
        .admin-act-btn:hover {
          transform: translateY(-1px);
        }
        .answer-btn {
          background: rgba(124, 58, 237, 0.08);
          color: #7c3aed;
          border: 1px solid rgba(124, 58, 237, 0.15);
        }
        .answer-btn:hover {
          background: #7c3aed;
          color: #ffffff;
        }
        .remove-answer-btn {
          color: #ef4444;
          border: 1px solid rgba(239, 68, 68, 0.15);
          background: rgba(239, 68, 68, 0.03);
        }
        .remove-answer-btn:hover {
          background: #ef4444;
          color: #ffffff;
        }
        .edit-q {
          color: #4b5563;
          border: 1px solid rgba(0,0,0,0.06);
          background: rgba(0,0,0,0.02);
        }
        .edit-q:hover {
          background: #ffffff;
          border-color: rgba(0,0,0,0.15);
        }
        .delete-q {
          color: #ef4444;
        }
        .delete-q:hover {
          background: rgba(239, 68, 68, 0.05);
        }

        /* Modals */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.3);
          backdrop-filter: blur(8px);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1050;
        }
        .modal-content {
          width: 90%;
          max-width: 500px;
          padding: 28px !important;
          border-radius: 20px;
        }
        .modal-title {
          font-family: var(--font-serif);
          font-size: 1.4rem;
          color: #3b0764;
          margin-bottom: 20px;
          font-weight: 750;
        }
        .form-group {
          margin-bottom: 16px;
        }
        .form-group label {
          display: block;
          font-size: 0.8rem;
          font-weight: 700;
          color: #5b21b6;
          text-transform: uppercase;
          letter-spacing: 0.03em;
          margin-bottom: 6px;
        }
        .form-control {
          width: 100%;
          padding: 10px 14px;
          border: 1px solid rgba(124, 58, 237, 0.2);
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.6);
          font-size: 0.88rem;
          outline: none;
          color: #1f2937;
          font-family: inherit;
        }
        .form-control:focus {
          border-color: #7c3aed;
          box-shadow: 0 0 10px rgba(124,58,237,0.1);
        }
        textarea.form-control {
          resize: vertical;
        }
        .help-text {
          display: block;
          margin-top: 4px;
          font-size: 0.72rem;
          color: #6b7280;
        }
        .form-row-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          margin-top: 24px;
          border-top: 1px solid rgba(0,0,0,0.04);
          padding-top: 16px;
        }
        .btn-cancel {
          background: transparent;
          border: 1px solid rgba(0,0,0,0.08);
          color: #4b5563;
          padding: 10px 20px;
          border-radius: 10px;
          font-size: 0.85rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .btn-cancel:hover {
          background: rgba(0,0,0,0.03);
        }
      `}</style>
    </div>
  );
}
