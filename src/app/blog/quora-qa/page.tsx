"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

interface QAnswer {
  id: string;
  author: string;
  role: string;
  avatar: string;
  content: string;
  verified: boolean;
  upvotes: number;
  hasVideoReply?: boolean;
  videoTitle?: string;
}

interface QuestionItem {
  id: string;
  title: string;
  description: string;
  askedBy: string;
  date: string;
  upvotes: number;
  comments: number;
  answers: QAnswer[];
}

const QUESTIONS_DATA: QuestionItem[] = [
  {
    id: "q-1",
    title: "Can chakra healing help PCOS symptoms?",
    description: "I've been dealing with PCOS-related hormone volatility and fatigue for a year. Can balancing the Lower Abdomen nodes help stabilize cortisol levels?",
    askedBy: "Aditi S.",
    date: "2 days ago",
    upvotes: 18,
    comments: 4,
    answers: [
      {
        id: "a-1-1",
        author: "Acharya Sanatan",
        role: "Certified Somatic Healer",
        avatar: "🕉️",
        content: "Yes, absolutely. PCOS is heavily linked to nervous system hypersensitivity and high cortisol. By introducing sound therapy and crystal scanning at the Root (Muladhara) and Sacral (Svadhisthana) nodes, we soothe the fight-or-flight pathway. This directly lowers chronic cortisol production and helps regularize endocrine cycles. We recommend a focused 417Hz therapy program.",
        verified: true,
        upvotes: 32,
        hasVideoReply: true,
        videoTitle: "Acharya Sanatan: Somatic Solutions for PCOS (4m)",
      },
      {
        id: "a-1-2",
        author: "Meera Nair",
        role: "Holistic Health Practitioner",
        avatar: "🧘‍♀️",
        content: "I recommend combining crystal alignments with dietary adjustments. Orange Calcite placed on the lower abdomen during sound baths has shown positive clinical improvements in pelvic comfort.",
        verified: false,
        upvotes: 12,
      },
    ],
  },
  {
    id: "q-2",
    title: "What causes a sudden warmth in the hands during meditation?",
    description: "Sometimes during deep meditation, my palms start feeling extremely hot. Does this relate to reiki or active energy channels?",
    askedBy: "Rohan K.",
    date: "1 week ago",
    upvotes: 10,
    comments: 2,
    answers: [
      {
        id: "a-2-1",
        author: "Sadhvi Mira",
        role: "Energy Master",
        avatar: "✨",
        content: "This is a classical sign of prana (vital force) activation. The minor chakras in your palms are starting to open and project energy. This warmth means you are ready to explore healing applications, such as Reiki or energy direction.",
        verified: true,
        upvotes: 19,
        hasVideoReply: false,
      },
    ],
  },
];

