"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

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

  return (
    <div className="admin-container">
      <div className="admin-header-row">
        <div>
          <h1 className="admin-page-title">Quiz Questions Bank</h1>
          <p className="admin-page-subtitle">Manage emotional query questions served to user on landing</p>
        </div>
        <Button variant="gold" onClick={handleOpenAdd}>
          + Create Question
        </Button>
      </div>

      {/* Tabs */}
      <div className="category-tabs">
        {categoriesList.map((cat) => (
          <button
            key={cat}
            className={`category-tab ${activeCategory === cat ? "active" : ""}`}
            onClick={() => setActiveCategory(cat)}
          >
            {cat === "all" ? "All Categories" : cat}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading-state">Loading questions...</div>
      ) : filteredQuestions.length === 0 ? (
        <div className="empty-state">No questions found in this category.</div>
      ) : (
        <div className="questions-grid">
          {filteredQuestions.map((q) => (
            <Card key={q.id} variant="glass" className="question-card">
              <div className="question-card-header">
                <span className="category-badge">{q.category}</span>
                <span className={`type-badge ${q.question_type}`}>{q.question_type}</span>
              </div>
              
              <h3 className="question-text">{q.question_text}</h3>
              
              {q.question_type === "choice" && Array.isArray(q.options) && (
                <div className="options-preview">
                  <strong>Options:</strong>
                  <ul>
                    {q.options.map((opt, i) => (
                      <li key={i}>{opt}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              <div className="card-actions">
                <button className="action-btn edit" onClick={() => handleOpenEdit(q)}>
                  ✏️ Edit
                </button>
                <button className="action-btn delete" onClick={() => handleDelete(q.id)}>
                  🗑️ Delete
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel">
            <h2 className="modal-title">{isEditing ? "Edit Question" : "New Question"}</h2>
            
            <form onSubmit={handleSubmit}>
              {error && <div className="form-error">{error}</div>}
              
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
                  <small className="help-text">Enter choices separated by commas (e.g. Yes, No, Maybe)</small>
                </div>
              )}

              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <Button type="submit" variant="gold">
                  {isEditing ? "Save Changes" : "Create"}
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
        }
        .admin-header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 32px;
        }
        .admin-page-title {
          font-size: 2rem;
          color: #4c1d95;
          margin-bottom: 6px;
        }
        .admin-page-subtitle {
          color: hsl(var(--text-muted));
          font-size: 0.95rem;
        }
        .category-tabs {
          display: flex;
          gap: 12px;
          margin-bottom: 24px;
          border-bottom: 1px solid rgba(0,0,0,0.06);
          padding-bottom: 12px;
        }
        .category-tab {
          background: transparent;
          border: none;
          padding: 8px 16px;
          font-size: 0.9rem;
          font-weight: 600;
          color: hsl(var(--text-muted));
          cursor: pointer;
          border-radius: 6px;
          transition: var(--transition-fast);
        }
        .category-tab:hover, .category-tab.active {
          color: #7c3aed;
          background: rgba(168, 85, 247, 0.05);
        }
        .loading-state, .empty-state {
          text-align: center;
          padding: 40px;
          color: hsl(var(--text-muted));
        }
        .questions-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
          gap: 24px;
        }
        .question-card {
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .question-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .category-badge {
          background: rgba(168, 85, 247, 0.08);
          border: 1px solid rgba(168, 85, 247, 0.2);
          color: #7c3aed;
          font-size: 0.75rem;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: 6px;
          text-transform: uppercase;
        }
        .type-badge {
          font-size: 0.72rem;
          font-weight: 600;
          padding: 3px 8px;
          border-radius: 4px;
          text-transform: uppercase;
        }
        .type-badge.choice {
          background: rgba(16, 185, 129, 0.08);
          color: #059669;
          border: 1px solid rgba(16, 185, 129, 0.2);
        }
        .type-badge.text {
          background: rgba(59, 130, 246, 0.08);
          color: #2563eb;
          border: 1px solid rgba(59, 130, 246, 0.2);
        }
        .question-text {
          font-size: 1.2rem;
          font-family: var(--font-sans);
          font-weight: 600;
          color: #1e1b4b;
        }
        .options-preview {
          background: rgba(0,0,0,0.02);
          border: 1px solid rgba(0,0,0,0.04);
          padding: 12px;
          border-radius: 8px;
          font-size: 0.88rem;
        }
        .options-preview ul {
          margin-top: 6px;
          padding-left: 20px;
          color: hsl(var(--text-muted));
        }
        .card-actions {
          display: flex;
          justify-content: flex-end;
          gap: 16px;
          border-top: 1px solid rgba(0,0,0,0.05);
          padding-top: 16px;
          margin-top: auto;
        }
        .action-btn {
          background: transparent;
          border: none;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 4px;
          transition: var(--transition-fast);
        }
        .action-btn:hover {
          filter: brightness(0.8);
        }
        .action-btn.edit {
          color: #7c3aed;
        }
        .action-btn.delete {
          color: #ef4444;
        }

        /* Modal styling */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.4);
          backdrop-filter: blur(8px);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
        }
        .modal-content {
          max-width: 500px;
          width: 90%;
          padding: 36px;
        }
        .modal-title {
          font-size: 1.5rem;
          margin-bottom: 20px;
          color: #4c1d95;
        }
        .form-error {
          background: rgba(239, 68, 68, 0.08);
          border: 1px solid rgba(239, 68, 68, 0.2);
          color: #ef4444;
          padding: 10px;
          border-radius: 8px;
          font-size: 0.85rem;
          margin-bottom: 16px;
        }
        .form-group {
          margin-bottom: 20px;
        }
        .form-group label {
          display: block;
          font-size: 0.88rem;
          font-weight: 600;
          margin-bottom: 6px;
          color: #334155;
        }
        .form-control {
          width: 100%;
          padding: 12px;
          border: 1px solid rgba(0,0,0,0.1);
          border-radius: 8px;
          background: rgba(0,0,0,0.01);
          font-size: 0.95rem;
          color: #1e293b;
          outline: none;
          font-family: inherit;
        }
        .form-control:focus {
          border-color: #7c3aed;
          box-shadow: 0 0 10px rgba(124, 58, 237, 0.1);
        }
        .help-text {
          display: block;
          margin-top: 4px;
          font-size: 0.75rem;
          color: hsl(var(--text-muted));
        }
        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          margin-top: 24px;
        }
        .btn-cancel {
          background: transparent;
          border: 1px solid rgba(0,0,0,0.08);
          color: #64748b;
          padding: 12px 24px;
          border-radius: 12px;
          font-size: 0.88rem;
          font-weight: 600;
          cursor: pointer;
          transition: var(--transition-fast);
        }
        .btn-cancel:hover {
          background: rgba(0,0,0,0.02);
        }
      `}</style>
    </div>
  );
}
