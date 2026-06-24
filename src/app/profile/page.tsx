"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default function UserProfilePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Auth view mode: "login" or "signup"
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  
  // Session User
  const [sessionUser, setSessionUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState<any>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  // Tabs for logged-in view: "report" or "profile"
  const [activeTab, setActiveTab] = useState<"report" | "profile">("report");

  // Login Form States
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginSubmitting, setLoginSubmitting] = useState(false);

  // Signup Form States
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPhone, setSignupPhone] = useState("");
  const [signupGender, setSignupGender] = useState("Female");
  const [signupDob, setSignupDob] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupError, setSignupError] = useState("");
  const [signupSuccess, setSignupSuccess] = useState("");
  const [signupSubmitting, setSignupSubmitting] = useState(false);

  // Profile Edit States
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editGender, setEditGender] = useState("Female");
  const [editDob, setEditDob] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editError, setEditError] = useState("");
  const [editSuccess, setEditSuccess] = useState("");
  const [editSubmitting, setEditSubmitting] = useState(false);

  // Load session from localStorage on mount
  useEffect(() => {
    const session = window.localStorage.getItem("divingsanatan_user_session");
    if (session) {
      try {
        const parsed = JSON.parse(session);
        setSessionUser(parsed);
        loadFullProfile(parsed.id);
      } catch (e) {
        setSessionUser(null);
      }
    }
    setLoading(false);
  }, []);

  // Fetch full profile from API (includes quiz answers and reports)
  const loadFullProfile = async (id: string) => {
    try {
      setLoadingProfile(true);
      const res = await fetch(`/api/auth/profile?id=${id}`);
      const json = await res.json();
      if (json.success) {
        setProfileData(json.data);
        
        // Populate edit form states
        setEditName(json.data.name || "");
        setEditPhone(json.data.phone || "");
        setEditGender(json.data.gender || "Female");
        setEditDob(json.data.dob || "");
      } else {
        console.error("Failed to load profile details:", json.error);
      }
    } catch (err) {
      console.error("Error loading profile:", err);
    } finally {
      setLoadingProfile(false);
    }
  };

  // Handle Login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    
    if (!loginEmail.trim() || !loginPassword) {
      setLoginError("Please enter both email and password.");
      return;
    }

    try {
      setLoginSubmitting(true);
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password: loginPassword })
      });
      const json = await res.json();

      if (json.success) {
        window.localStorage.setItem("divingsanatan_user_session", JSON.stringify(json.data));
        setSessionUser(json.data);
        loadFullProfile(json.data.id);
        
        // Handle redirect parameter if exists
        const redirect = searchParams.get("redirect");
        if (redirect) {
          router.push(redirect);
        }
      } else {
        setLoginError(json.error || "Authentication failed.");
      }
    } catch (err) {
      setLoginError("Server connection failed. Please try again.");
    } finally {
      setLoginSubmitting(false);
    }
  };

  // Handle Signup
  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError("");
    setSignupSuccess("");

    if (!signupName.trim() || !signupEmail.trim() || !signupPhone.trim() || !signupDob || !signupPassword) {
      setSignupError("All fields are required to register.");
      return;
    }

    if (signupPassword.length < 6) {
      setSignupError("Password must be at least 6 characters long.");
      return;
    }

    try {
      setSignupSubmitting(true);
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: signupName,
          email: signupEmail,
          phone: signupPhone,
          gender: signupGender,
          dob: signupDob,
          password: signupPassword
        })
      });
      const json = await res.json();

      if (json.success) {
        setSignupSuccess(json.message || "Registration successful!");
        window.localStorage.setItem("divingsanatan_user_session", JSON.stringify(json.data));
        setSessionUser(json.data);
        loadFullProfile(json.data.id);
        
        // Clear inputs
        setSignupName("");
        setSignupEmail("");
        setSignupPhone("");
        setSignupDob("");
        setSignupPassword("");
        
        // Redirect if needed
        const redirect = searchParams.get("redirect");
        if (redirect) {
          setTimeout(() => router.push(redirect), 1500);
        }
      } else {
        setSignupError(json.error || "Failed to register.");
      }
    } catch (err) {
      setSignupError("Server connection failed. Please try again.");
    } finally {
      setSignupSubmitting(false);
    }
  };

  // Handle Profile Update
  const handleProfileUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditError("");
    setEditSuccess("");

    if (!editName.trim() || !editPhone.trim() || !editDob) {
      setEditError("Name, phone, and date of birth are required.");
      return;
    }

    try {
      setEditSubmitting(true);
      const payload: any = {
        profile_id: sessionUser.id,
        name: editName,
        phone: editPhone,
        gender: editGender,
        dob: editDob
      };

      if (editPassword) {
        if (editPassword.length < 6) {
          setEditError("New password must be at least 6 characters long.");
          setEditSubmitting(false);
          return;
        }
        payload.password = editPassword;
      }

      const res = await fetch("/api/auth/update-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const json = await res.json();

      if (json.success) {
        setEditSuccess("Profile details updated successfully!");
        setEditPassword("");
        
        // Update local session
        const updatedSession = { ...sessionUser, name: editName };
        window.localStorage.setItem("divingsanatan_user_session", JSON.stringify(updatedSession));
        setSessionUser(updatedSession);
        
        // Refresh full profile details
        loadFullProfile(sessionUser.id);
      } else {
        setEditError(json.error || "Failed to update profile details.");
      }
    } catch (err) {
      setEditError("Server connection failed. Please try again.");
    } finally {
      setEditSubmitting(false);
    }
  };

  // Handle Logout
  const handleLogout = () => {
    window.localStorage.removeItem("divingsanatan_user_session");
    setSessionUser(null);
    setProfileData(null);
    setLoginEmail("");
    setLoginPassword("");
    router.refresh();
  };

  // Helper: Format Date
  const formatDateString = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric"
      });
    } catch (e) {
      return dateStr;
    }
  };

  // Render Chakra Progress Row
  const renderChakraNode = (name: string, score: number, colorClass: string, meaning: string) => {
    return (
      <div className="chakra-node-row" key={name}>
        <div className="chakra-node-info">
          <span className={`chakra-dot-indicator ${colorClass}`}></span>
          <span className="chakra-node-name">{name}</span>
          <span className="chakra-node-percentage">{score}% Flow</span>
        </div>
        <div className="chakra-progress-bar-container">
          <div 
            className={`chakra-progress-bar-fill ${colorClass}`}
            style={{ width: `${score}%` }}
          />
        </div>
        <p className="chakra-node-meaning">{meaning}</p>
      </div>
    );
  };

  // Chakra meaning dictionary
  const getChakraMeaning = (name: string) => {
    const meanings: Record<string, string> = {
      Root: "Grounded security, physical health, fear and boundary protection.",
      Sacral: "Vitality, emotional stability, relationships, creative flow.",
      Solar: "Self-confidence, adrenal response, personal power, anxiety blocks.",
      Heart: "Compassion, emotional resilience, grief release, integration.",
      Throat: "Self-expression, somatic release pathways, speaking personal truth.",
      ThirdEye: "Clarity of mind, intuition, somatic insights, visioning.",
      Crown: "Spiritual connection, perspective, integration of higher awareness."
    };
    return meanings[name] || "";
  };

  return (
    <div className="profile-page-wrapper">
      <Header />

      <main className="profile-main-container">
        {loading ? (
          <div className="profile-loading-state">
            <p>Scanning somatic signatures...</p>
          </div>
        ) : !sessionUser ? (
          /* ================= GUEST VIEW (LOGIN/SIGNUP) ================= */
          <div className="auth-cards-section">
            <div className="auth-branding-intro">
              <h1 className="auth-intro-title">Your Portal to Healing</h1>
              <p className="auth-intro-subtitle">
                Access your personalized somatic reports, track your chakra flows, and sync details across the wellness directory.
              </p>
            </div>

            <Card variant="glass" className="auth-form-card">
              <div className="auth-tabs">
                <button 
                  className={`auth-tab-btn ${authMode === "login" ? "active" : ""}`}
                  onClick={() => {
                    setAuthMode("login");
                    setLoginError("");
                  }}
                >
                  Log In
                </button>
                <button 
                  className={`auth-tab-btn ${authMode === "signup" ? "active" : ""}`}
                  onClick={() => {
                    setAuthMode("signup");
                    setSignupError("");
                  }}
                >
                  Sign Up / Sync
                </button>
              </div>

              {authMode === "login" ? (
                /* Login Form */
                <form onSubmit={handleLoginSubmit} className="auth-form">
                  <h3 className="auth-section-title">Welcome Back</h3>
                  <p className="auth-section-desc">Log in to view your diagnostic files and comment on blogs.</p>
                  
                  {loginError && <div className="alert-message error">{loginError}</div>}

                  <div className="input-group">
                    <label htmlFor="login-email">Email Address</label>
                    <input 
                      id="login-email"
                      type="email" 
                      className="glass-input" 
                      placeholder="you@example.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div className="input-group">
                    <label htmlFor="login-password">Password</label>
                    <input 
                      id="login-password"
                      type="password" 
                      className="glass-input" 
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                    />
                  </div>

                  <Button variant="gold" type="submit" disabled={loginSubmitting} className="auth-submit-btn">
                    {loginSubmitting ? "Authenticating..." : "Access Profile"}
                  </Button>
                </form>
              ) : (
                /* Signup / Sync Form */
                <form onSubmit={handleSignupSubmit} className="auth-form">
                  <h3 className="auth-section-title">Claim & Sync Profile</h3>
                  <p className="auth-section-desc">
                    Register with the email you used during the quiz or booking to instantly pull your reports.
                  </p>
                  
                  {signupError && <div className="alert-message error">{signupError}</div>}
                  {signupSuccess && <div className="alert-message success">{signupSuccess}</div>}

                  <div className="form-row">
                    <div className="input-group">
                      <label htmlFor="signup-name">Full Name</label>
                      <input 
                        id="signup-name"
                        type="text" 
                        className="glass-input" 
                        placeholder="John Doe"
                        value={signupName}
                        onChange={(e) => setSignupName(e.target.value)}
                        required
                      />
                    </div>

                    <div className="input-group">
                      <label htmlFor="signup-email">Email Address</label>
                      <input 
                        id="signup-email"
                        type="email" 
                        className="glass-input" 
                        placeholder="you@example.com"
                        value={signupEmail}
                        onChange={(e) => setSignupEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="input-group">
                      <label htmlFor="signup-phone">Phone / WhatsApp</label>
                      <input 
                        id="signup-phone"
                        type="tel" 
                        className="glass-input" 
                        placeholder="+91 XXXXX XXXXX"
                        value={signupPhone}
                        onChange={(e) => setSignupPhone(e.target.value)}
                        required
                      />
                    </div>

                    <div className="input-group">
                      <label htmlFor="signup-gender">Gender</label>
                      <select 
                        id="signup-gender"
                        className="glass-input" 
                        value={signupGender}
                        onChange={(e) => setSignupGender(e.target.value)}
                      >
                        <option value="Female">Female</option>
                        <option value="Male">Male</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="input-group">
                      <label htmlFor="signup-dob">Date of Birth</label>
                      <input 
                        id="signup-dob"
                        type="date" 
                        className="glass-input" 
                        value={signupDob}
                        onChange={(e) => setSignupDob(e.target.value)}
                        required
                      />
                    </div>

                    <div className="input-group">
                      <label htmlFor="signup-password">Create Password</label>
                      <input 
                        id="signup-password"
                        type="password" 
                        className="glass-input" 
                        placeholder="Min 6 characters"
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <Button variant="gold" type="submit" disabled={signupSubmitting} className="auth-submit-btn">
                    {signupSubmitting ? "Creating & Syncing..." : "Activate & Sync Profile"}
                  </Button>
                </form>
              )}
            </Card>
          </div>
        ) : (
          /* ================= LOGGED-IN VIEW (DASHBOARD) ================= */
          <div className="dashboard-layout">
            
            {/* Left/Sidebar navigation */}
            <div className="dashboard-sidebar">
              <Card variant="glass" className="user-summary-card">
                <div className="user-avatar-badge">
                  <span>{sessionUser.name ? sessionUser.name.charAt(0).toUpperCase() : "U"}</span>
                </div>
                <h2 className="user-sidebar-name">{sessionUser.name}</h2>
                <span className="user-sidebar-email">{sessionUser.email}</span>
                
                <div className="dashboard-nav-menu">
                  <button 
                    className={`dash-nav-btn ${activeTab === "report" ? "active" : ""}`}
                    onClick={() => setActiveTab("report")}
                  >
                    <span>📜</span> My Soul Report
                  </button>
                  <button 
                    className={`dash-nav-btn ${activeTab === "profile" ? "active" : ""}`}
                    onClick={() => setActiveTab("profile")}
                  >
                    <span>⚙️</span> Manage Profile
                  </button>
                </div>

                <div className="sidebar-divider"></div>

                <button className="logout-button-btn" onClick={handleLogout}>
                  Log Out
                </button>
              </Card>
            </div>

            {/* Right/Content area */}
            <div className="dashboard-content-area">
              {loadingProfile ? (
                <div className="profile-loading-inner">
                  <p>Unfolding energetic record...</p>
                </div>
              ) : activeTab === "profile" ? (
                /* Edit Profile Tab */
                <Card variant="glass" className="dashboard-main-card">
                  <h2 className="dash-card-title">Profile Maintenance</h2>
                  <p className="dash-card-desc">Update your personal characteristics below. These parameters assist practitioners in aligning your therapy recommendations.</p>

                  <form onSubmit={handleProfileUpdateSubmit} className="profile-edit-form">
                    {editError && <div className="alert-message error">{editError}</div>}
                    {editSuccess && <div className="alert-message success">{editSuccess}</div>}

                    <div className="input-group disabled-group">
                      <label htmlFor="edit-email">Email Address (Locked)</label>
                      <input 
                        id="edit-email"
                        type="email" 
                        className="glass-input disabled" 
                        value={profileData?.email || sessionUser.email}
                        disabled
                      />
                      <span className="locked-tip">Email address is your unique system identifier and cannot be modified.</span>
                    </div>

                    <div className="form-row">
                      <div className="input-group">
                        <label htmlFor="edit-name">Full Name</label>
                        <input 
                          id="edit-name"
                          type="text" 
                          className="glass-input" 
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          required
                        />
                      </div>

                      <div className="input-group">
                        <label htmlFor="edit-phone">Phone / WhatsApp</label>
                        <input 
                          id="edit-phone"
                          type="tel" 
                          className="glass-input" 
                          value={editPhone}
                          onChange={(e) => setEditPhone(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="input-group">
                        <label htmlFor="edit-gender">Gender</label>
                        <select 
                          id="edit-gender"
                          className="glass-input" 
                          value={editGender}
                          onChange={(e) => setEditGender(e.target.value)}
                        >
                          <option value="Female">Female</option>
                          <option value="Male">Male</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>

                      <div className="input-group">
                        <label htmlFor="edit-dob">Date of Birth</label>
                        <input 
                          id="edit-dob"
                          type="date" 
                          className="glass-input" 
                          value={editDob}
                          onChange={(e) => setEditDob(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div className="input-group" style={{ marginTop: "16px" }}>
                      <label htmlFor="edit-password">Update Password (Optional)</label>
                      <input 
                        id="edit-password"
                        type="password" 
                        className="glass-input" 
                        placeholder="Leave blank to keep current password"
                        value={editPassword}
                        onChange={(e) => setEditPassword(e.target.value)}
                      />
                    </div>

                    <Button variant="gold" type="submit" disabled={editSubmitting} style={{ marginTop: "16px", width: "fit-content", alignSelf: "flex-end" }}>
                      {editSubmitting ? "Saving Changes..." : "Save Profile Details"}
                    </Button>
                  </form>
                </Card>
              ) : (
                /* Reports Tab */
                <div className="reports-tab-content" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                  
                  {/* Master Practitioner Report Card */}
                  <Card variant="glass" className="dashboard-main-card somatic-report-card">
                    <div className="report-header-badge">
                      <span>✨ PERSONALIZED ALIGNMENT SHEET</span>
                    </div>
                    
                    <h2 className="dash-card-title">Somatic Diagnosis & Recommendations</h2>
                    
                    <div className="report-meta-row">
                      <div className="meta-block">
                        <span className="meta-label">PATIENT</span>
                        <strong className="meta-value">{profileData?.name}</strong>
                      </div>
                      <div className="meta-block">
                        <span className="meta-label">FOCUS BLOCKAGE</span>
                        <strong className="meta-value text-highlight">{profileData?.category || "Stress"}</strong>
                      </div>
                      <div className="meta-block">
                        <span className="meta-label">RECORD DATE</span>
                        <strong className="meta-value">{profileData ? formatDateString(profileData.created_at) : "Pending"}</strong>
                      </div>
                    </div>

                    <div className="report-divider"></div>

                    {profileData?.report_sent && profileData?.report_content ? (
                      <div className="report-practitioner-block">
                        <h4 className="report-sub-title">Practitioner Analysis & Guidance</h4>
                        <div className="report-text-render">
                          {profileData.report_content.split("\n").map((line: string, i: number) => (
                            <p key={i} className="report-text-paragraph">{line}</p>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="pending-report-view">
                        <div className="pending-indicator-icon">🌀</div>
                        <h4>Aura Diagnostic Scan in Progress</h4>
                        <p>
                          Our practitioners are currently mapping your emotional responses and analyzing your bio-energy nodes.
                          A detailed, custom-tailored recommendation guide will appear here shortly. In the meantime, see your initial chakra calculations below.
                        </p>
                      </div>
                    )}
                  </Card>

                  {/* Chakra Flow Alignment Card */}
                  <Card variant="glass" className="dashboard-main-card">
                    <h3 className="dash-card-title" style={{ fontSize: "1.4rem" }}>Your Chakra Aura Alignment</h3>
                    <p className="dash-card-desc">Calculated flow capacity based on somatic response questions. Levels below 50% indicate blockages or energetic congestions.</p>

                    <div className="chakra-nodes-grid" style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "24px" }}>
                      {profileData?.chakra_scores ? (
                        Object.keys(profileData.chakra_scores).map((chakra) => {
                          const score = profileData.chakra_scores[chakra];
                          const colorClass = `chakra-${chakra.toLowerCase()}`;
                          const meaning = getChakraMeaning(chakra);
                          return renderChakraNode(chakra, score, colorClass, meaning);
                        })
                      ) : (
                        // Fallbacks if no score calculated
                        <>
                          {renderChakraNode("Crown", 80, "chakra-crown", getChakraMeaning("Crown"))}
                          {renderChakraNode("ThirdEye", 75, "chakra-thirdeye", getChakraMeaning("ThirdEye"))}
                          {renderChakraNode("Throat", 70, "chakra-throat", getChakraMeaning("Throat"))}
                          {renderChakraNode("Heart", 85, "chakra-heart", getChakraMeaning("Heart"))}
                          {renderChakraNode("Solar", 70, "chakra-solar", getChakraMeaning("Solar"))}
                          {renderChakraNode("Sacral", 75, "chakra-sacral", getChakraMeaning("Sacral"))}
                          {renderChakraNode("Root", 80, "chakra-root", getChakraMeaning("Root"))}
                        </>
                      )}
                    </div>
                  </Card>

                  {/* Quiz Answers Card */}
                  <Card variant="glass" className="dashboard-main-card">
                    <h3 className="dash-card-title" style={{ fontSize: "1.4rem" }}>Submitted Somatic Responses</h3>
                    <p className="dash-card-desc">The answers you logged during your emotional diagnostic check.</p>

                    <div className="submitted-answers-list" style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "20px" }}>
                      {profileData?.user_answers && profileData.user_answers.length > 0 ? (
                        profileData.user_answers.map((ans: any, idx: number) => (
                          <div key={ans.id} className="user-qa-block" style={{ paddingBottom: "12px", borderBottom: "1.5px solid rgba(0,0,0,0.03)" }}>
                            <h4 style={{ fontSize: "0.95rem", color: "#4c1d95", fontWeight: "600" }}>
                              <span style={{ color: "#7c3aed" }}>Q{idx + 1}: </span> {ans.question_text}
                            </h4>
                            <p style={{ fontSize: "0.9rem", color: "#475569", marginTop: "6px" }}>
                              <strong>Your Answer:</strong> {ans.answer_text}
                            </p>
                          </div>
                        ))
                      ) : (
                        <p style={{ fontStyle: "italic", color: "#94a3b8" }}>No quiz logs found for this profile. Complete a home page diagnostic to populate answers.</p>
                      )}
                    </div>
                  </Card>
                </div>
              )}
            </div>

          </div>
        )}
      </main>

      <Footer />

      <style jsx>{`
        .profile-page-wrapper {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          background: transparent;
        }
        .profile-main-container {
          flex: 1;
          max-width: 1200px;
          width: 100%;
          margin: 0 auto;
          padding: 48px 24px;
        }
        .profile-loading-state {
          padding: 120px 0;
          text-align: center;
          color: #7c3aed;
          font-family: var(--font-serif);
          font-size: 1.4rem;
        }

        /* Auth View Styling */
        .auth-cards-section {
          max-width: 650px;
          margin: 40px auto 0;
          display: flex;
          flex-direction: column;
          gap: 32px;
        }
        .auth-branding-intro {
          text-align: center;
        }
        .auth-intro-title {
          font-size: 2.5rem;
          color: #4c1d95;
          margin-bottom: 8px;
        }
        .auth-intro-subtitle {
          color: #475569;
          font-size: 1.05rem;
          line-height: 1.6;
        }
        .auth-form-card {
          padding: 36px !important;
          border-radius: 28px !important;
          box-shadow: 0 16px 50px rgba(124, 58, 237, 0.06) !important;
        }
        .auth-tabs {
          display: grid;
          grid-template-columns: 1fr 1fr;
          background: rgba(0, 0, 0, 0.03);
          border-radius: 14px;
          padding: 4px;
          margin-bottom: 28px;
          border: 1px solid rgba(0, 0, 0, 0.04);
        }
        .auth-tab-btn {
          background: transparent;
          border: none;
          padding: 12px;
          font-size: 0.9rem;
          font-weight: 600;
          color: #475569;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .auth-tab-btn.active {
          background: #ffffff;
          color: #7c3aed;
          box-shadow: 0 4px 12px rgba(124, 58, 237, 0.12);
        }
        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .auth-section-title {
          font-size: 1.5rem;
          color: #1e1b4b;
          font-weight: 700;
        }
        .auth-section-desc {
          font-size: 0.88rem;
          color: #64748b;
          margin-top: -12px;
          margin-bottom: 8px;
        }
        .input-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .input-group label {
          font-size: 0.8rem;
          text-transform: uppercase;
          font-weight: 700;
          color: #475569;
          letter-spacing: 0.03em;
        }
        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }
        .auth-submit-btn {
          margin-top: 10px;
          padding: 14px !important;
          font-size: 0.95rem !important;
          border-radius: 12px !important;
        }
        .alert-message {
          padding: 12px 16px;
          border-radius: 10px;
          font-size: 0.9rem;
          font-weight: 600;
        }
        .alert-message.error {
          background: rgba(239, 68, 68, 0.08);
          border: 1px solid rgba(239, 68, 68, 0.2);
          color: #b91c1c;
        }
        .alert-message.success {
          background: rgba(34, 197, 94, 0.08);
          border: 1px solid rgba(34, 197, 94, 0.2);
          color: #15803d;
        }

        /* Dashboard View Styling */
        .dashboard-layout {
          display: grid;
          grid-template-columns: 280px 1fr;
          gap: 32px;
          margin-top: 24px;
        }
        .user-summary-card {
          padding: 24px !important;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }
        .user-avatar-badge {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: linear-gradient(135deg, #e9d5ff 0%, #c7d2fe 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: var(--font-serif);
          font-size: 2.2rem;
          color: #4c1d95;
          font-weight: 700;
          border: 2px solid var(--gold-border);
          box-shadow: 0 8px 24px rgba(168, 85, 247, 0.1);
          margin-bottom: 16px;
        }
        .user-sidebar-name {
          font-size: 1.4rem;
          color: #1e1b4b;
          margin-bottom: 4px;
        }
        .user-sidebar-email {
          font-size: 0.85rem;
          color: #64748b;
          margin-bottom: 24px;
        }
        .dashboard-nav-menu {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .dash-nav-btn {
          width: 100%;
          background: transparent;
          border: none;
          padding: 12px 16px;
          text-align: left;
          font-size: 0.9rem;
          font-weight: 600;
          color: #475569;
          border-radius: 10px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 12px;
          transition: all 0.2s ease;
        }
        .dash-nav-btn:hover {
          background: rgba(0, 0, 0, 0.02);
          color: #1e293b;
        }
        .dash-nav-btn.active {
          background: rgba(168, 85, 247, 0.08);
          color: #6d28d9;
        }
        .sidebar-divider {
          width: 100%;
          height: 1.5px;
          background: rgba(0, 0, 0, 0.05);
          margin: 20px 0;
        }
        .logout-button-btn {
          width: 100%;
          background: transparent;
          border: 1px solid rgba(239, 68, 68, 0.2);
          color: #dc2626;
          padding: 10px;
          border-radius: 10px;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .logout-button-btn:hover {
          background: rgba(239, 68, 68, 0.05);
          border-color: rgba(239, 68, 68, 0.3);
        }

        /* Content Area Styling */
        .dashboard-main-card {
          padding: 32px !important;
          margin-bottom: 24px;
        }
        .dash-card-title {
          font-size: 1.6rem;
          color: #4c1d95;
          margin-bottom: 8px;
        }
        .dash-card-desc {
          color: #64748b;
          font-size: 0.9rem;
          line-height: 1.5;
          margin-bottom: 24px;
        }
        .profile-edit-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .disabled-group label {
          color: #94a3b8;
        }
        .glass-input.disabled {
          background: rgba(0, 0, 0, 0.04);
          border-color: rgba(0, 0, 0, 0.05);
          color: #64748b;
          cursor: not-allowed;
        }
        .locked-tip {
          font-size: 0.72rem;
          color: #94a3b8;
          margin-top: -4px;
        }
        .profile-loading-inner {
          padding: 80px 0;
          text-align: center;
          color: #64748b;
          font-style: italic;
        }

        /* Somatic Report View */
        .somatic-report-card {
          position: relative;
        }
        .report-header-badge {
          display: inline-block;
          background: rgba(168, 85, 247, 0.08);
          border: 1px solid rgba(168, 85, 247, 0.2);
          color: #6d28d9;
          font-size: 0.7rem;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: 6px;
          letter-spacing: 0.05em;
          margin-bottom: 12px;
        }
        .report-meta-row {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          margin-top: 16px;
        }
        .meta-block {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .meta-label {
          font-size: 0.72rem;
          color: #94a3b8;
          text-transform: uppercase;
          font-weight: 600;
          letter-spacing: 0.03em;
        }
        .meta-value {
          font-size: 1rem;
          color: #334155;
        }
        .meta-value.text-highlight {
          color: #6d28d9;
        }
        .report-divider {
          height: 1.5px;
          background: rgba(168, 85, 247, 0.12);
          margin: 24px 0;
        }
        .report-sub-title {
          font-size: 1.15rem;
          color: #1e1b4b;
          margin-bottom: 16px;
          font-weight: 700;
        }
        .report-text-render {
          display: flex;
          flex-direction: column;
          gap: 16px;
          background: rgba(255, 255, 255, 0.6);
          border: 1px solid rgba(168, 85, 247, 0.1);
          padding: 24px;
          border-radius: 16px;
        }
        .report-text-paragraph {
          font-size: 0.98rem;
          line-height: 1.8;
          color: #334155 !important;
        }
        .pending-report-view {
          text-align: center;
          padding: 40px 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }
        .pending-indicator-icon {
          font-size: 2.5rem;
          animation: spin 3s infinite linear;
          color: #a855f7;
        }
        @keyframes spin {
          100% { transform: rotate(360deg); }
        }
        .pending-report-view h4 {
          font-size: 1.25rem;
          color: #4c1d95;
        }
        .pending-report-view p {
          max-width: 480px;
          font-size: 0.88rem;
          color: #64748b;
          line-height: 1.6;
        }

        /* Chakra Visualizer node row */
        .chakra-node-row {
          background: rgba(255, 255, 255, 0.4);
          border: 1px solid rgba(0, 0, 0, 0.03);
          border-radius: 16px;
          padding: 16px 20px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .chakra-node-info {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .chakra-dot-indicator {
          width: 10px;
          height: 10px;
          border-radius: 50%;
        }
        .chakra-node-name {
          font-size: 0.98rem;
          font-weight: 700;
          color: #1e1b4b;
        }
        .chakra-node-percentage {
          font-size: 0.82rem;
          font-weight: 700;
          color: #6d28d9;
          background: rgba(168, 85, 247, 0.06);
          padding: 2px 8px;
          border-radius: 6px;
          margin-left: auto;
        }
        .chakra-progress-bar-container {
          width: 100%;
          height: 8px;
          background: rgba(0, 0, 0, 0.04);
          border-radius: 99px;
          overflow: hidden;
        }
        .chakra-progress-bar-fill {
          height: 100%;
          border-radius: 99px;
          transition: width 1s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .chakra-node-meaning {
          font-size: 0.82rem;
          color: #64748b;
          line-height: 1.5;
          margin: 0 !important;
        }

        @media (max-width: 900px) {
          .dashboard-layout {
            grid-template-columns: 1fr;
          }
          .dashboard-sidebar {
            width: 100%;
          }
        }
        @media (max-width: 600px) {
          .profile-main-container {
            padding: 24px 16px;
          }
          .auth-intro-title {
            font-size: 1.8rem;
          }
          .auth-form-card {
            padding: 20px !important;
          }
          .form-row {
            grid-template-columns: 1fr;
            gap: 12px;
          }
          .report-meta-row {
            grid-template-columns: 1fr;
            gap: 12px;
          }
        }
      `}</style>
    </div>
  );
}