export default function QuoraQAPage() {
  const [questions, setQuestions] = useState<QuestionItem[]>(QUESTIONS_DATA);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedQuestionId, setSelectedQuestionId] = useState("q-1");
  const [newQuestionText, setNewQuestionText] = useState("");

  const handleAskQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestionText) return;
    
    const newQ: QuestionItem = {
      id: `q-${Date.now()}`,
      title: newQuestionText,
      description: "Asked by community member. Waiting for practitioner diagnostics...",
      askedBy: "You",
      date: "Just now",
      upvotes: 0,
      comments: 0,
      answers: [],
    };

    setQuestions([newQ, ...questions]);
    setSelectedQuestionId(newQ.id);
    setNewQuestionText("");
    alert("Your question has been posted to the Diving Sanatan community board!");
  };

  const handleUpvoteQuestion = (qId: string) => {
    setQuestions(
      questions.map((q) => {
        if (q.id === qId) {
          return { ...q, upvotes: q.upvotes + 1 };
        }
        return q;
      })
    );
  };

  const handleUpvoteAnswer = (qId: string, aId: string) => {
    setQuestions(
      questions.map((q) => {
        if (q.id === qId) {
          return {
            ...q,
            answers: q.answers.map((a) => {
              if (a.id === aId) {
                return { ...a, upvotes: a.upvotes + 1 };
              }
              return a;
            }),
          };
        }
        return q;
      })
    );
  };

  const activeQuestion = questions.find((q) => q.id === selectedQuestionId) || questions[0];

  const filteredQuestions = questions.filter(
    (q) =>
      q.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="quora-qa-page">
      <div className="qa-header">
        <h1 className="page-title">Community Q&A Board</h1>
        <p className="page-subtitle">
          Ask our certified practitioners questions about energy alignment, sound therapy, and crystals.
        </p>

        {/* Search */}
        <div className="qa-search-wrapper">
          <input
            type="text"
            placeholder="Search community questions..."
            className="glass-input qa-search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="qa-grid">
        {/* Left: Ask Question & Questions List */}
        <div className="questions-column">
          {/* Ask Box */}
          <Card variant="glass" className="ask-box-card">
            <h3 className="card-mini-title">Ask the Community</h3>
            <form onSubmit={handleAskQuestion} className="ask-form">
              <input
                type="text"
                placeholder="Can chakra scanning help with...?"
                value={newQuestionText}
                onChange={(e) => setNewQuestionText(e.target.value)}
                className="glass-input ask-input"
                required
              />
              <Button type="submit" variant="gold" size="sm">
                Ask Question
              </Button>
            </form>
          </Card>

          {/* List */}
          <div className="questions-list-panel glass-panel">
            <h4 className="list-panel-title">Active Discussions</h4>
            <div className="q-list">
              {filteredQuestions.length === 0 ? (
                <div className="q-empty">No matching questions found.</div>
              ) : (
                filteredQuestions.map((q) => (
                  <button
                    key={q.id}
                    className={`q-list-item ${selectedQuestionId === q.id ? "active" : ""}`}
                    onClick={() => setSelectedQuestionId(q.id)}
                  >
                    <span className="q-item-title">{q.title}</span>
                    <div className="q-item-meta">
                      <span>{q.askedBy}</span>
                      <span>•</span>
                      <span>{q.upvotes} Upvotes</span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right: Selected Question Detail & Answers */}
        <div className="details-column">
          <Card variant="glass" className="q-detail-card">
            <div className="q-detail-header">
              <span className="q-date">{activeQuestion.date}</span>
              <h2 className="q-detail-title">{activeQuestion.title}</h2>
              <p className="q-detail-desc">{activeQuestion.description}</p>
              
              <div className="q-detail-footer">
                <span>Asked by: <strong>{activeQuestion.askedBy}</strong></span>
                <div className="q-actions">
                  <Button variant="gold-outline" size="sm" onClick={() => handleUpvoteQuestion(activeQuestion.id)}>
                    ▲ Upvote ({activeQuestion.upvotes})
                  </Button>
                </div>
              </div>
            </div>

            {/* Answers Section */}
            <div className="answers-section">
              <h3 className="answers-section-title">
                {activeQuestion.answers.length} {activeQuestion.answers.length === 1 ? "Answer" : "Answers"}
              </h3>

              {activeQuestion.answers.length === 0 ? (
                <div className="no-answers-box">
                  <p>No practitioner has answered this question yet. Our certified healers review new questions daily.</p>
                </div>
              ) : (
                <div className="answers-list">
                  {activeQuestion.answers.map((ans) => (
                    <div key={ans.id} className="answer-item">
                      <div className="healer-profile-header">
                        <div className="healer-avatar">{ans.avatar}</div>
                        <div className="healer-meta">
                          <span className="healer-name">{ans.author}</span>
                          <span className="healer-role">{ans.role}</span>
                        </div>
                        {ans.verified && (
                          <div className="verified-tag">
                            <span className="chk">✓</span> Expert Verified
                          </div>
                        )}
                      </div>

                      <p className="answer-text">{ans.content}</p>

                      {ans.hasVideoReply && (
                        <div className="video-reply-box" onClick={() => alert("Launching mock video explanation...")}>
                          <div className="video-reply-screen">
                            <div className="play-overlay-icon">
                              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                <polygon points="5 3 19 12 5 21 5 3" />
                              </svg>
                            </div>
                            <span className="v-title">{ans.videoTitle}</span>
                          </div>
                        </div>
                      )}

                      <div className="answer-footer">
                        <Button variant="gold-outline" size="sm" onClick={() => handleUpvoteAnswer(activeQuestion.id, ans.id)}>
                          ▲ Upvote ({ans.upvotes})
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      <style jsx>{`
        .quora-qa-page {
          display: flex;
          flex-direction: column;
          gap: 40px;
          width: 100%;
        }
        .qa-header {
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
        }
        .page-title {
          font-size: 2.8rem;
          color: #4c1d95;
        }
        .page-subtitle {
          font-size: 1.05rem;
          color: hsl(var(--text-muted));
          max-width: 650px;
        }
        .qa-search-wrapper {
          width: 100%;
          display: flex;
          justify-content: center;
        }
        .qa-search-input {
          max-width: 480px;
          border-radius: 99px;
          text-align: center;
          border: 1px solid var(--gold-border);
        }
        .qa-grid {
          display: grid;
          grid-template-columns: 320px 1fr;
          gap: 32px;
          align-items: flex-start;
        }
        .questions-column {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .ask-box-card {
          padding: 20px !important;
          border-radius: 16px;
        }
        .card-mini-title {
          font-size: 1.1rem;
          color: #4c1d95;
          margin-bottom: 12px;
        }
        .ask-form {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .ask-input {
          font-size: 0.85rem;
          padding: 10px 14px;
          border-radius: 8px;
        }
        .questions-list-panel {
          padding: 20px;
          border-radius: 16px;
        }
        .list-panel-title {
          font-size: 1.1rem;
          color: #4c1d95;
          margin-bottom: 16px;
          border-bottom: 1px solid rgba(0, 0, 0, 0.05);
          padding-bottom: 8px;
        }
        .q-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .q-list-item {
          display: flex;
          flex-direction: column;
          gap: 6px;
          background: transparent;
          border: 1px solid transparent;
          border-radius: 10px;
          padding: 12px;
          text-align: left;
          cursor: pointer;
          transition: var(--transition-fast);
        }
        .q-list-item:hover {
          background: rgba(168, 85, 247, 0.03);
          border-color: rgba(168, 85, 247, 0.08);
        }
        .q-list-item.active {
          background: linear-gradient(135deg, rgba(251, 207, 232, 0.15) 0%, rgba(233, 213, 255, 0.15) 100%);
          border-color: rgba(168, 85, 247, 0.25);
        }
        .q-item-title {
          font-size: 0.95rem;
          font-weight: 600;
          color: #4c1d95;
          font-family: var(--font-serif);
          line-height: 1.3;
        }
        .q-item-meta {
          display: flex;
          gap: 8px;
          font-size: 0.72rem;
          color: hsl(var(--text-muted));
        }
        .q-empty {
          text-align: center;
          padding: 20px 0;
          color: hsl(var(--text-muted));
          font-size: 0.88rem;
        }
        .details-column {
          width: 100%;
        }
        .q-detail-card {
          padding: 30px !important;
          border-radius: 20px;
          display: flex;
          flex-direction: column;
          gap: 32px;
        }
        .q-detail-header {
          display: flex;
          flex-direction: column;
          gap: 12px;
          border-bottom: 1px solid rgba(0, 0, 0, 0.05);
          padding-bottom: 24px;
        }
        .q-date {
          font-size: 0.8rem;
          color: hsl(var(--text-muted));
        }
        .q-detail-title {
          font-size: 2.2rem;
          color: #4c1d95;
          line-height: 1.25;
        }
        .q-detail-desc {
          font-size: 1.05rem;
          line-height: 1.6;
          color: hsl(var(--text-cream));
        }
        .q-detail-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 10px;
          font-size: 0.85rem;
          color: hsl(var(--text-muted));
        }
        .answers-section-title {
          font-size: 1.4rem;
          color: #4c1d95;
          margin-bottom: 20px;
        }
        .answers-list {
          display: flex;
          flex-direction: column;
          gap: 32px;
        }
        .answer-item {
          display: flex;
          flex-direction: column;
          gap: 16px;
          border-bottom: 1.5px dashed rgba(0, 0, 0, 0.05);
          padding-bottom: 24px;
        }
        .answers-list .answer-item:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }
        .healer-profile-header {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .healer-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: rgba(168, 85, 247, 0.08);
          border: 1px solid rgba(168, 85, 247, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.2rem;
        }
        .healer-meta {
          display: flex;
          flex-direction: column;
          gap: 2px;
          flex: 1;
        }
        .healer-name {
          font-family: var(--font-serif);
          font-size: 1.1rem;
          font-weight: 600;
          color: #4c1d95;
        }
        .healer-role {
          font-size: 0.78rem;
          color: hsl(var(--text-muted));
        }
        .verified-tag {
          display: flex;
          align-items: center;
          gap: 6px;
          background: rgba(16, 185, 129, 0.06);
          border: 1px solid rgba(16, 185, 129, 0.2);
          color: #065f46;
          font-size: 0.72rem;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: 6px;
          text-transform: uppercase;
        }
        .chk { font-weight: bold; }
        .answer-text {
          font-size: 1.05rem;
          line-height: 1.7;
          color: hsl(var(--text-cream));
        }
        .video-reply-box {
          border-radius: 12px;
          overflow: hidden;
          max-width: 480px;
          cursor: pointer;
          border: 1px solid rgba(168, 85, 247, 0.2);
        }
        .video-reply-screen {
          height: 140px;
          background: linear-gradient(135deg, #1e1b4b 0%, #31105c 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          gap: 12px;
          position: relative;
          transition: var(--transition-fast);
        }
        .video-reply-screen:hover {
          filter: brightness(1.1);
        }
        .play-overlay-icon {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: #7c3aed;
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          padding-left: 3px;
          box-shadow: 0 4px 12px rgba(124, 58, 237, 0.4);
        }
        .v-title {
          font-size: 0.85rem;
          font-weight: 600;
          color: #e9d5ff;
          text-shadow: 0 2px 4px rgba(0,0,0,0.5);
        }
        .no-answers-box {
          text-align: center;
          padding: 24px;
          border-radius: 12px;
          background: rgba(0, 0, 0, 0.01);
          border: 1.5px dashed rgba(0,0,0,0.05);
          color: hsl(var(--text-muted));
          font-size: 0.95rem;
        }

        @media (max-width: 860px) {
          .qa-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
