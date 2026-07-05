"use client";

import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Plus, Edit, Trash2 } from "lucide-react";

interface Question {
  id: string;
  category: string;
  question_text: string;
  question_type: string;
  options: string[];
}

export default function QuizQuestionsAdmin() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState("");
  
  // Form state
  const [category, setCategory] = useState("Anxiety");
  const [questionText, setQuestionText] = useState("");
  const [questionType, setQuestionType] = useState("choice");
  const [optionsStr, setOptionsStr] = useState(""); // Comma separated options for choice questions
  const [error, setError] = useState("");

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const categoriesList = ["all", "Anxiety", "Stress", "Loss", "Health"];

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/quiz-questions");
      const json = await res.json();
      if (json.success) {
        setQuestions(json.data || []);
        setCurrentPage(1);
      }
    } catch (err) {
      console.error("Failed to load questions:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setIsEditing(false);
    setCategory("Anxiety");
    setQuestionText("");
    setQuestionType("choice");
    setOptionsStr("");
    setError("");
    setShowModal(true);
  };

  const handleOpenEdit = (q: Question) => {
    setIsEditing(true);
    setCurrentId(q.id);
    setCategory(q.category);
    setQuestionText(q.question_text);
    setQuestionType(q.question_type);
    setOptionsStr(Array.isArray(q.options) ? q.options.join(", ") : "");
    setError("");
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this question?")) return;
    try {
      const res = await fetch(`/api/quiz-questions?id=${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        setQuestions(questions.filter((q) => q.id !== id));
      } else {
        alert("Error: " + json.error);
      }
    } catch (err) {
      console.error("Failed to delete question:", err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!questionText.trim()) {
      setError("Question text is required.");
      return;
    }

    let parsedOptions: string[] = [];
    if (questionType === "choice") {
      if (!optionsStr.trim()) {
        setError("Choice options are required for choice-type questions.");
        return;
      }
      parsedOptions = optionsStr
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
      if (parsedOptions.length === 0) {
        setError("Choice options are required for choice-type questions.");
        return;
      }
    }

    const payload = {
      id: currentId,
      category,
      question_text: questionText.trim(),
      question_type: questionType,
      options: parsedOptions
    };

    try {
      const url = "/api/quiz-questions";
      const method = isEditing ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const json = await res.json();

      if (json.success) {
        setShowModal(false);
        fetchQuestions();
      } else {
        setError(json.error || "Failed to save question.");
      }
    } catch (err) {
      setError("An unexpected error occurred.");
    }
  };

  const filteredQuestions = activeCategory === "all"
    ? questions
    : questions.filter((q) => q.category === activeCategory);

  // Pagination Logic
  const totalPages = Math.ceil(filteredQuestions.length / itemsPerPage);
  const paginatedQuestions = filteredQuestions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="dashboard-content">
      <div className="flex-between mb-3">
        <p style={{ margin: 0, color: "#6c757d", fontSize: "0.9rem" }}>
          Manage emotional query questions served to users on storefront landing pages.
        </p>
        <button className="btn btn-primary btn-sm" onClick={handleOpenAdd}>
          <Plus size={12} style={{ marginRight: "6px" }} />
          Create Question
        </button>
      </div>

      {/* Tabs / Filter Navigation */}
      <div className="category-tabs mb-3">
        {categoriesList.map((cat) => (
          <button
            key={cat}
            className={`category-tab ${activeCategory === cat ? "active" : ""}`}
            onClick={() => {
              setActiveCategory(cat);
              setCurrentPage(1);
            }}
          >
            {cat === "all" ? "All Categories" : cat}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-center" style={{ padding: "40px", color: "#6c757d" }}>Loading questions...</p>
      ) : (
        <Card variant="glass" className="card-primary" style={{ padding: "0 !important" }}>
          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Type</th>
                  <th>Question Text</th>
                  <th>Options Preview</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedQuestions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center" style={{ padding: "20px" }}>No quiz questions found in this category.</td>
                  </tr>
                ) : (
                  paginatedQuestions.map(q => (
                    <tr key={q.id}>
                      <td>
                        <span className="category-badge">{q.category}</span>
                      </td>
                      <td>
                        <span className={`type-badge ${q.question_type === 'choice' ? 'choice-type' : 'text-type'}`} style={{
                          background: q.question_type === 'choice' ? '#d4edda' : '#cce5ff',
                          color: q.question_type === 'choice' ? '#155724' : '#004085',
                          borderColor: q.question_type === 'choice' ? '#c3e6cb' : '#b8daff'
                        }}>
                          {q.question_type === 'choice' ? 'Choice' : 'Open Text'}
                        </span>
                      </td>
                      <td><strong>{q.question_text}</strong></td>
                      <td>
                        {q.question_type === 'choice' && Array.isArray(q.options) ? (
                          <div style={{ fontSize: "0.8rem", color: "#6c757d" }}>
                            {q.options.join(" | ")}
                          </div>
                        ) : (
                          <span style={{ fontSize: "0.8rem", color: "#adb5bd", fontStyle: "italic" }}>Text Input Answer</span>
                        )}
                      </td>
                      <td className="text-right">
                        <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
                          <button className="btn btn-secondary btn-sm" onClick={() => handleOpenEdit(q)}>
                            <Edit size={12} />
                          </button>
                          <button className="btn btn-danger btn-sm" onClick={() => handleDelete(q.id)}>
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

      {/* Create / Edit Question Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content card card-primary" style={{ width: "460px", padding: "0 !important" }}>
            <div style={{ borderBottom: "1px solid #dee2e6", padding: "12px 20px", background: "#f8f9fa", fontWeight: "700", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>{isEditing ? "Edit Question" : "New Question"}</span>
              <button style={{ border: "none", background: "none", fontSize: "1.2rem", cursor: "pointer" }} onClick={() => setShowModal(false)}>✕</button>
            </div>
            
            <div style={{ padding: "20px" }}>
              <form onSubmit={handleSubmit}>
                {error && (
                  <div className="error-alert" style={{ background: "#f8d7da", border: "1px solid #f5c6cb", color: "#721c24", padding: "8px 12px", borderRadius: "4px", marginBottom: "15px", fontSize: "0.85rem" }}>
                    {error}
                  </div>
                )}
                
                <div className="form-group">
                  <label>Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="form-control"
                  >
                    <option value="Anxiety">Anxiety</option>
                    <option value="Stress">Stress</option>
                    <option value="Loss">Loss</option>
                    <option value="Health">Health</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Question Text</label>
                  <textarea
                    value={questionText}
                    onChange={(e) => setQuestionText(e.target.value)}
                    placeholder="e.g., Since when have you been feeling this?"
                    className="form-control"
                    rows={3}
                  />
                </div>

                <div className="form-group">
                  <label>Question Type</label>
                  <select
                    value={questionType}
                    onChange={(e) => setQuestionType(e.target.value)}
                    className="form-control"
                  >
                    <option value="choice">Multiple Choice</option>
                    <option value="text">Open Text Answer</option>
                  </select>
                </div>

                {questionType === "choice" && (
                  <div className="form-group">
                    <label>Options (Comma separated list)</label>
                    <input
                      type="text"
                      value={optionsStr}
                      onChange={(e) => setOptionsStr(e.target.value)}
                      placeholder="Option 1, Option 2, Option 3..."
                      className="form-control"
                    />
                    <small style={{ color: "#6c757d", fontSize: "0.75rem", marginTop: "2px" }}>Enter choices separated by commas (e.g. Yes, No, Maybe)</small>
                  </div>
                )}

                <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "20px" }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {isEditing ? "Save Changes" : "Create"}
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
        .table-responsive {
          width: 100%;
          overflow-x: auto;
        }
        .category-tabs {
          display: flex;
          border-bottom: 1px solid #dee2e6;
          padding-bottom: 8px;
          gap: 6px;
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
        }
        .category-tab.active, .category-tab:hover {
          background: #e9ecef;
          color: #007bff;
        }
      `}</style>
    </div>
  );
}
