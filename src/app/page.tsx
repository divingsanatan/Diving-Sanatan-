"use client";

import React, { useState, useEffect, useRef } from "react";
import { gsap } from "gsap";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { formatCurrency } from "@/utils/formatters";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Service, Category } from "@/types/database";

export default function Home() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [faqOpen, setFaqOpen] = useState(false);
  const [transitioning, setTransitioning] = useState(false);

  // Multi-step Quiz Flow States
  const [activeStep, setActiveStep] = useState<1 | 2 | 3 | 4>(1);

  const triggerStepTransition = async (nextStep: number) => {
    // Determine the selector for the current active section to capture
    let activeSectionId = "";
    if (activeStep === 1) activeSectionId = "#section-landing";
    else if (activeStep === 2) activeSectionId = "#section-quiz";
    else if (activeStep === 3) activeSectionId = "#section-profile";
    else if (activeStep === 4) activeSectionId = "#section-report";

    const captureEl = document.querySelector(activeSectionId) as HTMLElement;

    if (!captureEl) {
      setActiveStep(nextStep as 1 | 2 | 3 | 4);
      return;
    }

    setTransitioning(true);

    try {
      const html2canvas = (await import("html2canvas")).default;

      // Capture the element
      const originalCanvas = await html2canvas(captureEl, {
        backgroundColor: "#ffffff",
        logging: false,
        useCORS: true
      });

      const width = originalCanvas.width;
      const height = originalCanvas.height;

      // Performance optimization: scale down for calculations
      const scale = Math.min(1, 600 / width);
      const scaledWidth = Math.floor(width * scale);
      const scaledHeight = Math.floor(height * scale);

      const scaledCanvas = document.createElement("canvas");
      scaledCanvas.width = scaledWidth;
      scaledCanvas.height = scaledHeight;
      const scaledCtx = scaledCanvas.getContext("2d");
      if (scaledCtx) {
        scaledCtx.drawImage(originalCanvas, 0, 0, scaledWidth, scaledHeight);
      }

      const ctx = scaledCanvas.getContext("2d");
      if (!ctx) throw new Error("Could not get 2d context");

      const imageData = ctx.getImageData(0, 0, scaledWidth, scaledHeight);

      const COUNT = 45; // Number of particle layers (balance speed & visuals)
      const REPEAT_COUNT = 2; // Pixel duplication factor

      let dataList: ImageData[] = [];
      for (let i = 0; i < COUNT; i++) {
        dataList.push(ctx.createImageData(scaledWidth, scaledHeight));
      }

      // Distribute pixels randomly across data lists
      for (let x = 0; x < scaledWidth; x++) {
        for (let y = 0; y < scaledHeight; y++) {
          for (let l = 0; l < REPEAT_COUNT; l++) {
            const index = (x + y * scaledWidth) * 4;
            const dataIndex = Math.floor(
              (COUNT * (Math.random() + (2 * x) / scaledWidth)) / 3
            );
            if (dataList[dataIndex]) {
              for (let p = 0; p < 4; p++) {
                dataList[dataIndex].data[index + p] = imageData.data[index + p];
              }
            }
          }
        }
      }

      // Container for all capture canvas particles
      const transitionContainer = document.querySelector(".disintegration-transition-container");
      if (!transitionContainer) {
        setActiveStep(nextStep as 1 | 2 | 3 | 4);
        setTransitioning(false);
        return;
      }

      const rect = captureEl.getBoundingClientRect();

      // Append and animate each particle canvas
      const animPromises = dataList.map((data, i) => {
        return new Promise<void>((resolve) => {
          let clonedCanvas = document.createElement("canvas");
          clonedCanvas.width = scaledWidth;
          clonedCanvas.height = scaledHeight;
          const clonedCtx = clonedCanvas.getContext("2d");
          if (clonedCtx) {
            clonedCtx.putImageData(data, 0, 0);
          }
          clonedCanvas.className = "capture-canvas";

          // Match the size and position of the original captured element relative to the viewport
          clonedCanvas.style.width = `${captureEl.offsetWidth}px`;
          clonedCanvas.style.height = `${captureEl.offsetHeight}px`;
          clonedCanvas.style.position = "absolute";
          clonedCanvas.style.top = `${rect.top}px`;
          clonedCanvas.style.left = `${rect.left}px`;

          transitionContainer.appendChild(clonedCanvas);

          const randomAngle = (Math.random() - 0.5) * 2 * Math.PI;
          const randomRotationAngle = 35 * (Math.random() - 0.5);

          // Animate particle canvas drifting away
          gsap.to(clonedCanvas, {
            duration: 1.3,
            rotate: randomRotationAngle,
            x: 80 * Math.sin(randomAngle),
            y: -120 - (120 * Math.random()), // Float upwards and disperse
            opacity: 0,
            delay: (i / dataList.length) * 0.9,
            ease: "power1.out",
            onComplete: () => {
              clonedCanvas.remove();
              resolve();
            }
          });
        });
      });

      // Change step in the background immediately as disintegration begins
      setActiveStep(nextStep as 1 | 2 | 3 | 4);

      // Wait for all particles to disperse before completing transition
      Promise.all(animPromises).then(() => {
        setTransitioning(false);
      });

    } catch (err) {
      console.error("Disintegration transition error:", err);
      // Fallback in case of failure
      setActiveStep(nextStep as 1 | 2 | 3 | 4);
      setTransitioning(false);
    }
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

  const sliderRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const timelineLineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (sliderRef.current) {
      gsap.to(sliderRef.current, {
        yPercent: -(activeStep - 1) * 25,
        duration: 0.8,
        ease: "power2.inOut",
        force3D: true
      });
    }
  }, [activeStep]);

  useEffect(() => {
    if (activeStep === 1 && timelineRef.current && timelineLineRef.current) {
      const stepNodes = timelineRef.current.querySelectorAll(".timeline-step");
      const lineFill = timelineLineRef.current;

      gsap.killTweensOf([lineFill, stepNodes]);

      gsap.set(lineFill, { scaleX: 0, transformOrigin: "left center" });
      gsap.set(stepNodes, { opacity: 0, y: 15 });

      const tl = gsap.timeline({ delay: 0.2 });

      tl.to(lineFill, {
        scaleX: 1,
        duration: 1.2,
        ease: "power2.inOut"
      });

      tl.to(stepNodes, {
        opacity: 1,
        y: 0,
        duration: 0.6,
        stagger: 0.15,
        ease: "back.out(1.5)"
      }, "-=0.8");
    }
  }, [activeStep]);

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
      const res = await fetch(`/api/quiz-questions?category=${encodeURIComponent(cat)}`);
      const json = await res.json();
      if (json.success && json.data && json.data.length > 0) {
        setCurrentQuestions(json.data);
      } else {
        // Fallback questions if database query is empty
        const fallbacks = [
          {
            id: `f1-${cat}`,
            category: cat,
            question_text: `How long have you been experiencing this ${cat.toLowerCase()}-related challenge?`,
            question_type: "choice",
            options: ["Less than a month", "1 to 6 months", "Over 6 months", "It has been years"]
          },
          {
            id: `f2-${cat}`,
            category: cat,
            question_text: `On a scale of 1-10, how severely does this block your daily peace?`,
            question_type: "choice",
            options: ["Mild (1-3)", "Moderate (4-6)", "Severe (7-8)", "Overwhelming (9-10)"]
          },
          {
            id: `f3-${cat}`,
            category: cat,
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
    const base = {
      Root: 70 + Math.floor(Math.random() * 20),
      Sacral: 70 + Math.floor(Math.random() * 20),
      Solar: 70 + Math.floor(Math.random() * 20),
      Heart: 70 + Math.floor(Math.random() * 20),
      Throat: 70 + Math.floor(Math.random() * 20),
      ThirdEye: 70 + Math.floor(Math.random() * 20),
      Crown: 70 + Math.floor(Math.random() * 20)
    };

    if (cat === "Anxiety") {
      base.Root = 30 + Math.floor(Math.random() * 15); // Root (grounding) is severely blocked
      base.Solar = 45 + Math.floor(Math.random() * 20); // Solar Plexus (fear/confidence) is affected
    } else if (cat === "Stress") {
      base.Solar = 25 + Math.floor(Math.random() * 20); // Stress blocks Solar Plexus
      base.Heart = 40 + Math.floor(Math.random() * 20); // Drains emotional resilience
    } else if (cat === "Loss") {
      base.Heart = 30 + Math.floor(Math.random() * 15); // Grief directly impacts Heart chakra
      base.Crown = 50 + Math.floor(Math.random() * 20); // Disconnects Crown
    } else if (cat === "Health") {
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
        // Save profile data to localStorage
        window.localStorage.setItem("divingsanatan_user_profile", JSON.stringify(profileForm));
        setHasSavedProfile(true);
        setChakraScores(generateChakraScores(selectedCategory));
        triggerStepTransition(4);
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
    const cat = selectedCategory.toLowerCase();
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
    <div className={`homepage-wrapper ${activeStep === 4 ? 'step-report-active' : ''}`}>
      <Header />

      {activeStep > 1 && (
        <button className="back-step-btn" onClick={handleBackStep}>
          ← Back
        </button>
      )}

      {/* Floating Vertical Stepper Progress Indicator */}
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

      {/* Particle Disintegration Transition Overlay */}
      {transitioning && (
        <div className="disintegration-transition-container"></div>
      )}

      <div className="slider-container">
        <div ref={sliderRef} className="steps-slider">

          {/* 1. Landing Viewport (Google Search Layout) */}
          <section id="section-landing" className="viewport-section landing-view">
            <div className="hero-banner">
              <div className="hero-content">
                <h1 className="hero-title">How can we guide you today?</h1>
                <p className="hero-subtitle">Enter your feelings, spiritual blockers, or healing needs...</p>

                <form onSubmit={handleSearchSubmit} className="search-bar-form">
                  <div className={`search-input-wrapper ${searchError ? "shake-input-error" : ""}`}>
                    <svg className="search-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="20" height="20">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                      type="text"
                      placeholder={searchError ? "Please type something first..." : "I am struggling with stress and need peace..."}
                      className="search-input"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        if (e.target.value.trim()) setSearchError(false);
                      }}
                    />
                    <button type="submit" className="search-submit-btn">
                      Seek Guidance
                    </button>
                  </div>
                </form>

                {/* Quick Feelings Buttons */}
                <div className="feelings-tag-container">
                  <span className="feelings-label">Common Seekings:</span>
                  {feelings.map((f, i) => (
                    <button
                      key={i}
                      className="feeling-tag"
                      onClick={() => startQuiz(f.category)}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                <div className="process-timeline-container">
                  <div className="process-timeline-title">Interactive Alignment Path</div>
                  <div ref={timelineRef} className="process-timeline">
                    <div className="timeline-progress-line">
                      <div ref={timelineLineRef} className="timeline-progress-fill"></div>
                    </div>

                    <div className="timeline-steps">
                      <div className="timeline-step">
                        <div className="step-circle bg-green">
                          <span className="step-num">1</span>
                          <span className="step-icon">🧘</span>
                        </div>
                        <div className="step-info">
                          <h4 className="step-heading">1. Seek Guidance</h4>
                          <p className="step-desc">Search or select your current emotional blockers.</p>
                        </div>
                      </div>

                      <div className="timeline-step">
                        <div className="step-circle bg-purple">
                          <span className="step-num">2</span>
                          <span className="step-icon">⚡</span>
                        </div>
                        <div className="step-info">
                          <h4 className="step-heading">2. Somatic Quiz</h4>
                          <p className="step-desc">Answer questions tailored dynamically to your needs.</p>
                        </div>
                      </div>

                      <div className="timeline-step">
                        <div className="step-circle bg-blue">
                          <span className="step-num">3</span>
                          <span className="step-icon">✨</span>
                        </div>
                        <div className="step-info">
                          <h4 className="step-heading">3. Energy Mapping</h4>
                          <p className="step-desc">Enter baseline resonance parameters for report generation.</p>
                        </div>
                      </div>

                      <div className="timeline-step">
                        <div className="step-circle bg-gold">
                          <span className="step-num">4</span>
                          <span className="step-icon">💎</span>
                        </div>
                        <div className="step-info">
                          <h4 className="step-heading">4. Realign & Consult</h4>
                          <p className="step-desc">Access custom Chakra reports & book free 15 min power sessions.</p>
                        </div>
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
                <div className="quiz-card glass-panel animation-gsap">
                  <div className="quiz-header">
                    <span className="category-tag-header">{selectedCategory} Query</span>
                    <span className="progress-label">
                      Question {currentQuestionIndex + 1} of {currentQuestions.length}
                    </span>
                  </div>

                  <div className="progress-bar-container">
                    <div
                      className="progress-bar-fill"
                      style={{ width: `${((currentQuestionIndex + 1) / currentQuestions.length) * 100}%` }}
                    />
                  </div>

                  <h2 className="quiz-question-text">{currentQuestion.question_text}</h2>

                  {currentQuestion.question_type === "choice" ? (
                    <div className="quiz-options">
                      {getOptionsArray(currentQuestion).map((option: string, idx: number) => (
                        <button
                          key={idx}
                          className="quiz-option-btn"
                          onClick={() => handleAnswerSelect(option)}
                          style={{ animationDelay: `${idx * 0.08}s` }}
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
                <Card variant="glass" className="profile-capture-card glass-panel animation-gsap">
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

                    {/* Left Column: Visual Chakras */}
                    <div className="report-left-column glass-panel">
                      <h3 className="visualizer-heading">Your Spiritual Alignment</h3>
                      <div className="chakra-interactive-visualizer">

                        {/* SVG spinal channel with glowing nodes */}
                        <div className="spinal-svg-wrapper">
                          <svg className="spinal-channel" width="80" height="500" viewBox="0 0 80 500">
                            <line x1="40" y1="20" x2="40" y2="480" stroke="rgba(168, 85, 247, 0.15)" strokeWidth="6" strokeDasharray="8 6" />

                            <circle cx="40" cy="40" r="18" className="chakra-crown node-pulse" />
                            <circle cx="40" cy="110" r="18" className="chakra-thirdeye node-pulse" />
                            <circle cx="40" cy="180" r="18" className="chakra-throat node-pulse" />
                            <circle cx="40" cy="250" r="18" className="chakra-heart node-pulse" />
                            <circle cx="40" cy="320" r="18" className="chakra-solar" />
                            <circle cx="40" cy="390" r="18" className="chakra-sacral" />
                            <circle cx="40" cy="460" r="18" className="chakra-root" />
                          </svg>
                        </div>

                        {/* Chakra List with scores and lines pointing to the right */}
                        <div className="chakra-visualizer-labels">
                          <div className="visualizer-label-item crown">
                            <span className="dot-line"></span>
                            <div className="label-content">
                              <span className="chakra-name-sanskrit">Sahasrara</span>
                              <span className="chakra-name-english">Crown Chakra</span>
                              <span className="chakra-score-val">{chakraScores.Crown}%</span>
                            </div>
                          </div>

                          <div className="visualizer-label-item thirdeye">
                            <span className="dot-line"></span>
                            <div className="label-content">
                              <span className="chakra-name-sanskrit">Ajna</span>
                              <span className="chakra-name-english">Third Eye</span>
                              <span className="chakra-score-val">{chakraScores.ThirdEye}%</span>
                            </div>
                          </div>

                          <div className="visualizer-label-item throat">
                            <span className="dot-line"></span>
                            <div className="label-content">
                              <span className="chakra-name-sanskrit">Vishuddha</span>
                              <span className="chakra-name-english">Throat Chakra</span>
                              <span className="chakra-score-val">{chakraScores.Throat}%</span>
                            </div>
                          </div>

                          <div className="visualizer-label-item heart">
                            <span className="dot-line"></span>
                            <div className="label-content">
                              <span className="chakra-name-sanskrit">Anahata</span>
                              <span className="chakra-name-english">Heart Chakra</span>
                              <span className="chakra-score-val">{chakraScores.Heart}%</span>
                            </div>
                          </div>

                          <div className="visualizer-label-item solar">
                            <span className="dot-line"></span>
                            <div className="label-content">
                              <span className="chakra-name-sanskrit">Manipura</span>
                              <span className="chakra-name-english">Solar Plexus</span>
                              <span className="chakra-score-val">{chakraScores.Solar}%</span>
                            </div>
                          </div>

                          <div className="visualizer-label-item sacral">
                            <span className="dot-line"></span>
                            <div className="label-content">
                              <span className="chakra-name-sanskrit">Svadhisthana</span>
                              <span className="chakra-name-english">Sacral Chakra</span>
                              <span className="chakra-score-val">{chakraScores.Sacral}%</span>
                            </div>
                          </div>

                          <div className="visualizer-label-item root">
                            <span className="dot-line"></span>
                            <div className="label-content">
                              <span className="chakra-name-sanskrit">Muladhara</span>
                              <span className="chakra-name-english">Root Chakra</span>
                              <span className="chakra-score-val">{chakraScores.Root}%</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right Column: Detailed Report Text & Analysis */}
                    <div className="report-right-column glass-panel">
                      <div className="report-header">
                        <span className="report-status-badge">Alignment Profile Generated</span>
                        <h2 className="report-title gold-text-gradient">Resonance & Chakra Report</h2>
                        <p className="report-owner">Prepared for <strong>{profileForm.name}</strong> • Mapped Focus: <strong>{selectedCategory}</strong></p>
                      </div>

                      <div className="soul-report-summary">
                        <h4 className="summary-heading">Energy Spectrum Summary</h4>
                        <p>
                          Based on your answers, your energy fields reveal specific somatic blockages under the <strong>{selectedCategory}</strong> spectrum.
                          {selectedCategory === "Anxiety" && " This is primarily draining your Root and Solar Plexus chakras, resulting in overthinking, anxiety triggers, and a lack of baseline physical security."}
                          {selectedCategory === "Stress" && " Stress vectors are currently congesting your Solar Plexus and Heart chakras. You might experience chronic tiredness, sleep disruptions, and difficulties resting deeply."}
                          {selectedCategory === "Loss" && " Grief and loss are restricting your Heart and Crown chakras, causing emotional numbness, isolation, and a feeling of disconnection from overall life path purpose."}
                          {selectedCategory === "Health" && " Your Root and Sacral energy readings are severely constrained. Physical discomforts, tension, or energy fatigue are causing disruptions in cellular peace."}
                        </p>
                      </div>

                      {/* Critical points list */}
                      <div className="blocked-chakra-analysis">
                        <h4 className="analysis-heading">Critical Energy Points</h4>
                        <div className="critical-points-list">
                          {Object.entries(chakraScores)
                            .filter(([name, val]) => val < 60)
                            .map(([name, val]) => (
                              <div key={name} className={`critical-point-item ${name.toLowerCase()}`}>
                                <span className="status-marker">⚠️ Blocked</span>
                                <div className="point-info">
                                  <strong>{name} Chakra ({val}%)</strong>
                                  <p>Requires immediate vibrational support and somatic centering therapies to release locked stress patterns.</p>
                                </div>
                              </div>
                            ))}
                          {Object.values(chakraScores).every(val => val >= 60) && (
                            <div className="critical-point-item safe">
                              <span className="status-marker normal">✨ Moderate</span>
                              <div className="point-info">
                                <strong>All Chakras in Moderate Flow</strong>
                                <p>No critical blockages detected. Gentle maintenance therapies will help sustain your current alignment.</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <button className="restart-btn" onClick={restartFlow}>
                        🔄 Start Wellness Check Again
                      </button>
                    </div>
                  </div>

                  {/* Bottom Section: Book Session Block */}
                  <div className="report-bottom-section glass-panel">
                    <div className="bottom-section-header">
                      <h3 className="bottom-section-title">Schedule Your Alignment Plan</h3>
                      <p className="bottom-section-subtitle">Take the next step in your spiritual journey and remove somatic blocks.</p>
                    </div>

                    <div className="booking-options-grid">
                      {/* Option 1: Power Session Call */}
                      <div className="consultation-cta-card power-session-card">
                        <span className="power-tag">Power Session</span>
                        <h3 className="consult-title">Stage 2: Live Consultation</h3>
                        <p className="consult-desc">Activate your custom 15-minute guided session with a certified spiritual therapist to map out your Aura alignment.</p>
                        <Button variant="gold" onClick={() => router.push("/contact")} style={{ width: "100%", marginTop: "auto" }}>
                          Schedule Live Call (Free)
                        </Button>
                      </div>

                      {/* Option 2 & 3: Recommended Services list */}
                      <div className="therapies-recommendation-card">
                        <h4 className="recommend-services-title">Recommended Custom Therapies</h4>
                        <div className="recommended-services-grid-layout">
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
                                style={{ width: "100%", marginTop: "12px" }}
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

        /* Disintegration Transition Styles */
        .disintegration-transition-container {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          z-index: 99999;
          pointer-events: none;
          overflow: hidden;
        }
        .capture-canvas {
          position: absolute;
          will-change: transform, opacity;
          pointer-events: none;
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

        .hero-banner {
          flex: 1;
          padding: 40px 24px;
          text-align: center;
          background: radial-gradient(circle at center, rgba(168, 85, 247, 0.08) 0%, transparent 60%);
          display: flex;
          justify-content: center;
          align-items: center;
          flex-direction: column;
          position: relative;
        }
        .hero-content {
          max-width: 800px;
          width: 100%;
        }
        .hero-title {
          font-size: 3.2rem;
          margin-bottom: 12px;
          background: linear-gradient(135deg, #db2777 0%, #7c3aed 60%, #2563eb 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          text-shadow: 0 0 40px rgba(168, 85, 247, 0.1);
        }
        .hero-subtitle {
          font-size: 1.15rem;
          color: hsl(var(--text-muted));
          margin-bottom: 32px;
        }
        .search-bar-form {
          width: 100%;
          display: flex;
          justify-content: center;
        }
        .search-input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
          width: 100%;
          max-width: 650px;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(12px);
          border: 1.5px solid var(--gold-border);
          border-radius: 99px;
          padding: 8px 8px 8px 20px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.03), 0 0 20px var(--gold-glow);
          transition: var(--transition-smooth);
        }
        .search-input-wrapper:focus-within {
          border-color: #7c3aed;
          box-shadow: 0 8px 40px rgba(0,0,0,0.05), 0 0 30px rgba(168, 85, 247, 0.3);
        }
        .search-icon {
          color: #7c3aed;
          margin-right: 12px;
        }
        .search-input {
          flex: 1;
          background: transparent;
          border: none;
          outline: none;
          color: #1e293b;
          font-size: 1.05rem;
          font-family: var(--font-sans);
          padding-right: 16px;
        }
        .search-input::placeholder {
          color: rgba(0, 0, 0, 0.4);
        }
        .search-submit-btn {
          font-family: var(--font-serif);
          font-weight: 700;
          font-size: 0.85rem;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          background: var(--btn-gold-bg);
          color: var(--btn-gold-text);
          border: 1px solid var(--btn-gold-border);
          padding: 13px 28px;
          border-radius: 99px;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          position: relative;
          overflow: hidden;
          box-shadow: 0 4px 18px var(--btn-gold-hover-shadow);
          white-space: nowrap;
        }
        .search-submit-btn::after {
          content: '';
          position: absolute;
          top: 0;
          left: -150%;
          width: 60%;
          height: 100%;
          background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.35) 50%, transparent 100%);
          transform: skewX(-20deg);
          transition: left 0.7s ease;
        }
        .search-submit-btn:hover {
          filter: brightness(1.07);
          transform: translateY(-2px) scale(1.02);
          box-shadow: 0 8px 28px var(--btn-gold-hover-shadow);
        }
        .search-submit-btn:hover::after {
          left: 200%;
        }
        .search-submit-btn:active {
          transform: translateY(0) scale(0.99);
          box-shadow: 0 2px 8px var(--btn-gold-hover-shadow);
        }
        
        .feelings-tag-container {
          margin-top: 20px;
          display: flex;
          justify-content: center;
          align-items: center;
          flex-wrap: wrap;
          gap: 10px;
        }
        .feelings-label {
          font-size: 0.82rem;
          color: hsl(var(--text-muted));
          margin-right: 8px;
        }
        .feeling-tag {
          background: rgba(168, 85, 247, 0.06);
          border: 1px solid rgba(168, 85, 247, 0.2);
          color: #6d28d9;
          padding: 6px 14px;
          border-radius: 99px;
          font-size: 0.78rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          position: relative;
          overflow: hidden;
        }
        .feeling-tag:hover {
          background: rgba(168, 85, 247, 0.14);
          border-color: #7c3aed;
          transform: translateY(-1px) scale(1.04);
          box-shadow: 0 4px 12px rgba(168, 85, 247, 0.18);
        }
        .feeling-tag:active {
          transform: translateY(0) scale(0.97);
          box-shadow: none;
        }

        /* Process Steps Timeline Styles */
        .process-timeline-container {
          margin-top: 36px;
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
        }
        .process-timeline-title {
          font-family: var(--font-sans);
          font-size: 0.8rem;
          font-weight: 700;
          color: hsl(var(--text-muted));
          text-transform: uppercase;
          letter-spacing: 0.08em;
          opacity: 0.75;
        }
        .process-timeline {
          position: relative;
          width: 100%;
          max-width: 850px;
          padding: 10px 0;
        }
        .timeline-progress-line {
          position: absolute;
          top: 35px;
          left: 45px;
          right: 45px;
          height: 3px;
          background: rgba(168, 85, 247, 0.08);
          z-index: 1;
          border-radius: 99px;
        }
        .timeline-progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #34d399, #7c3aed, #60a5fa, #fb923c);
          width: 100%;
          transform: scaleX(0);
          transform-origin: left center;
        }
        .timeline-steps {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          position: relative;
          z-index: 2;
          width: 100%;
        }
        .timeline-step {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: 0 8px;
        }
        .step-circle {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          display: flex;
          justify-content: center;
          align-items: center;
          position: relative;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.04);
          border: 1.5px solid rgba(255, 255, 255, 0.8);
          background: #ffffff;
          transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.4s;
          margin-bottom: 12px;
        }
        .step-circle:hover {
          transform: scale(1.1) translateY(-2px);
          box-shadow: 0 8px 25px rgba(168, 85, 247, 0.15);
        }
        .step-num {
          position: absolute;
          top: -4px;
          right: -4px;
          width: 18px;
          height: 18px;
          background: #7c3aed;
          color: #ffffff;
          font-size: 0.65rem;
          font-weight: 800;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid #ffffff;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .step-icon {
          font-size: 1.3rem;
        }
        .step-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .step-heading {
          font-family: var(--font-serif);
          font-size: 0.88rem;
          font-weight: 700;
          color: #4c1d95;
        }
        .step-desc {
          font-size: 0.68rem;
          color: hsl(var(--text-muted));
          line-height: 1.35;
          max-width: 170px;
        }

        /* Step circle background colors */
        .bg-green {
          background: linear-gradient(135deg, rgba(52, 211, 153, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%);
          border-color: rgba(52, 211, 153, 0.35);
        }
        .bg-purple {
          background: linear-gradient(135deg, rgba(167, 139, 250, 0.1) 0%, rgba(124, 58, 237, 0.05) 100%);
          border-color: rgba(167, 139, 250, 0.35);
        }
        .bg-blue {
          background: linear-gradient(135deg, rgba(96, 165, 250, 0.1) 0%, rgba(37, 99, 213, 0.05) 100%);
          border-color: rgba(96, 165, 250, 0.35);
        }
        .bg-gold {
          background: linear-gradient(135deg, rgba(251, 146, 60, 0.1) 0%, rgba(234, 88, 12, 0.05) 100%);
          border-color: rgba(251, 146, 60, 0.35);
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
          .hero-title {
            font-size: 2.2rem;
          }
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
