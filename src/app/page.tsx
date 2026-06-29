"use client";

import React, { useState, useEffect, useRef } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { formatCurrency } from "@/utils/formatters";
import { useRouter } from "next/navigation";
import { Brain, Heart, DollarSign, Compass, Users, User, Sparkles, Grid, Search, ArrowRight, Shield, Flower } from "lucide-react";

import { Service, Category } from "@/types/database";

export default function Home() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [faqOpen, setFaqOpen] = useState(false);


  // Multi-step Quiz Flow States
  const [activeStep, setActiveStep] = useState<1 | 2 | 3 | 4>(1);

  const triggerStepTransition = (nextStep: number) => {
    setActiveStep(nextStep as 1 | 2 | 3 | 4);
  };
  const getDbCategory = (cat: string): string => {
    const mapping: Record<string, string> = {
      "Anxiety & overthinking": "Anxiety",
      "Anxiety & Overthinking": "Anxiety",
      "Relationship pain": "Loss",
      "Relationship Pain": "Loss",
      "Financial stress": "Stress",
      "Financial Stress": "Stress",
      "No life direction": "Loss",
      "Life Direction": "Loss",
      "Life partner": "Loss",
      "Family conflict": "Stress",
      "Family Conflict": "Stress",
      "Spiritual crisis": "Anxiety",
      "Spiritual Crisis": "Anxiety",
      "Self Love & Confidence": "Anxiety",
      "Career & business": "Stress",
      "Anxious and Lost": "Anxiety",
      "Stressed and Fatigued": "Stress",
      "Need Mental Clarity": "Health",
      "Spiritual Blockage": "Anxiety",
      "Anxiety": "Anxiety",
      "Stress": "Stress",
      "Loss": "Loss",
      "Health": "Health"
    };
    return mapping[cat] || "Stress";
  };

  const [selectedCategory, setSelectedCategory] = useState("Stress");
  const [currentQuestions, setCurrentQuestions] = useState<any[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  // Profile Form States
  const [profileForm, setProfileForm] = useState({
    name: "",
    email: "",
    phone: "",
    gender: "Female",
    dob: ""
  });
  const [submittingProfile, setSubmittingProfile] = useState(false);
  const [submittedProfileId, setSubmittedProfileId] = useState("");
  const [chakraScores, setChakraScores] = useState<Record<string, number>>({
    Root: 80,
    Sacral: 75,
    Solar: 70,
    Heart: 85,
    Throat: 65,
    ThirdEye: 70,
    Crown: 80
  });

  // Validation and prefill states
  const [profileErrors, setProfileErrors] = useState<Record<string, string>>({});
  const [hasSavedProfile, setHasSavedProfile] = useState(false);
  const [searchError, setSearchError] = useState(false);
  const [quizTextError, setQuizTextError] = useState(false);
  const [quizTextVal, setQuizTextVal] = useState("");

  // Load profile from localStorage on mount
  useEffect(() => {
    const saved = window.localStorage.getItem("divingsanatan_user_profile");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setProfileForm(parsed);
        setHasSavedProfile(true);
      } catch (e) {
        console.error("Failed to parse saved profile", e);
      }
    }
  }, []);

  // Handle incoming search query parameter on mount to auto-start quiz
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const query = params.get("search");
      if (query) {
        const decodedQuery = decodeURIComponent(query);
        setSearchQuery(decodedQuery);
        
        // Match the category based on query contents
        const q = decodedQuery.toLowerCase();
        let category = "Stress";
        if (q.includes("anxi") || q.includes("worry") || q.includes("fear") || q.includes("panic") || q.includes("social") || q.includes("overthink")) {
          category = "Anxiety & overthinking";
        } else if (q.includes("stress") || q.includes("fatigue") || q.includes("tired") || q.includes("burnout") || q.includes("work") || q.includes("job") || q.includes("crisis")) {
          category = "Financial stress";
        } else if (q.includes("loss") || q.includes("grief") || q.includes("sad") || q.includes("depress") || q.includes("lonely") || q.includes("death") || q.includes("relationship")) {
          category = "Relationship pain";
        } else if (q.includes("direction") || q.includes("lost") || q.includes("career") || q.includes("purpose")) {
          category = "No life direction";
        }
        
        startQuiz(category);
        
        // Clean up the URL query params so it doesn't re-trigger on reload
        const newUrl = window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);
      }
    }
  }, []);

  const sliderRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    sliderRef.current?.style.setProperty("--slider-offset", `${(activeStep - 1) * 25}%`);
  }, [activeStep]);

  useEffect(() => {
    if (currentQuestions.length > 0) {
      const pct = ((currentQuestionIndex + 1) / currentQuestions.length) * 100;
      progressBarRef.current?.style.setProperty("--progress", `${pct}%`);
    }
  }, [currentQuestionIndex, currentQuestions.length]);

  // Fetch services and categories from API
  useEffect(() => {
    async function fetchStorefrontData() {
      try {
        const [servRes, catRes] = await Promise.all([
          fetch("/api/services"),
          fetch("/api/categories")
        ]);

        const servJson = await servRes.json();
        const catJson = await catRes.json();

        if (servJson.success && catJson.success) {
          setServices(servJson.data);
          setCategories(catJson.data);
        }
      } catch (err) {
        console.error("Failed to load storefront data:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchStorefrontData();
  }, []);

  // Quick feelings links
  const feelings = [
    { label: "Anxious and Lost", category: "Anxiety" },
    { label: "Stressed and Fatigued", category: "Stress" },
    { label: "Need Mental Clarity", category: "Health" },
    { label: "Spiritual Blockage", category: "Anxiety" }
  ];

  const handleBackStep = () => {
    if (activeStep > 1) {
      triggerStepTransition(activeStep - 1);
    }
  };

  const startQuiz = async (cat: string) => {
    setSelectedCategory(cat);
    triggerStepTransition(2);
    setCurrentQuestionIndex(0);
    setAnswers({});

    try {
      const dbCat = getDbCategory(cat);
      const res = await fetch(`/api/quiz-questions?category=${encodeURIComponent(dbCat)}`);
      const json = await res.json();
      if (json.success && json.data && json.data.length > 0) {
        setCurrentQuestions(json.data);
      } else {
        // Fallback questions if database query is empty
        const fallbacks = [
          {
            id: `f1-${dbCat}`,
            category: dbCat,
            question_text: `How long have you been experiencing this ${dbCat.toLowerCase()}-related challenge?`,
            question_type: "choice",
            options: ["Less than a month", "1 to 6 months", "Over 6 months", "It has been years"]
          },
          {
            id: `f2-${dbCat}`,
            category: dbCat,
            question_text: `On a scale of 1-10, how severely does this block your daily peace?`,
            question_type: "choice",
            options: ["Mild (1-3)", "Moderate (4-6)", "Severe (7-8)", "Overwhelming (9-10)"]
          },
          {
            id: `f3-${dbCat}`,
            category: dbCat,
            question_text: `What primary release mechanism is your soul seeking right now?`,
            question_type: "choice",
            options: ["Deep acoustic sound vibrations", "Somatic crystal energy alignment", "Gentle counselor conversations", "Just a space to let go and breathe"]
          }
        ];
        setCurrentQuestions(fallbacks);
      }
    } catch (err) {
      console.error("Error fetching questions:", err);
    }
  };

  // Handle Search Submission
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setSearchError(true);
      setTimeout(() => setSearchError(false), 1200);
      return;
    }

    const q = searchQuery.toLowerCase();
    let category = "Stress"; // fallback

    if (q.includes("anxi") || q.includes("worry") || q.includes("fear") || q.includes("panic") || q.includes("social")) {
      category = "Anxiety";
    } else if (q.includes("stress") || q.includes("fatigue") || q.includes("tired") || q.includes("burnout") || q.includes("work") || q.includes("job")) {
      category = "Stress";
    } else if (q.includes("loss") || q.includes("grief") || q.includes("sad") || q.includes("depress") || q.includes("lonely") || q.includes("death")) {
      category = "Loss";
    } else if (q.includes("health") || q.includes("pain") || q.includes("body") || q.includes("back") || q.includes("sick") || q.includes("physic")) {
      category = "Health";
    }

    startQuiz(category);
  };

  const handleAnswerSelect = (answerText: string) => {
    const currentQuestion = currentQuestions[currentQuestionIndex];
    const updatedAnswers = {
      ...answers,
      [currentQuestion.id]: answerText
    };
    setAnswers(updatedAnswers);

    if (currentQuestionIndex < currentQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // Quiz complete, transition to profile capture
      triggerStepTransition(3);
    }
  };

  // Calculate Chakra scores dynamically based on the category
  const generateChakraScores = (cat: string) => {
    const dbCat = getDbCategory(cat);
    const base = {
      Root: 70 + Math.floor(Math.random() * 20),
      Sacral: 70 + Math.floor(Math.random() * 20),
      Solar: 70 + Math.floor(Math.random() * 20),
      Heart: 70 + Math.floor(Math.random() * 20),
      Throat: 70 + Math.floor(Math.random() * 20),
      ThirdEye: 70 + Math.floor(Math.random() * 20),
      Crown: 70 + Math.floor(Math.random() * 20)
    };

    if (dbCat === "Anxiety") {
      base.Root = 30 + Math.floor(Math.random() * 15); // Root (grounding) is severely blocked
      base.Solar = 45 + Math.floor(Math.random() * 20); // Solar Plexus (fear/confidence) is affected
    } else if (dbCat === "Stress") {
      base.Solar = 25 + Math.floor(Math.random() * 20); // Stress blocks Solar Plexus
      base.Heart = 40 + Math.floor(Math.random() * 20); // Drains emotional resilience
    } else if (dbCat === "Loss") {
      base.Heart = 30 + Math.floor(Math.random() * 15); // Grief directly impacts Heart chakra
      base.Crown = 50 + Math.floor(Math.random() * 20); // Disconnects Crown
    } else if (dbCat === "Health") {
      base.Root = 35 + Math.floor(Math.random() * 15); // Health directly drains Root (physicality)
      base.Sacral = 40 + Math.floor(Math.random() * 20); // Drains Sacral (vitality)
    }

    return base;
  };

  const validateProfileForm = () => {
    const errors: Record<string, string> = {};
    if (!profileForm.name.trim()) {
      errors.name = "Full Name is required";
    } else if (profileForm.name.trim().length < 2) {
      errors.name = "Full Name must be at least 2 characters";
    } else if (!/^[A-Za-z\s]+$/.test(profileForm.name)) {
      errors.name = "Full Name must contain only letters and spaces";
    }

    const emailPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    if (!profileForm.email.trim()) {
      errors.email = "Email Address is required";
    } else if (!emailPattern.test(profileForm.email)) {
      errors.email = "Please enter a valid email address";
    }

    const digitsOnly = profileForm.phone.replace(/\D/g, "");
    if (!profileForm.phone.trim()) {
      errors.phone = "Phone/WhatsApp is required";
    } else if (digitsOnly.length < 10) {
      errors.phone = "Please enter a valid phone number with at least 10 digits";
    }

    if (!profileForm.dob) {
      errors.dob = "Date of Birth is required";
    } else {
      const dobDate = new Date(profileForm.dob);
      const today = new Date();
      if (dobDate > today) {
        errors.dob = "Date of Birth cannot be in the future";
      } else if (today.getFullYear() - dobDate.getFullYear() > 120) {
        errors.dob = "Please enter a valid date of birth";
      }
    }

    setProfileErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateProfileForm()) return;
    setSubmittingProfile(true);

    const answersPayload = currentQuestions.map((q) => ({
      question_id: q.id,
      question_text: q.question_text,
      answer_text: answers[q.id] || "No Answer"
    }));

    const payload = {
      ...profileForm,
      category: selectedCategory,
      answers: answersPayload
    };

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const json = await res.json();

      if (json.success) {
        setSubmittedProfileId(json.data.id);
        window.localStorage.setItem("divingsanatan_user_profile", JSON.stringify(profileForm));
        setHasSavedProfile(true);
        setChakraScores(generateChakraScores(selectedCategory));
        triggerStepTransition(4);
        if (json.updated) {
          console.info("Existing profile updated for this email — no duplicate created.");
        }
      } else {
        alert("Submission failed: " + json.error);
      }
    } catch (err) {
      console.error("Error submitting profile:", err);
    } finally {
      setSubmittingProfile(false);
    }
  };

  // Reset to initial screen
  const restartFlow = () => {
    triggerStepTransition(1);
    setSearchQuery("");
    setProfileForm({
      name: "",
      email: "",
      phone: "",
      gender: "Female",
      dob: ""
    });
  };

  // Match recommended therapies based on their selected category
  const getRecommendedServices = () => {
    const cat = getDbCategory(selectedCategory).toLowerCase();
    return services.filter((s) => {
      const name = s.name.toLowerCase();
      const desc = s.description.toLowerCase();

      if (cat === "anxiety") {
        return name.includes("anxiety") || name.includes("meditation") || desc.includes("anxiety") || name.includes("aura");
      } else if (cat === "stress") {
        return name.includes("chakra") || name.includes("balancing") || name.includes("stress") || desc.includes("fatigue");
      } else if (cat === "loss") {
        return name.includes("counseling") || name.includes("meditation") || desc.includes("grief") || desc.includes("child");
      } else if (cat === "health") {
        return name.includes("crystal") || name.includes("clearing") || desc.includes("pain") || desc.includes("somatic");
      }
      return true;
    }).slice(0, 2);
  };

  const getOptionsArray = (question: any): string[] => {
    if (!question || !question.options) return [];
    if (Array.isArray(question.options)) return question.options;
    if (typeof question.options === "string") {
      try {
        const parsed = JSON.parse(question.options);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {
        return question.options.split(",").map((s: string) => s.trim()).filter(Boolean);
      }
    }
    return [];
  };

  const currentQuestion = currentQuestions[currentQuestionIndex];

  return (
    <div className={`homepage-wrapper step-${activeStep} ${activeStep === 4 ? 'step-report-active' : ''}`}>
      <Header />

      {activeStep > 1 && (
        <button className="back-step-btn" onClick={handleBackStep}>
          ← Back
        </button>
      )}

      {/* Floating Vertical Stepper Progress Indicator */}
      {activeStep > 1 && (
        <div className="floating-vertical-stepper">
          <button
            className={`stepper-node ${activeStep === 1 ? 'active' : ''} ${activeStep > 1 ? 'completed' : ''}`}
            onClick={() => triggerStepTransition(1)}
          >
            <span className="node-dot"></span>
            <span className="node-label">1. Seek Guidance</span>
          </button>
          <button
            className={`stepper-node ${activeStep === 2 ? 'active' : ''} ${activeStep > 2 ? 'completed' : ''}`}
            onClick={() => activeStep >= 2 && triggerStepTransition(2)}
            disabled={activeStep < 2}
          >
            <span className="node-dot"></span>
            <span className="node-label">2. Somatic Quiz</span>
          </button>
          <button
            className={`stepper-node ${activeStep === 3 ? 'active' : ''} ${activeStep > 3 ? 'completed' : ''}`}
            onClick={() => activeStep >= 3 && triggerStepTransition(3)}
            disabled={activeStep < 3}
          >
            <span className="node-dot"></span>
            <span className="node-label">3. Energy Mapping</span>
          </button>
          <button
            className={`stepper-node ${activeStep === 4 ? 'active' : ''} ${activeStep > 4 ? 'completed' : ''}`}
            onClick={() => activeStep >= 4 && triggerStepTransition(4)}
            disabled={activeStep < 4}
          >
            <span className="node-dot"></span>
            <span className="node-label">4. Report & Consult</span>
          </button>
        </div>
      )}



      <div className="slider-container">
        <div
          ref={sliderRef}
          className="steps-slider steps-slider-offset"
        >

          {/* 1. Landing Viewport (Redesigned Light Wellness Layout) */}
          <section id="section-landing" className="viewport-section landing-view">
            <div className="hero-banner">
              <div className="hero-content">
                <h1 className="hero-title">
                  <span className="hero-title-sub">You don't have to carry it all alone.</span>
                  <span className="hero-title-main">
                    There is <span className="accent-text">light</span>, even in the <span className="accent-text">dark</span>.
                  </span>
                </h1>

                <div className="hero-divider">
                  <div className="divider-line"></div>
                  <svg className="divider-diamond" width="8" height="8" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2 L22 12 L12 22 L2 12 Z" />
                  </svg>
                  <div className="divider-line"></div>
                </div>

                <p className="hero-subtitle">
                  Share what's on your mind, and we'll guide you to the right healing, insights and support.
                </p>

                {/* Search Bar Form */}
                <form onSubmit={handleSearchSubmit} className="search-bar-form">
                  <div className={`search-input-wrapper ${searchError ? "shake-input-error" : ""}`}>
                    <Search className="search-icon" size={22} />
                    <div className="search-input-main-container">
                      <input
                        type="text"
                        placeholder={searchError ? "Please type something first..." : "What is stealing your peace right now?"}
                        className="search-input"
                        value={searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value);
                          if (e.target.value.trim()) setSearchError(false);
                        }}
                      />
                      <span className="search-input-suggestion">
                        Try: anxiety, relationship, self doubt, financial stress...
                      </span>
                    </div>
                    <button type="submit" className="search-submit-btn">
                      <span>Find Guidance</span>
                      <ArrowRight size={18} />
                    </button>
                  </div>
                </form>

                {/* Grid of 8 options */}
                <div className="landing-grid">
                  <button type="button" className="grid-item-card" onClick={() => startQuiz("Anxiety & Overthinking")}>
                    <div className="grid-item-icon">
                      <Brain size={24} strokeWidth={1.5} />
                    </div>
                    <span className="grid-item-text">Anxiety & Overthinking</span>
                  </button>

                  <button type="button" className="grid-item-card" onClick={() => startQuiz("Relationship Pain")}>
                    <div className="grid-item-icon">
                      <Heart size={24} strokeWidth={1.5} />
                    </div>
                    <span className="grid-item-text">Relationship Pain</span>
                  </button>

                  <button type="button" className="grid-item-card" onClick={() => startQuiz("Financial Stress")}>
                    <div className="grid-item-icon">
                      <DollarSign size={24} strokeWidth={1.5} />
                    </div>
                    <span className="grid-item-text">Financial Stress</span>
                  </button>

                  <button type="button" className="grid-item-card" onClick={() => startQuiz("Life Direction")}>
                    <div className="grid-item-icon">
                      <Compass size={24} strokeWidth={1.5} />
                    </div>
                    <span className="grid-item-text">Life Direction</span>
                  </button>

                  <button type="button" className="grid-item-card" onClick={() => startQuiz("Family Conflict")}>
                    <div className="grid-item-icon">
                      <Users size={24} strokeWidth={1.5} />
                    </div>
                    <span className="grid-item-text">Family Conflict</span>
                  </button>

                  <button type="button" className="grid-item-card" onClick={() => startQuiz("Self Love & Confidence")}>
                    <div className="grid-item-icon">
                      <User size={24} strokeWidth={1.5} />
                    </div>
                    <span className="grid-item-text">Self Love & Confidence</span>
                  </button>

                  <button type="button" className="grid-item-card" onClick={() => startQuiz("Spiritual Crisis")}>
                    <div className="grid-item-icon">
                      <Sparkles size={24} strokeWidth={1.5} />
                    </div>
                    <span className="grid-item-text">Spiritual Crisis</span>
                  </button>

                  <button type="button" className="grid-item-card" onClick={() => router.push("/search")}>
                    <div className="grid-item-icon">
                      <Grid size={24} strokeWidth={1.5} />
                    </div>
                    <span className="grid-item-text">View All</span>
                  </button>
                </div>

                {/* Bottom Callout Section */}
                <div className="bottom-callout-section">
                  <div className="bottom-callout-text-small">Not sure where to start?</div>
                  <div className="bottom-callout-text-large">Let's take the first step together.</div>

                  {/* Highlights Row */}
                  <div className="landing-highlights-grid">
                    <div className="highlight-item">
                      <div className="highlight-icon-wrapper">
                        <Shield className="highlight-icon" size={20} strokeWidth={1.5} />
                      </div>
                      <div className="highlight-text-wrapper">
                        <span className="highlight-title">Confidential & Safe</span>
                        <span className="highlight-desc">Your journey is private and protected.</span>
                      </div>
                    </div>

                    <div className="highlight-item">
                      <div className="highlight-icon-wrapper">
                        <Flower className="highlight-icon" size={20} strokeWidth={1.5} />
                      </div>
                      <div className="highlight-text-wrapper">
                        <span className="highlight-title">Expert Guidance</span>
                        <span className="highlight-desc">Connect with experienced healers & experts.</span>
                      </div>
                    </div>

                    <div className="highlight-item">
                      <div className="highlight-icon-wrapper">
                        <Sparkles className="highlight-icon" size={20} strokeWidth={1.5} />
                      </div>
                      <div className="highlight-text-wrapper">
                        <span className="highlight-title">Holistic Healing</span>
                        <span className="highlight-desc">Mind, body, soul - we heal it all.</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 2. Quiz Viewport */}
          <section id="section-quiz" className="viewport-section quiz-view">
            <div className="section-container">
              {activeStep === 2 && currentQuestions.length > 0 && currentQuestion && (
                <div className="quiz-card glass-panel">
                  <div className="quiz-header">
                    <span className="category-tag-header">{selectedCategory} Query</span>
                    <span className="progress-label">
                      Question {currentQuestionIndex + 1} of {currentQuestions.length}
                    </span>
                  </div>

                  <div className="progress-bar-container">
                    <div
                      ref={progressBarRef}
                      className="progress-bar-fill progress-var-fill"
                    />
                  </div>

                  <h2 className="quiz-question-text">{currentQuestion.question_text}</h2>

                  {currentQuestion.question_type === "choice" ? (
                    <div className="quiz-options">
                      {getOptionsArray(currentQuestion).map((option: string, idx: number) => (
                        <button
                          key={idx}
                          className={`quiz-option-btn quiz-option-delay-${idx % 12}`}
                          onClick={() => handleAnswerSelect(option)}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="quiz-text-input-container">
                      <textarea
                        rows={4}
                        placeholder="Describe your feelings..."
                        className={`form-control-text ${quizTextError ? "input-border-error" : ""}`}
                        value={quizTextVal}
                        onChange={(e) => {
                          setQuizTextVal(e.target.value);
                          if (e.target.value.trim()) setQuizTextError(false);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            if (quizTextVal.trim()) {
                              handleAnswerSelect(quizTextVal);
                              setQuizTextVal("");
                              setQuizTextError(false);
                            } else {
                              setQuizTextError(true);
                            }
                          }
                        }}
                      />
                      {quizTextError && <span className="inline-error-msg">Please write a response before continuing.</span>}
                      <div className="input-actions">
                        <button
                          className="input-submit-btn"
                          onClick={() => {
                            if (quizTextVal.trim()) {
                              handleAnswerSelect(quizTextVal);
                              setQuizTextVal("");
                              setQuizTextError(false);
                            } else {
                              setQuizTextError(true);
                            }
                          }}
                        >
                          Continue ➔
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>

          {/* 3. Profile Form Viewport (Data Capture Gate) */}
          <section id="section-profile" className="viewport-section profile-view">
            <div className="section-container">
              {activeStep === 3 && (
                <Card variant="glass" className="profile-capture-card glass-panel">
                  <h2 className="profile-title gold-text-gradient">Personalize Your Soul Report</h2>
                  <p className="profile-subtitle">We need a few details to build your customized energy profile</p>

                  {hasSavedProfile && (
                    <div className="saved-profile-notice">
                      <span>✨ Details pre-filled from your saved wellness profile</span>
                    </div>
                  )}

                  <form onSubmit={handleProfileSubmit} noValidate className="profile-form">
                    <div className="form-group-row">
                      <div className="form-group">
                        <label>Full Name</label>
                        <input
                          type="text"
                          placeholder="e.g. Jane Doe"
                          value={profileForm.name}
                          onChange={(e) => {
                            setProfileForm({ ...profileForm, name: e.target.value });
                            if (profileErrors.name) setProfileErrors({ ...profileErrors, name: "" });
                          }}
                          className={`profile-input ${profileErrors.name ? "input-border-error" : ""}`}
                        />
                        {profileErrors.name && <span className="inline-error-msg">{profileErrors.name}</span>}
                      </div>

                      <div className="form-group">
                        <label>Email Address</label>
                        <input
                          type="email"
                          placeholder="e.g. jane@example.com"
                          value={profileForm.email}
                          onChange={(e) => {
                            setProfileForm({ ...profileForm, email: e.target.value });
                            if (profileErrors.email) setProfileErrors({ ...profileErrors, email: "" });
                          }}
                          className={`profile-input ${profileErrors.email ? "input-border-error" : ""}`}
                        />
                        {profileErrors.email && <span className="inline-error-msg">{profileErrors.email}</span>}
                      </div>
                    </div>

                    <div className="form-group-row">
                      <div className="form-group">
                        <label>WhatsApp / Mobile</label>
                        <input
                          type="tel"
                          placeholder="e.g. +91 98765 43210"
                          value={profileForm.phone}
                          onChange={(e) => {
                            setProfileForm({ ...profileForm, phone: e.target.value });
                            if (profileErrors.phone) setProfileErrors({ ...profileErrors, phone: "" });
                          }}
                          className={`profile-input ${profileErrors.phone ? "input-border-error" : ""}`}
                        />
                        {profileErrors.phone && <span className="inline-error-msg">{profileErrors.phone}</span>}
                      </div>

                      <div className="form-group">
                        <label>Gender</label>
                        <select
                          value={profileForm.gender}
                          onChange={(e) => setProfileForm({ ...profileForm, gender: e.target.value })}
                          className="profile-input"
                        >
                          <option value="Female">Female</option>
                          <option value="Male">Male</option>
                          <option value="Non-Binary">Non-Binary</option>
                          <option value="Prefer not to say">Prefer not to say</option>
                        </select>
                      </div>
                    </div>

                    <div className="form-group">
                      <label>Date of Birth</label>
                      <input
                        type="date"
                        value={profileForm.dob}
                        onChange={(e) => {
                          setProfileForm({ ...profileForm, dob: e.target.value });
                          if (profileErrors.dob) setProfileErrors({ ...profileErrors, dob: "" });
                        }}
                        className={`profile-input ${profileErrors.dob ? "input-border-error" : ""}`}
                      />
                      {profileErrors.dob && <span className="inline-error-msg">{profileErrors.dob}</span>}
                    </div>

                    <Button
                      type="submit"
                      variant="gold"
                      size="lg"
                      className="soul-report-btn"
                      disabled={submittingProfile}
                    >
                      {submittingProfile ? "✨ Analyzing Resonance..." : "🔮 Generate Soul Report"}
                    </Button>
                  </form>
                </Card>
              )}
            </div>
          </section>

          {/* 4. Soul Report Viewport */}
          <section id="section-report" className="viewport-section report-view">
            <div className="section-container select-report-layout">
              {activeStep === 4 && (
                <div className="report-layout">
                  {/* Top part: Two Column Layout */}
                  <div className="report-columns-grid">

                    {/* Left Column: Visual Chakras (Scanner) */}
                    <div className="report-left-column glass-panel">
                      <h3 className="visualizer-heading">Somatic Scanner</h3>
                      <div className="chakra-interactive-visualizer">

                        {/* SVG spinal channel with glowing nodes */}
                        <div className="spinal-svg-wrapper spinal-svg-tall">
                          <svg className="spinal-channel spinal-channel-visible" width="80" height="460" viewBox="0 0 80 460">
                            <line x1="40" y1="20" x2="40" y2="440" stroke="rgba(168, 85, 247, 0.15)" strokeWidth="6" strokeDasharray="8 6" />

                            <circle cx="40" cy="40" r="18" className="scanner-chakra scanner-chakra-crown" />
                            <circle cx="40" cy="100" r="18" className="scanner-chakra scanner-chakra-thirdeye" />
                            <circle cx="40" cy="160" r="18" className="scanner-chakra scanner-chakra-throat" />
                            <circle cx="40" cy="220" r="18" className="scanner-chakra scanner-chakra-heart" />
                            <circle cx="40" cy="280" r="18" className="scanner-chakra scanner-chakra-solar" />
                            <circle cx="40" cy="340" r="18" className="scanner-chakra scanner-chakra-sacral" />
                            <circle cx="40" cy="400" r="18" className="scanner-chakra scanner-chakra-root" />

                            {/* Scanner Line */}
                            <line x1="5" y1="20" x2="75" y2="20" stroke="#db2777" strokeWidth="3" className="scanner-line scanner-line-glow" />
                          </svg>
                        </div>
                      </div>

                      <div className="scanner-status">
                        <span className="scanning-dot"></span>
                        Analyzing Somatic Resonances...
                      </div>
                    </div>

                    {/* Right Column: In Progress Details */}
                    <div className="report-right-column glass-panel">
                      <div className="report-header">
                        <span className="report-status-badge report-status-in-progress">Preparation in Progress</span>
                        <h2 className="report-title gold-text-gradient">Your Custom Soul Report</h2>
                        <p className="report-owner">Prepared for <strong>{profileForm.name}</strong> • Focus Category: <strong>{selectedCategory}</strong></p>
                      </div>

                      <div className="soul-report-summary">
                        <p className="report-paragraph">
                          Thank you for completing your Somatic Alignment check. Your responses have been submitted to our wellness practitioners.
                        </p>
                        <p className="report-paragraph">
                          Instead of generating a generic, automated template, our certified energy healers are manually analyzing your specific answers, mapping your chakra flow, and constructing a customized spiritual alignment plan.
                        </p>
                        <p className="report-paragraph">
                          Your completed report will be sent to your email (<strong>{profileForm.email}</strong>) within 24 hours.
                        </p>
                      </div>

                      <div className="alignment-step-card">
                        <h4 className="alignment-step-label">Next Alignment Step</h4>
                        <h3 className="alignment-step-title">Book a Free 15-Minute Diagnostic Session</h3>
                        <p className="alignment-step-desc">
                          Schedule a live video call with Dr. Elara Vance to scan your auric fields and map blockages.
                        </p>
                        <Button variant="gold" onClick={() => router.push("/booking?service=srv-free")} className="book-free-session-btn">
                          🔮 Book Free Energy Session
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Section: Paid related sessions */}
                  <div className="report-bottom-section glass-panel">
                    <div className="bottom-section-header">
                      <h3 className="bottom-section-title">Explore Custom Somatic Therapies</h3>
                      <p className="bottom-section-subtitle">Below are the recommended paid sessions to target somatic blocks in your {selectedCategory} category.</p>
                    </div>

                    <div className="booking-options-grid booking-options-stacked">
                      <div className="therapies-recommendation-card therapies-card-full">
                        <div className="recommended-services-grid-layout recommended-grid-auto">
                          {getRecommendedServices().map((srv) => (
                            <Card key={srv.id} className="recommend-service-card" variant="glowing">
                              <div className="card-top-row">
                                <span className="card-badge">{srv.category}</span>
                                <span className="card-price">{formatCurrency(srv.price)}</span>
                              </div>
                              <h4 className="recommend-card-title">{srv.name}</h4>
                              <p className="recommend-card-desc">{srv.description}</p>
                              <Button
                                variant="gold-outline"
                                onClick={() => router.push(`/booking?service=${srv.id}`)}

                              >
                                Book This Session
                              </Button>
                            </Card>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* FAQ Modal (Homepage sidebar button trigger) */}
          {faqOpen && (
            <div className="faq-modal-overlay" onClick={() => setFaqOpen(false)}>
              <div className="faq-modal-card glass-panel" onClick={(e) => e.stopPropagation()}>
                <button className="faq-close-btn" onClick={() => setFaqOpen(false)}>
                  &times;
                </button>
                <h2 className="faq-modal-title gold-text-gradient">Frequently Asked Questions</h2>
                <div className="faq-list">
                  <div className="faq-item">
                    <h3>What is Diving Sanatan?</h3>
                    <p>Diving Sanatan is a premium wellness portal offering certified energy alignment, chakra clearing, and meditation sessions to synchronize physical and mental states.</p>
                  </div>
                  <div className="faq-item">
                    <h3>How do I book a session?</h3>
                    <p>Simply use our search bar to find a therapy aligned with your feelings, select a service, and book an appointment with our expert practitioners.</p>
                  </div>
                  <div className="faq-item">
                    <h3>Are sessions online or in-person?</h3>
                    <p>We provide both virtual high-fidelity guided sessions and in-person energy alignment, depending on the service selected.</p>
                  </div>
                  <div className="faq-item">
                    <h3>What is the cancellation policy?</h3>
                    <p>Appointments can be rescheduled or cancelled up to 24 hours in advance via the customer profile or by contacting support.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Close steps-slider and slider-container */}
        </div>
      </div>

      <style jsx>{`
        #section-landing {
          background: linear-gradient(to bottom, rgba(255, 255, 255, 0) 40%, rgba(255, 255, 255, 0.8) 75%, #ffffff 95%), url('/images/meditation_bg.png') no-repeat center right;
          background-size: cover;
          color: #2e1065;
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
          align-items: center;
          position: relative;
          padding-top: 45px;
          padding-bottom: 50px;
          width: 100%;
          min-height: calc(100vh - 70px);
          overflow-y: auto;
        }
        #section-landing::-webkit-scrollbar {
          width: 6px;
        }
        #section-landing::-webkit-scrollbar-track {
          background: transparent;
        }
        #section-landing::-webkit-scrollbar-thumb {
          background: rgba(124, 58, 237, 0.15);
          border-radius: 99px;
        }
        #section-landing::-webkit-scrollbar-thumb:hover {
          background: rgba(124, 58, 237, 0.3);
        }
        #section-landing .hero-banner {
          width: 100%;
          height: auto;
          padding: 12px 24px;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        #section-landing .hero-content {
          max-width: 1050px;
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
        }
        #section-landing .hero-title {
          margin-bottom: 8px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        #section-landing .hero-title-sub {
          font-family: var(--font-serif);
          font-size: 2.1rem;
          color: #4b1a8a;
          font-weight: 500;
          margin-bottom: 6px;
          display: block;
          letter-spacing: -0.02em;
        }
        #section-landing .hero-title-main {
          font-family: var(--font-serif);
          font-size: 3.4rem;
          color: #2e1065;
          font-weight: 600;
          display: block;
          letter-spacing: -0.02em;
        }
        #section-landing .accent-text {
          background: linear-gradient(135deg, #db2777 0%, #7c3aed 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          color: transparent;
          font-weight: 600;
        }
        #section-landing .hero-divider {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 16px;
          width: 100%;
          max-width: 320px;
          margin: 8px 0 16px;
        }
        #section-landing .divider-line {
          flex: 1;
          height: 1px;
          background: linear-gradient(to right, transparent, rgba(124, 58, 237, 0.3), transparent);
        }
        #section-landing .divider-diamond {
          color: #db2777;
          opacity: 0.6;
        }
        #section-landing .hero-subtitle {
          font-size: 1.1rem;
          color: #4b5563;
          margin-bottom: 24px;
          text-align: center;
          font-weight: 400;
          max-width: 600px;
        }
        #section-landing .landing-grid {
          display: grid;
          grid-template-columns: repeat(8, 1fr);
          gap: 16px;
          width: 100%;
          margin-bottom: 24px;
          margin-top: 12px;
        }
        #section-landing .grid-item-card {
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(124, 58, 237, 0.1);
          border-radius: 24px;
          padding: 24px 12px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          color: #1e1b4b;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          outline: none;
          box-shadow: 0 4px 20px rgba(124, 58, 237, 0.02);
          min-height: 130px;
        }
        #section-landing .grid-item-card:hover {
          background: #ffffff;
          border-color: rgba(124, 58, 237, 0.5);
          box-shadow: 0 10px 25px rgba(124, 58, 237, 0.08);
          transform: translateY(-3px);
        }
        #section-landing .grid-item-icon {
          color: #7c3aed;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.3s;
        }
        #section-landing .grid-item-card:hover .grid-item-icon {
          transform: scale(1.1) rotate(2deg);
        }
        #section-landing .grid-item-text {
          font-size: 0.82rem;
          font-weight: 500;
          text-align: center;
          font-family: var(--font-sans);
          color: #374151;
          line-height: 1.3;
        }

        /* Search Input */
        #section-landing .search-bar-form {
          width: 100%;
          max-width: 820px;
          margin-bottom: 24px;
        }
        #section-landing .search-input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
          width: 100%;
          background: #ffffff;
          border: 1px solid rgba(124, 58, 237, 0.2);
          border-radius: 99px;
          padding: 10px 10px 10px 28px;
          box-shadow: 0 8px 30px rgba(124, 58, 237, 0.05);
          transition: var(--transition-smooth);
        }
        #section-landing .search-input-wrapper:focus-within {
          border-color: #7c3aed;
          box-shadow: 0 12px 40px rgba(124, 58, 237, 0.12);
        }
        #section-landing .search-icon {
          color: #6b7280;
          margin-right: 14px;
          flex-shrink: 0;
        }
        #section-landing .search-input-main-container {
          display: flex;
          flex-direction: column;
          flex: 1;
          justify-content: center;
          padding: 4px 0;
          min-width: 0;
        }
        #section-landing .search-input-suggestion {
          font-family: var(--font-sans);
          font-size: 0.85rem;
          color: #6b7280;
          margin-top: 4px;
          text-align: left;
          pointer-events: none;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        #section-landing .search-input {
          width: 100%;
          background: transparent;
          border: none;
          outline: none;
          color: #1f2937;
          font-size: 1.15rem;
          font-family: var(--font-sans);
          padding: 0;
        }
        #section-landing .search-input::placeholder {
          color: #9ca3af;
        }
        #section-landing .search-submit-btn {
          background: linear-gradient(135deg, #e11d48 0%, #7c3aed 100%);
          color: #ffffff;
          border: none;
          outline: none;
          padding: 14px 36px;
          border-radius: 99px;
          font-size: 1.05rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          transition: var(--transition-fast);
          box-shadow: 0 4px 14px rgba(124, 58, 237, 0.2);
        }
        #section-landing .search-submit-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(124, 58, 237, 0.35);
        }

        /* Bottom Callout Section */
        .bottom-callout-section {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          margin-top: 32px;
          gap: 12px;
          width: 100%;
        }
        .bottom-callout-text-small {
          font-size: 1.25rem;
          color: #6d28d9;
          font-family: var(--font-serif);
          font-style: italic;
          font-weight: 500;
        }
        .bottom-callout-text-large {
          font-size: 1.95rem;
          color: #1e1b4b;
          font-family: var(--font-serif);
          font-weight: 600;
          margin-bottom: 12px;
        }

        /* Landing Highlights Grid */
        .landing-highlights-grid {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 32px;
          margin-top: 16px;
          width: 100%;
          max-width: 960px;
        }
        .highlight-item {
          display: flex;
          align-items: center;
          gap: 16px;
          flex: 1;
          background: rgba(255, 255, 255, 0.5);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(124, 58, 237, 0.08);
          padding: 16px 20px;
          border-radius: 20px;
          text-align: left;
          box-shadow: 0 4px 20px rgba(124, 58, 237, 0.02);
        }
        .highlight-icon-wrapper {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: rgba(124, 58, 237, 0.08);
          color: #7c3aed;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .highlight-icon {
          color: #7c3aed;
        }
        .highlight-text-wrapper {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .highlight-title {
          font-family: var(--font-sans);
          font-size: 0.95rem;
          font-weight: 700;
          color: #1e1b4b;
        }
        .highlight-desc {
          font-family: var(--font-sans);
          font-size: 0.8rem;
          color: #6b7280;
          line-height: 1.3;
        }
        @media (max-width: 768px) {
          .landing-highlights-grid {
            flex-direction: column;
            gap: 16px;
          }
          .highlight-item {
            width: 100%;
            max-width: 340px;
          }
        }

        @media (max-width: 1024px) {
          #section-landing .landing-grid {
            grid-template-columns: repeat(4, 1fr) !important;
          }
        }

        @media (max-width: 768px) {
          #section-landing {
            padding-top: 20px;
            padding-bottom: 40px;
            background-position: center;
          }
          #section-landing .hero-title-sub {
            font-size: 1.5rem !important;
          }
          #section-landing .hero-title-main {
            font-size: 2.2rem !important;
          }
          #section-landing .hero-subtitle {
            font-size: 0.95rem !important;
            margin-bottom: 24px !important;
          }
          #section-landing .landing-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 12px !important;
          }
          #section-landing .grid-item-card {
            padding: 16px 10px !important;
            border-radius: 20px !important;
          }
          .bottom-callout-text-small {
            font-size: 1.05rem !important;
          }
          .bottom-callout-text-large {
            font-size: 1.45rem !important;
          }
        }

        /* Dynamic shake animation for input error */
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-6px); }
          40%, 80% { transform: translateX(6px); }
        }
        .shake-input-error {
          animation: shake 0.4s ease-in-out;
          border-color: #ef4444 !important;
          box-shadow: 0 0 15px rgba(239, 68, 68, 0.25) !important;
        }

        .input-border-error {
          border-color: #ef4444 !important;
          box-shadow: 0 0 10px rgba(239, 68, 68, 0.15) !important;
        }

        .inline-error-msg {
          color: #ef4444;
          font-size: 0.75rem;
          margin-top: 4px;
          font-weight: 600;
          text-align: left;
          display: block;
        }

        .saved-profile-notice {
          background: rgba(16, 185, 129, 0.08);
          border: 1px solid rgba(16, 185, 129, 0.2);
          color: #065f46;
          padding: 12px;
          border-radius: 14px;
          font-size: 0.85rem;
          font-weight: 700;
          margin-bottom: 16px;
          text-align: center;
          animation: fadeSlideIn 0.3s ease-out;
        }

        @keyframes scan {
          0% { transform: translateY(0); opacity: 0.3; }
          50% { transform: translateY(380px); opacity: 1; }
          100% { transform: translateY(0); opacity: 0.3; }
        }
        .scanner-line {
          animation: scan 4s linear infinite;
        }
        @keyframes pulse-dot {
          0% { transform: scale(0.9); opacity: 0.5; }
          50% { transform: scale(1.1); opacity: 1; }
          100% { transform: scale(0.9); opacity: 0.5; }
        }
        .scanning-dot {
          animation: pulse-dot 1.5s ease-in-out infinite;
          display: inline-block;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #a855f7;
        }

        .scanner-status {
          margin-top: 24px;
          color: hsl(var(--text-muted));
          font-size: 0.85rem;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .spinal-svg-tall {
          position: relative;
          height: 460px;
        }

        .spinal-channel-visible {
          overflow: visible;
        }

        .scanner-chakra {
          stroke-width: 2;
        }

        .scanner-chakra-crown { fill: rgba(168, 85, 247, 0.2); stroke: #a855f7; }
        .scanner-chakra-thirdeye { fill: rgba(99, 102, 241, 0.2); stroke: #6366f1; }
        .scanner-chakra-throat { fill: rgba(56, 189, 248, 0.2); stroke: #38bdf8; }
        .scanner-chakra-heart { fill: rgba(34, 197, 94, 0.2); stroke: #22c55e; }
        .scanner-chakra-solar { fill: rgba(234, 179, 8, 0.2); stroke: #eab308; }
        .scanner-chakra-sacral { fill: rgba(249, 115, 22, 0.2); stroke: #f97316; }
        .scanner-chakra-root { fill: rgba(239, 68, 68, 0.2); stroke: #ef4444; }

        .scanner-line-glow {
          filter: drop-shadow(0 0 8px #db2777);
        }

        .report-status-in-progress {
          background: rgba(219, 39, 119, 0.1);
          border: 1px solid rgba(219, 39, 119, 0.2);
          color: #db2777;
        }

        .soul-report-summary {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .report-paragraph {
          line-height: 1.6;
          color: hsl(var(--text-cream));
          font-size: 0.95rem;
        }

        .alignment-step-card {
          margin-top: 12px;
          background: linear-gradient(135deg, rgba(168, 85, 247, 0.1) 0%, rgba(219, 39, 119, 0.1) 100%);
          border: 1px solid rgba(168, 85, 247, 0.2);
          border-radius: 16px;
          padding: 24px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }

        .alignment-step-label {
          color: #a855f7;
          font-weight: 700;
          margin: 0;
          text-transform: uppercase;
          font-size: 0.8rem;
          letter-spacing: 0.05em;
        }

        .alignment-step-title {
          color: hsl(var(--text-cream));
          font-size: 1.2rem;
          text-align: center;
          margin: 0;
          font-family: var(--font-serif);
        }

        .alignment-step-desc {
          color: hsl(var(--text-muted));
          font-size: 0.85rem;
          text-align: center;
          margin: 0 0 10px;
          line-height: 1.4;
        }

        .book-free-session-btn {
          width: 100%;
          padding: 14px 28px;
          font-size: 0.95rem;
          font-weight: 600;
          letter-spacing: 0.02em;
        }

        .booking-options-stacked {
          display: block;
        }

        .therapies-card-full {
          width: 100%;
        }

        .recommended-grid-auto {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 20px;
        }

        /* 4. Restructured Report View Layout */
        .report-layout {
          display: flex;
          flex-direction: column;
          gap: 40px;
          width: 100%;
          max-width: 1200px;
          margin: 0 auto;
        }
        
        .report-columns-grid {
          display: grid;
          grid-template-columns: 1fr 1.2fr;
          gap: 32px;
          width: 100%;
        }

        .report-left-column {
          padding: 40px;
          display: flex;
          flex-direction: column;
          gap: 24px;
          align-items: center;
        }

        .visualizer-heading {
          font-family: var(--font-serif);
          font-size: 1.5rem;
          color: #4c1d95;
          text-align: center;
          margin-bottom: 10px;
        }

        .chakra-interactive-visualizer {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 20px;
          width: 100%;
          padding: 10px 0;
        }

        .spinal-svg-wrapper {
          flex-shrink: 0;
          display: flex;
          justify-content: center;
        }

        .chakra-visualizer-labels {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          height: 500px;
          padding: 10px 0;
          flex: 1;
        }

        .visualizer-label-item {
          display: flex;
          align-items: center;
          gap: 12px;
          position: relative;
        }

        .dot-line {
          width: 30px;
          height: 1.5px;
          background: rgba(168, 85, 247, 0.25);
          display: inline-block;
          flex-shrink: 0;
        }

        .label-content {
          display: flex;
          flex-direction: column;
          line-height: 1.3;
        }

        .chakra-name-sanskrit {
          font-family: var(--font-serif);
          font-size: 0.95rem;
          font-weight: 700;
          color: #4c1d95;
        }

        .chakra-name-english {
          font-size: 0.72rem;
          color: hsl(var(--text-muted));
        }

        .chakra-score-val {
          font-size: 0.95rem;
          font-weight: 800;
          margin-top: 2px;
        }

        /* Specific text colors for labels based on chakra */
        .visualizer-label-item.crown .chakra-score-val { color: #c084fc; }
        .visualizer-label-item.thirdeye .chakra-score-val { color: #818cf8; }
        .visualizer-label-item.throat .chakra-score-val { color: #22d3ee; }
        .visualizer-label-item.heart .chakra-score-val { color: #4ade80; }
        .visualizer-label-item.solar .chakra-score-val { color: #facc15; }
        .visualizer-label-item.sacral .chakra-score-val { color: #fb923c; }
        .visualizer-label-item.root .chakra-score-val { color: #f87171; }

        .report-right-column {
          padding: 40px;
          display: flex;
          flex-direction: column;
          gap: 28px;
        }

        .report-header {
          display: flex;
          flex-direction: column;
          gap: 12px;
          border-bottom: 1.5px solid rgba(168, 85, 247, 0.1);
          padding-bottom: 20px;
        }

        .report-status-badge {
          background: rgba(16, 185, 129, 0.08);
          color: #059669;
          border: 1px solid rgba(16, 185, 129, 0.2);
          font-size: 0.75rem;
          font-weight: 700;
          padding: 4px 12px;
          border-radius: 6px;
          width: max-content;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .report-title {
          font-size: 2.2rem;
          line-height: 1.2;
        }

        .report-owner {
          font-size: 0.95rem;
          color: hsl(var(--text-muted));
        }

        .summary-heading, .analysis-heading {
          font-family: var(--font-serif);
          font-size: 1.15rem;
          color: #4c1d95;
          margin-bottom: 10px;
        }

        .soul-report-summary p {
          font-size: 0.98rem;
          line-height: 1.7;
          color: #334155;
        }

        .critical-points-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .critical-point-item {
          display: flex;
          gap: 16px;
          background: rgba(239, 68, 68, 0.03);
          border: 1px solid rgba(239, 68, 68, 0.15);
          padding: 16px;
          border-radius: 12px;
        }

        .critical-point-item.safe {
          background: rgba(16, 185, 129, 0.03);
          border-color: rgba(16, 185, 129, 0.15);
        }

        .status-marker {
          font-size: 0.7rem;
          font-weight: 700;
          text-transform: uppercase;
          background: rgba(239, 68, 68, 0.08);
          color: #b91c1c;
          border: 1px solid rgba(239, 68, 68, 0.2);
          padding: 3px 8px;
          border-radius: 6px;
          height: max-content;
          white-space: nowrap;
        }

        .status-marker.normal {
          background: rgba(16, 185, 129, 0.08);
          color: #065f46;
          border-color: rgba(16, 185, 129, 0.2);
        }

        .point-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .point-info strong {
          font-size: 0.92rem;
          color: #1e1b4b;
        }

        .point-info p {
          font-size: 0.8rem;
          line-height: 1.5;
        }

        .restart-btn {
          margin-top: auto;
          background: transparent;
          border: 1px solid rgba(0,0,0,0.08);
          color: hsl(var(--text-muted));
          padding: 12px 24px;
          border-radius: 12px;
          font-size: 0.88rem;
          font-weight: 600;
          cursor: pointer;
          transition: var(--transition-fast);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .restart-btn:hover {
          background: rgba(0,0,0,0.02);
          color: #7c3aed;
          border-color: rgba(168, 85, 247, 0.25);
        }

        /* Bottom booking section block styles */
        .report-bottom-section {
          padding: 40px;
          display: flex;
          flex-direction: column;
          gap: 28px;
          width: 100%;
        }

        .bottom-section-header {
          text-align: center;
          border-bottom: 1px solid rgba(0,0,0,0.05);
          padding-bottom: 16px;
        }

        .bottom-section-title {
          font-family: var(--font-serif);
          font-size: 1.8rem;
          color: #4c1d95;
          margin-bottom: 6px;
        }

        .bottom-section-subtitle {
          font-size: 0.95rem;
          color: hsl(var(--text-muted));
        }

        .booking-options-grid {
          display: grid;
          grid-template-columns: 1fr 1.6fr;
          gap: 32px;
          align-items: stretch;
        }

        .booking-options-grid .power-session-card {
          height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
          gap: 16px;
        }

        .consult-title {
          font-family: var(--font-serif);
          font-size: 1.4rem;
          color: #4c1d95;
        }

        .consult-desc {
          font-size: 0.9rem;
          line-height: 1.6;
          color: hsl(var(--text-muted));
        }

        .therapies-recommendation-card {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .recommend-services-title {
          font-family: var(--font-serif);
          font-size: 1.25rem;
          color: #4c1d95;
        }

        .recommended-services-grid-layout {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
        }

        .recommend-service-card {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 24px;
          height: 100%;
        }

        .card-top-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .card-badge {
          background: rgba(16, 185, 129, 0.08);
          border: 1px solid rgba(16, 185, 129, 0.2);
          color: #065f46;
          font-size: 0.72rem;
          font-weight: 700;
          padding: 3px 8px;
          border-radius: 4px;
          text-transform: uppercase;
        }

        .card-price {
          font-family: var(--font-serif);
          color: #db2777;
          font-weight: 700;
          font-size: 1.15rem;
        }

        .recommend-card-title {
          font-size: 1.15rem;
          color: #1e1b4b;
          margin-bottom: 6px;
        }

        .recommend-card-desc {
          font-size: 0.82rem;
          line-height: 1.5;
          margin-bottom: 12px;
          flex: 1;
        }

        /* Interactive pulse for visualizer nodes */
        @keyframes subtle-pulse {
          0% { transform: scale(1); opacity: 0.95; }
          50% { transform: scale(1.08); opacity: 1; filter: drop-shadow(0 0 10px rgba(168, 85, 247, 0.5)); }
          100% { transform: scale(1); opacity: 0.95; }
        }
        
        .node-pulse {
          transform-origin: center;
          animation: subtle-pulse 3s infinite ease-in-out;
        }

        .homepage-wrapper {
          display: flex;
          flex-direction: column;
          height: 100vh;
          overflow: hidden;
          position: relative;
          background: #ffffff;
        }
        .homepage-wrapper.step-report-active {
          height: auto;
          overflow: visible;
        }
        .homepage-wrapper.step-report-active .slider-container {
          overflow: visible;
        }
        .homepage-wrapper.step-report-active .steps-slider {
          height: auto;
          transform: none !important;
        }
        .homepage-wrapper.step-report-active .viewport-section {
          height: auto;
          overflow: visible;
        }
        .homepage-wrapper.step-report-active #section-landing,
        .homepage-wrapper.step-report-active #section-quiz,
        .homepage-wrapper.step-report-active #section-profile {
          display: none !important;
        }
        .homepage-wrapper.step-report-active #section-report {
          height: auto;
          min-height: 100vh;
        }



        /* Power Session Consultation Card Styling */
        .power-session-card {
          position: relative;
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(245, 243, 255, 0.95) 100%) !important;
          border: 2px solid rgba(168, 85, 247, 0.3) !important;
          border-radius: 24px !important;
          padding: 32px 24px 24px !important;
          box-shadow: 0 16px 40px rgba(124, 58, 237, 0.12), 0 0 30px rgba(168, 85, 247, 0.08) !important;
          overflow: hidden;
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1) !important;
        }
        .power-session-card:hover {
          transform: translateY(-4px);
          border-color: rgba(219, 39, 119, 0.5) !important;
          box-shadow: 0 20px 48px rgba(124, 58, 237, 0.18), 0 0 35px rgba(219, 39, 119, 0.12) !important;
        }
        .power-tag {
          position: absolute;
          top: 10px;
          right: -30px;
          background: linear-gradient(90deg, #db2777, #7c3aed);
          color: #ffffff;
          font-size: 0.65rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          padding: 4px 32px;
          transform: rotate(45deg);
          box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        }
        .slider-container {
          flex: 1;
          width: 100%;
          overflow: hidden;
          position: relative;
        }
        .steps-slider {
          width: 100%;
          height: 400%; /* 4 viewports, each 100% of parent */
          display: flex;
          flex-direction: column;
          will-change: transform;
          transition: transform 0.8s cubic-bezier(0.16, 1, 0.3, 1);
          transform: translateY(calc(-1 * var(--slider-offset, 0%)));
        }
        .viewport-section {
          width: 100%;
          height: 25%; /* 1/4 of steps-slider */
          flex-shrink: 0;
          display: flex;
          position: relative;
          overflow: hidden;
        }
        .landing-view {
          display: flex;
        }
        .back-step-btn {
          position: fixed;
          top: 96px;
          left: 24px;
          background: rgba(255, 255, 255, 0.45);
          backdrop-filter: blur(12px);
          border: 1px solid var(--border-glass);
          color: #7c3aed;
          font-weight: 600;
          font-size: 0.85rem;
          padding: 8px 16px;
          border-radius: 99px;
          cursor: pointer;
          z-index: 999;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          display: flex;
          align-items: center;
          gap: 6px;
          outline: none;
        }
        .back-step-btn:hover {
          background: rgba(255, 255, 255, 0.85);
          border-color: var(--gold-border);
          color: #db2777;
          transform: translateX(-3px);
          box-shadow: 0 4px 12px rgba(168, 85, 247, 0.06);
        }



        /* Floating Vertical Stepper Styles */
        .floating-vertical-stepper {
          position: fixed;
          right: 28px;
          top: 50%;
          transform: translateY(-50%);
          display: flex;
          flex-direction: column;
          gap: 16px;
          z-index: 999;
          background: rgba(255, 255, 255, 0.35);
          backdrop-filter: blur(12px);
          border: 1px solid var(--border-glass);
          padding: 18px 14px;
          border-radius: 99px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.03);
          transition: all 0.3s ease;
        }
        .stepper-node {
          background: transparent;
          border: none;
          outline: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 4px;
          position: relative;
          text-align: left;
          width: 32px;
          overflow: hidden;
          transition: width 0.3s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.3s;
          border-radius: 99px;
        }
        .stepper-node:hover {
          width: 175px;
          background: rgba(255, 255, 255, 0.7);
        }
        .stepper-node:disabled {
          cursor: not-allowed;
        }
        .node-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: rgba(124, 58, 237, 0.15);
          border: 2px solid rgba(124, 58, 237, 0.3);
          flex-shrink: 0;
          transition: all 0.3s ease;
          display: inline-block;
          margin-left: 6px;
        }
        .stepper-node.active .node-dot {
          background: #7c3aed;
          border-color: #7c3aed;
          box-shadow: 0 0 10px rgba(124, 58, 237, 0.6);
          transform: scale(1.2);
        }
        .stepper-node.completed .node-dot {
          background: #db2777;
          border-color: #db2777;
        }
        .node-label {
          font-family: var(--font-sans);
          font-size: 0.8rem;
          font-weight: 700;
          color: #475569;
          white-space: nowrap;
          opacity: 0;
          transition: opacity 0.2s ease;
          pointer-events: none;
        }
        .stepper-node:hover .node-label {
          opacity: 1;
        }
        
        /* Mobile adjustment for vertical stepper */
        @media (max-width: 992px) {
          .floating-vertical-stepper {
            display: none;
          }
          .process-timeline {
            max-width: 100%;
          }
          .timeline-progress-line {
            display: none;
          }
          .timeline-steps {
            grid-template-columns: 1fr;
            gap: 16px;
            align-items: center;
          }
          .timeline-step {
            flex-direction: row;
            text-align: left;
            align-items: center;
            gap: 16px;
            width: 100%;
            max-width: 380px;
            margin: 0 auto;
            background: rgba(255, 255, 255, 0.3);
            padding: 12px 16px;
            border-radius: 16px;
            border: 1px solid rgba(255, 255, 255, 0.5);
          }
          .step-circle {
            margin-bottom: 0;
            flex-shrink: 0;
          }
          .step-desc {
            max-width: 100%;
          }
        }

        /* Multi-step Quiz View styles */
        .quiz-view, .profile-view {
          background: radial-gradient(circle at bottom right, rgba(168, 85, 247, 0.04) 0%, transparent 60%);
          display: flex;
          justify-content: center;
          align-items: center;
        }
        .section-container {
          max-width: 800px;
          width: 90%;
          margin: 0 auto;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        .quiz-card {
          width: 100%;
          max-width: 600px;
          padding: 40px;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .quiz-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .category-tag-header {
          background: rgba(168, 85, 247, 0.08);
          color: #7c3aed;
          border: 1px solid rgba(168, 85, 247, 0.2);
          font-size: 0.75rem;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: 6px;
          text-transform: uppercase;
        }
        .progress-label {
          font-size: 0.85rem;
          color: hsl(var(--text-muted));
        }
        .progress-bar-container {
          height: 6px;
          background: rgba(0, 0, 0, 0.05);
          border-radius: 99px;
          overflow: hidden;
          width: 100%;
        }
        .progress-bar-fill {
          height: 100%;
          background: linear-gradient(90deg, #db2777 0%, #7c3aed 100%);
          border-radius: 99px;
          width: var(--progress, 0%);
          transition: width 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .quiz-question-text {
          font-size: 1.6rem;
          font-family: var(--font-sans);
          font-weight: 700;
          color: #1e1b4b;
          line-height: 1.4;
          text-align: left;
        }
        .quiz-options {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .quiz-option-btn {
          width: 100%;
          padding: 16px 24px;
          background: rgba(255, 255, 255, 0.7);
          border: 1.5px solid var(--border-glass);
          border-radius: 14px;
          color: #334155;
          font-size: 0.95rem;
          font-weight: 600;
          text-align: left;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          animation: fadeSlideIn 0.4s ease forwards;
          opacity: 0;
          outline: none;
        }
        .quiz-option-btn:hover {
          transform: translateX(4px);
          background: #ffffff;
          border-color: #7c3aed;
          box-shadow: 0 4px 15px rgba(168, 85, 247, 0.08);
          color: #7c3aed;
        }

        .quiz-option-delay-0 { animation-delay: 0s; }
        .quiz-option-delay-1 { animation-delay: 0.08s; }
        .quiz-option-delay-2 { animation-delay: 0.16s; }
        .quiz-option-delay-3 { animation-delay: 0.24s; }
        .quiz-option-delay-4 { animation-delay: 0.32s; }
        .quiz-option-delay-5 { animation-delay: 0.4s; }
        .quiz-option-delay-6 { animation-delay: 0.48s; }
        .quiz-option-delay-7 { animation-delay: 0.56s; }
        .quiz-option-delay-8 { animation-delay: 0.64s; }
        .quiz-option-delay-9 { animation-delay: 0.72s; }
        .quiz-option-delay-10 { animation-delay: 0.8s; }
        .quiz-option-delay-11 { animation-delay: 0.88s; }
        
        .quiz-text-input-container {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .form-control-text {
          width: 100%;
          padding: 16px;
          border-radius: 14px;
          border: 1px solid var(--border-glass);
          background: rgba(255, 255, 255, 0.5);
          outline: none;
          color: #1e293b;
          font-family: inherit;
          font-size: 1rem;
          resize: none;
          transition: var(--transition-smooth);
        }
        .form-control-text:focus {
          border-color: #7c3aed;
          background: #ffffff;
          box-shadow: 0 0 15px rgba(124, 58, 237, 0.1);
        }
        .input-actions {
          display: flex;
          justify-content: flex-end;
        }
        .input-submit-btn {
          background: var(--btn-gold-bg);
          color: var(--btn-gold-text);
          border: 1px solid var(--btn-gold-border);
          padding: 12px 24px;
          border-radius: 12px;
          font-weight: 700;
          font-size: 0.88rem;
          cursor: pointer;
          transition: var(--transition-smooth);
        }
        .input-submit-btn:hover {
          transform: translateY(-2px);
          filter: brightness(1.05);
        }

        /* Data Capture Profile card styles */
        .profile-capture-card {
          width: 100%;
          max-width: 650px;
          padding: 40px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .profile-title {
          font-size: 1.8rem;
          font-weight: 700;
          text-align: center;
          margin-bottom: 4px;
        }
        .profile-subtitle {
          font-size: 0.92rem;
          color: hsl(var(--text-muted));
          text-align: center;
          margin-bottom: 12px;
        }
        .profile-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .form-group-row {
          display: flex;
          gap: 16px;
        }
        .form-group-row .form-group {
          flex: 1;
        }
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
          text-align: left;
        }
        .form-group label {
          font-size: 0.82rem;
          font-weight: 700;
          color: #334155;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .profile-input {
          width: 100%;
          padding: 12px 16px;
          border-radius: 10px;
          border: 1px solid var(--border-glass);
          background: rgba(255, 255, 255, 0.6);
          color: #1e293b;
          font-family: inherit;
          font-size: 0.95rem;
          outline: none;
          transition: var(--transition-fast);
        }
        .profile-input:focus {
          border-color: #7c3aed;
          background: #ffffff;
          box-shadow: 0 0 10px rgba(124, 58, 237, 0.08);
        }

        /* Soul Report CTA Button */
        .soul-report-btn {
          width: 100% !important;
          font-size: 1rem !important;
          font-family: var(--font-serif) !important;
          letter-spacing: 0.12em !important;
          padding: 18px 36px !important;
          border-radius: 16px !important;
          box-shadow: 0 6px 28px rgba(168, 85, 247, 0.3), 0 0 0 0 rgba(168, 85, 247, 0.4) !important;
          animation: soul-btn-pulse 3s infinite;
          background: linear-gradient(135deg, #f9a8d4 0%, #c4b5fd 40%, #a5b4fc 80%, #6ee7b7 100%) !important;
        }
        .soul-report-btn:hover {
          box-shadow: 0 12px 40px rgba(168, 85, 247, 0.4), 0 0 60px rgba(168, 85, 247, 0.15) !important;
          transform: translateY(-3px) !important;
          animation: none;
        }
        .soul-report-btn:disabled {
          animation: none;
          box-shadow: none !important;
        }
        @keyframes soul-btn-pulse {
          0%   { box-shadow: 0 6px 28px rgba(168, 85, 247, 0.3), 0 0 0 0 rgba(168, 85, 247, 0.35); }
          50%  { box-shadow: 0 6px 28px rgba(168, 85, 247, 0.3), 0 0 0 10px rgba(168, 85, 247, 0); }
          100% { box-shadow: 0 6px 28px rgba(168, 85, 247, 0.3), 0 0 0 0 rgba(168, 85, 247, 0); }
        }

        /* 4. Report Viewport styles */
        .report-view {
          height: auto;
          min-height: 100vh;
          background: radial-gradient(circle at top left, rgba(236, 72, 153, 0.03) 0%, transparent 50%),
                      radial-gradient(circle at bottom right, rgba(16, 185, 129, 0.03) 0%, transparent 60%),
                      #ffffff;
          padding: 80px 24px;
        }
        .select-report-layout {
          max-width: 1200px;
        }
        .section-header {
          margin-bottom: 40px;
          text-align: center;
        }
        .section-title {
          font-size: 2.1rem;
          color: #4c1d95;
          margin-bottom: 12px;
        }
        .section-desc {
          color: hsl(var(--text-muted));
          font-size: 0.95rem;
        }
        .services-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
          gap: 32px;
        }
        .service-card {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .card-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .category-badges {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }
        .category-badge {
          background: rgba(16, 185, 129, 0.08);
          border: 1px solid rgba(16, 185, 129, 0.2);
          color: #065f46;
          font-size: 0.75rem;
          font-weight: 600;
          padding: 4px 10px;
          border-radius: 6px;
          text-transform: uppercase;
        }
        .price-tag {
          font-family: var(--font-serif);
          color: #db2777;
          font-weight: 700;
          font-size: 1.2rem;
        }
        .card-service-title {
          font-size: 1.35rem;
          margin-bottom: 4px;
          color: hsl(var(--text-cream));
        }
        .card-service-desc {
          font-size: 0.88rem;
          flex: 1;
          margin-bottom: 12px;
        }
        .card-practitioner-row {
          display: flex;
          justify-content: space-between;
          font-size: 0.85rem;
          border-top: 1px solid rgba(0,0,0,0.05);
          padding-top: 16px;
          color: hsl(var(--text-muted));
        }
        .card-rating {
          color: #d97706;
          font-weight: 600;
        }
        .card-action-row {
          margin-top: 8px;
        }
        .category-tabs {
          display: flex;
          justify-content: center;
          gap: 16px;
          margin-bottom: 20px;
          border-bottom: 1.5px solid rgba(0,0,0,0.06);
          padding-bottom: 16px;
        }
        .category-tab-btn {
          background: transparent;
          border: none;
          color: hsl(var(--text-muted));
          font-family: var(--font-serif);
          font-size: 0.95rem;
          font-weight: 600;
          padding: 8px 20px;
          cursor: pointer;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          transition: var(--transition-fast);
          position: relative;
        }
        .category-tab-btn:hover {
          color: #7c3aed;
        }
        .category-tab-btn.active {
          color: #7c3aed;
        }
        .category-tab-btn.active::after {
          content: '';
          position: absolute;
          bottom: -17.5px;
          left: 0;
          right: 0;
          height: 2px;
          background: #7c3aed;
          box-shadow: 0 0 10px rgba(124, 58, 237, 0.4);
        }
        .philosophy-section {
          padding: 60px 24px;
          text-align: center;
          border-top: 1px solid rgba(0,0,0,0.06);
          border-bottom: 1px solid rgba(0,0,0,0.06);
        }
        .philosophy-symbol {
          font-size: 2rem;
          color: #db2777;
          margin-bottom: 16px;
        }
        .philosophy-quote {
          font-family: var(--font-serif);
          font-size: 1.6rem;
          font-style: italic;
          max-width: 800px;
          margin: 0 auto 16px;
          color: #4c1d95;
          line-height: 1.5;
        }
        .philosophy-author {
          font-size: 0.85rem;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color: hsl(var(--text-muted));
        }
        .loading-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 32px;
        }
        .skeleton-card {
          height: 300px;
          background: rgba(0,0,0,0.03);
          border-radius: 20px;
          animation: pulse 1.8s infinite ease-in-out;
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
        @media (max-width: 768px) {
          .philosophy-quote {
            font-size: 1.25rem;
          }
          .category-tabs {
            flex-wrap: wrap;
            gap: 8px;
          }
          .loading-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
