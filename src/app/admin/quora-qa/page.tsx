"use client";

import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { 
  Trash2, Edit, CheckCircle2, AlertCircle, PlusCircle, Search, Filter, MessageSquare, Trash 
} from "lucide-react";
import StatsDashboard from "@/components/admin/StatsDashboard";

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

  const defaultCategories = [
    "Mind & Emotions",
    "Chakra Healing",
    "Aura & Energy",
    "Meditation & Mindfulness",
    "Reiki Healing"
  ];

  const [categories, setCategories] = useState<string[]>([]);
  const [showCatModal, setShowCatModal] = useState(false);
  const [newCatName, setNewCatName] = useState("");

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

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  useEffect(() => {
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

    const storedCats = localStorage.getItem("divingsanatan_quora_categories");
    if (storedCats) {
      try {
        setCategories(JSON.parse(storedCats));
      } catch (e) {
        setCategories(defaultCategories);
      }
    } else {
      setCategories(defaultCategories);
      localStorage.setItem("divingsanatan_quora_categories", JSON.stringify(defaultCategories));
    }

    setLoading(false);
  }, []);

  const saveToStorage = (newQuestions: QuestionItem[]) => {
    setQuestions(newQuestions);
    localStorage.setItem("divingsanatan_quora_questions", JSON.stringify(newQuestions));
  };

  const saveCategoriesToStorage = (newCats: string[]) => {
    setCategories(newCats);
    localStorage.setItem("divingsanatan_quora_categories", JSON.stringify(newCats));
  };

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newCatName.trim();
    if (!trimmed) return;
    if (categories.some(c => c.toLowerCase() === trimmed.toLowerCase())) {
      alert("Category already exists!");
      return;
    }
    const updated = [...categories, trimmed];
    saveCategoriesToStorage(updated);
    setNewCatName("");
    triggerToast(`Category "${trimmed}" added.`);
  };

  const handleDeleteCategory = (catToDelete: string) => {
    const count = questions.filter(q => q.category === catToDelete).length;
    let confirmMsg = `Are you sure you want to delete the category "${catToDelete}"?`;
    if (count > 0) {
      confirmMsg = `Warning: There are ${count} question(s) currently assigned to "${catToDelete}". Deleting it will keep the questions but remove the category from the list. Are you sure you want to proceed?`;
    }
    if (!window.confirm(confirmMsg)) return;

    const updated = categories.filter(c => c !== catToDelete);
    saveCategoriesToStorage(updated);
    triggerToast(`Category "${catToDelete}" removed.`);
  };

  // Question Handlers
  const handleOpenAddQ = () => {
    setIsEditingQ(false);
    setQTitle("");
    setQDesc("");
    setQCategory(categories[0] || "Mind & Emotions");
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

  // Pagination Logic
  const totalPages = Math.ceil(filteredQuestions.length / itemsPerPage);
  const paginatedQuestions = filteredQuestions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="dashboard-content">
      {/* Toast */}
      {toastMessage && (
        <div className="toast-notify">
          {toastMessage}
        </div>
      )}

      <StatsDashboard
        pageType="quora-qa"
        actions={
          <div style={{ display: "flex", gap: "8px" }}>
            <button className="btn btn-secondary btn-sm" onClick={() => setShowCatModal(true)}>
              <Filter size={12} style={{ marginRight: '6px' }} />
              Manage Categories
            </button>
            <button className="btn btn-primary btn-sm" onClick={handleOpenAddQ}>
              <PlusCircle size={12} style={{ marginRight: '6px' }} />
              Create Question
            </button>
          </div>
        }
      />


      {/* Filter and Search Bar */}
      <div className="filters-bar mb-3">
        <div style={{ display: "flex", gap: "10px", width: "100%", flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 250px", position: "relative" }}>
            <input 
              type="text" 
              placeholder="Search questions by text context..." 
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="form-control"
            />
          </div>

          <div style={{ flex: "0 1 200px", minWidth: "150px" }}>
            <select 
              value={activeCategory} 
              onChange={(e) => {
                setActiveCategory(e.target.value);
                setCurrentPage(1);
              }}
              className="form-control"
            >
              <option value="all">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="category-tabs mb-3">
        <button 
          className={`category-tab ${activeTab === "all" ? "active" : ""}`}
          onClick={() => {
            setActiveTab("all");
            setCurrentPage(1);
          }}
        >
          All Questions ({questions.length})
        </button>
        <button 
          className={`category-tab ${activeTab === "answered" ? "active" : ""}`}
          onClick={() => {
            setActiveTab("answered");
            setCurrentPage(1);
          }}
        >
          Answered ({questions.filter(q => !!q.bestAnswer).length})
        </button>
        <button 
          className={`category-tab ${activeTab === "unanswered" ? "active" : ""}`}
          onClick={() => {
            setActiveTab("unanswered");
            setCurrentPage(1);
          }}
        >
          Unanswered ({questions.filter(q => !q.bestAnswer).length})
        </button>
      </div>

      {/* List Table */}
      {loading ? (
        <p className="text-center" style={{ padding: "40px", color: "#6c757d" }}>Loading board data...</p>
      ) : (
        <Card variant="glass" className="admin-table-card card-primary">
          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Question & Context</th>
                  <th>Asked By</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Healer Reply</th>
                  <th className="text-right" style={{ minWidth: "180px" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedQuestions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center" style={{ padding: "20px" }}>No questions match your current filters.</td>
                  </tr>
                ) : (
                  paginatedQuestions.map(q => (
                    <tr key={q.id}>
                      <td>
                        <span className="category-badge">{q.category}</span>
                      </td>
                      <td>
                        <div className="question-title-cell" title={q.title}>
                          {q.title}
                        </div>
                        <div className="question-desc-cell" title={q.description}>
                          {q.description || "No context description."}
                        </div>
                      </td>
                      <td>{q.askedBy}</td>
                      <td style={{ whiteSpace: "nowrap" }}>{q.date}</td>
                      <td>
                        <span className={`status-badge ${q.bestAnswer ? 'confirmed' : 'pending'}`}>
                          {q.bestAnswer ? "Answered" : "Unanswered"}
                        </span>
                      </td>
                      <td>
                        {q.bestAnswer ? (
                          <div style={{ fontSize: "0.8rem", color: "#6d28d9" }}>
                            <strong>{q.bestAnswer.healerName}</strong>
                            <div className="healer-reply-text-cell" title={q.bestAnswer.content}>
                              {q.bestAnswer.content}
                            </div>
                          </div>
                        ) : (
                          <span style={{ fontSize: "0.8rem", color: "#adb5bd", fontStyle: "italic" }}>No reply yet</span>
                        )}
                      </td>
                      <td className="text-right" style={{ minWidth: "180px" }}>
                        <div style={{ display: "flex", gap: "4px", justifyContent: "flex-end" }}>
                          <button className="btn btn-primary btn-sm" onClick={() => handleOpenAnswer(q)}>
                            <MessageSquare size={12} style={{ marginRight: "3px" }} />
                            Reply
                          </button>
                          {q.bestAnswer && (
                            <button className="btn btn-secondary btn-sm" onClick={() => handleDeleteAnswer(q.id)} title="Delete Reply">
                              <Trash size={12} />
                            </button>
                          )}
                          <button className="btn btn-secondary btn-sm" onClick={() => handleOpenEditQ(q)}>
                            <Edit size={12} />
                          </button>
                          <button className="btn btn-danger btn-sm" onClick={() => handleDeleteQ(q.id)}>
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="admin-pagination-wrapper">
              <span className="pagination-info">
                Showing {filteredQuestions.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} to {Math.min(filteredQuestions.length, currentPage * itemsPerPage)} of {filteredQuestions.length} entries
              </span>
              <ul className="admin-pagination">
                <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                  <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1}>«</button>
                </li>
                <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                  <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1}>Prev</button>
                </li>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
                  <li key={pageNum} className={`page-item ${currentPage === pageNum ? 'active' : ''}`}>
                    <button onClick={() => setCurrentPage(pageNum)}>{pageNum}</button>
                  </li>
                ))}
                <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                  <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages}>Next</button>
                </li>
                <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                  <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages}>»</button>
                </li>
              </ul>
            </div>
          )}
        </Card>
      )}

      {/* Manage Categories Modal */}
      {showCatModal && (
        <div className="modal-overlay">
          <div className="modal-content card card-primary" style={{ width: "450px", padding: "0 !important" }}>
            <div style={{ borderBottom: "1px solid #dee2e6", padding: "12px 20px", background: "#f8f9fa", fontWeight: "700", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>Manage Q&A Categories</span>
              <button style={{ border: "none", background: "none", fontSize: "1.2rem", cursor: "pointer" }} onClick={() => setShowCatModal(false)}>✕</button>
            </div>
            
            <div style={{ padding: "20px" }}>
              {/* Category list */}
              <div style={{ maxHeight: "250px", overflowY: "auto", marginBottom: "20px", border: "1px solid #e9ecef", borderRadius: "6px", padding: "10px" }}>
                {categories.length === 0 ? (
                  <p style={{ color: "#6c757d", fontStyle: "italic", textAlign: "center", margin: "10px 0" }}>No categories defined. Please add one below.</p>
                ) : (
                  categories.map(cat => (
                    <div key={cat} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", borderBottom: "1px solid #f8f9fa" }} className="category-item-row">
                      <span style={{ fontWeight: 600, color: "#4b5563" }}>{cat}</span>
                      <button 
                        type="button" 
                        className="btn btn-danger btn-sm" 
                        style={{ padding: "4px 8px" }} 
                        onClick={() => handleDeleteCategory(cat)}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Add category form */}
              <form onSubmit={handleAddCategory}>
                <div className="form-group">
                  <label style={{ fontWeight: 600, marginBottom: "6px", display: "block" }}>Add New Category</label>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <input 
                      type="text" 
                      value={newCatName}
                      onChange={(e) => setNewCatName(e.target.value)}
                      placeholder="e.g., Crystal Healing"
                      className="form-control"
                      required
                    />
                    <button type="submit" className="btn btn-primary" style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                      <PlusCircle size={14} />
                      Add
                    </button>
                  </div>
                </div>
              </form>

              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "20px" }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowCatModal(false)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Question Modal */}
      {showQModal && (
        <div className="modal-overlay">
          <div className="modal-content card card-primary" style={{ width: "500px", padding: "0 !important" }}>
            <div style={{ borderBottom: "1px solid #dee2e6", padding: "12px 20px", background: "#f8f9fa", fontWeight: "700", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>{isEditingQ ? "Edit Question Info" : "Create New Question"}</span>
              <button style={{ border: "none", background: "none", fontSize: "1.2rem", cursor: "pointer" }} onClick={() => setShowQModal(false)}>✕</button>
            </div>
            <div style={{ padding: "20px" }}>
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
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
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

                <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "20px" }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowQModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {isEditingQ ? "Save Changes" : "Create"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Answer Question Modal */}
      {showAnsModal && (
        <div className="modal-overlay">
          <div className="modal-content card card-success" style={{ width: "550px", padding: "0 !important" }}>
            <div style={{ borderBottom: "1px solid #dee2e6", padding: "12px 20px", background: "#f8f9fa", fontWeight: "700", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>Write Certified Healer Answer</span>
              <button style={{ border: "none", background: "none", fontSize: "1.2rem", cursor: "pointer" }} onClick={() => setShowAnsModal(false)}>✕</button>
            </div>
            
            <div style={{ padding: "20px", maxHeight: "80vh", overflowY: "auto" }}>
              <form onSubmit={handleAnsSubmit}>
                
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "10px" }}>
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
                    rows={3}
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
                    rows={3}
                  />
                  <small style={{ color: "#6c757d", fontSize: "0.75rem", marginTop: "2px" }}>Separate suggestions by key presses. Use a colon (:) to make a topic bold.</small>
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

                <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "20px" }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowAnsModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-success">
                    Save Practitioner Reply
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.4);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1050;
        }
        .mb-3 {
          margin-bottom: 1rem;
        }
        :global(.admin-table-card) {
          padding: 0 !important;
          overflow: hidden;
        }
        .table-responsive {
          width: 100%;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
        }
        .question-title-cell {
          font-weight: 700;
          color: #4c1d95;
          font-size: 0.9rem;
          line-height: 1.4;
          max-width: 250px;
          word-break: break-word;
          overflow: hidden;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
        }
        .question-desc-cell {
          font-size: 0.78rem;
          color: #6c757d;
          max-width: 250px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          margin-top: 2px;
        }
        .healer-reply-text-cell {
          font-size: 0.72rem;
          color: #6c757d;
          max-width: 160px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .category-tabs {
          display: flex;
          border-bottom: 1px solid #dee2e6;
          padding-bottom: 8px;
          gap: 6px;
          overflow-x: auto;
          white-space: nowrap;
        }
        .category-tab {
          background: transparent;
          border: none;
          padding: 6px 12px;
          cursor: pointer;
          font-weight: 600;
          color: #6c757d;
          font-size: 0.88rem;
          border-radius: 4px;
          flex-shrink: 0;
        }
        .category-tab.active, .category-tab:hover {
          background: #e9ecef;
          color: #007bff;
        }
        .toast-notify {
          position: fixed;
          top: 20px;
          right: 20px;
          background: #28a745;
          color: #ffffff;
          padding: 12px 24px;
          border-radius: 4px;
          font-weight: 700;
          font-size: 0.85rem;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          z-index: 1100;
        }
      `}</style>
    </div>
  );
}
