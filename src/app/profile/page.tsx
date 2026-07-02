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

  // Auth method selection: "none" (choice screen) or "email" (input form)
  const [authMethodSelection, setAuthMethodSelection] = useState<"none" | "email">("none");

  // Google User Auth states
  const [googleUser, setGoogleUser] = useState<{ email: string; name: string } | null>(null);
  const [isGoogleSignUpStep2, setIsGoogleSignUpStep2] = useState(false);
  const [signUpStep, setSignUpStep] = useState<number>(1);

  // Mock Google Modal states
  const [showMockGoogleModal, setShowMockGoogleModal] = useState(false);
  const [mockCustomEmail, setMockCustomEmail] = useState("");
  const [mockCustomName, setMockCustomName] = useState("");
  const [showCustomMockInput, setShowCustomMockInput] = useState(false);

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

  // Dynamically load Google Identity Services client script
  useEffect(() => {
    if (typeof window !== "undefined") {
      const scriptId = "google-gsi-client";
      if (!document.getElementById(scriptId)) {
        const script = document.createElement("script");
        script.id = scriptId;
        script.src = "https://accounts.google.com/gsi/client";
        script.async = true;
        script.defer = true;
        document.body.appendChild(script);
      }
    }
  }, []);

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

  // Handle Google authentication button click
  const handleGoogleButtonClick = () => {
    setLoginError("");
    setSignupError("");
    
    const clientID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (typeof window !== "undefined" && (window as any).google && clientID) {
      try {
        const client = (window as any).google.accounts.oauth2.initTokenClient({
          client_id: clientID,
          scope: "https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email",
          callback: async (tokenResponse: any) => {
            if (tokenResponse && tokenResponse.access_token) {
              try {
                const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
                  headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
                });
                const userInfo = await userInfoRes.json();
                if (userInfo.email) {
                  handleGoogleAuthSuccess(userInfo.email, userInfo.name || userInfo.given_name || "Google User");
                } else {
                  setLoginError("Could not retrieve email from Google account.");
                }
              } catch (err) {
                setLoginError("Failed to fetch Google profile details.");
              }
            }
          }
        });
        client.requestAccessToken();
      } catch (err: any) {
        console.error("Google Client Init Error:", err);
        setShowMockGoogleModal(true);
      }
    } else {
      setShowMockGoogleModal(true);
    }
  };

  // Process successful Google sign-in (either login directly or redirect to Step 2)
  const handleGoogleAuthSuccess = async (email: string, name: string) => {
    setLoginError("");
    setSignupError("");

    try {
      const res = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, action: "login" })
      });
      const json = await res.json();

      if (json.success) {
        if (json.exists) {
          // User exists, log them in immediately
          window.localStorage.setItem("divingsanatan_user_session", JSON.stringify(json.data));
          setSessionUser(json.data);
          loadFullProfile(json.data.id);
          
          // Clear views
          setAuthMethodSelection("none");
          setIsGoogleSignUpStep2(false);
          setGoogleUser(null);

          const redirect = searchParams.get("redirect");
          if (redirect) {
            router.push(redirect);
          }
        } else {
          // User does not exist, redirect to Step 2 details registration
          setGoogleUser({ email, name });
          setIsGoogleSignUpStep2(true);
          setAuthMode("signup");
        }
      } else {
        setLoginError(json.error || "Google authentication failed.");
        setSignupError(json.error || "Google authentication failed.");
      }
    } catch (err) {
      setLoginError("Server connection failed. Please try again.");
      setSignupError("Server connection failed. Please try again.");
    }
  };

  // Handle Google Step 2 Submit
  const handleGoogleSignUpStep2Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError("");
    setSignupSuccess("");

    if (!signupPhone.trim() || !signupDob) {
      setSignupError("Phone number and Date of Birth are required.");
      return;
    }

    if (!googleUser) {
      setSignupError("Google session expired. Please start over.");
      return;
    }

    try {
      setSignupSubmitting(true);
      const res = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: googleUser.email,
          name: googleUser.name,
          phone: signupPhone,
          gender: signupGender,
          dob: signupDob,
          action: "signup"
        })
      });
      const json = await res.json();

      if (json.success) {
        setSignupSuccess(json.message || "Registration completed successfully!");
        window.localStorage.setItem("divingsanatan_user_session", JSON.stringify(json.data));
        setSessionUser(json.data);
        loadFullProfile(json.data.id);

        // Clear states
        setIsGoogleSignUpStep2(false);
        setGoogleUser(null);
        setSignupPhone("");
        setSignupDob("");
        setAuthMethodSelection("none");

        const redirect = searchParams.get("redirect");
        if (redirect) {
          setTimeout(() => router.push(redirect), 1500);
        }
      } else {
        setSignupError(json.error || "Failed to complete registration.");
      }
    } catch (err) {
      setSignupError("Server connection failed. Please try again.");
    } finally {
      setSignupSubmitting(false);
    }
  };

  // Transition Email registration from Step 1 to Step 2
  const handleEmailSignUpNext = (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError("");
    
    if (!signupName.trim() || !signupEmail.trim() || !signupPassword) {
      setSignupError("Name, email, and password are required.");
      return;
    }

    if (signupPassword.length < 6) {
      setSignupError("Password must be at least 6 characters long.");
      return;
    }

    setSignUpStep(2);
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
        setSignUpStep(1);
        setAuthMethodSelection("none");

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
            ref={(el) => {
              if (el) el.style.setProperty("--progress", `${score}%`);
            }}
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

            <Card variant="glass" className="auth-form-card relative-card">
              {isGoogleSignUpStep2 ? (
                /* Google Sign Up Step 2 Form */
                <form onSubmit={handleGoogleSignUpStep2Submit} className="auth-form">
                  <div className="sparkle-container">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="sparkle-icon-svg">
                      <path d="M12 2L14.85 9.15L22 12L14.85 14.85L12 22L9.15 14.85L2 12L9.15 9.15L12 2Z" fill="#7c3aed"/>
                    </svg>
                  </div>
                  <h3 className="auth-section-title">Complete Your Profile</h3>
                  <p className="auth-section-desc">
                    Provide a few details to finalize setting up your account.
                  </p>

                  {signupError && <div className="alert-message error">{signupError}</div>}
                  {signupSuccess && <div className="alert-message success">{signupSuccess}</div>}

                  <div className="form-row">
                    <div className="input-group disabled-group">
                      <label htmlFor="google-signup-name">Full Name</label>
                      <input
                        id="google-signup-name"
                        type="text"
                        className="glass-input disabled"
                        value={googleUser?.name || ""}
                        disabled
                      />
                    </div>

                    <div className="input-group disabled-group">
                      <label htmlFor="google-signup-email">Email Address</label>
                      <input
                        id="google-signup-email"
                        type="email"
                        className="glass-input disabled"
                        value={googleUser?.email || ""}
                        disabled
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="input-group">
                      <label htmlFor="google-signup-phone">Phone / WhatsApp</label>
                      <input
                        id="google-signup-phone"
                        type="tel"
                        className="glass-input"
                        placeholder="+91 XXXXX XXXXX"
                        value={signupPhone}
                        onChange={(e) => setSignupPhone(e.target.value)}
                        required
                      />
                    </div>

                    <div className="input-group">
                      <label htmlFor="google-signup-gender">Gender</label>
                      <select
                        id="google-signup-gender"
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
                    <div className="input-group full-width-group">
                      <label htmlFor="google-signup-dob">Date of Birth</label>
                      <input
                        id="google-signup-dob"
                        type="date"
                        className="glass-input"
                        value={signupDob}
                        onChange={(e) => setSignupDob(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <Button variant="gold" type="submit" disabled={signupSubmitting} className="auth-submit-btn">
                    {signupSubmitting ? "Completing Registration..." : "Complete Registration"}
                  </Button>

                  <div className="auth-footer-text">
                    <span className="toggle-auth-link" onClick={() => {
                      setIsGoogleSignUpStep2(false);
                      setGoogleUser(null);
                      setAuthMethodSelection("none");
                      setSignupError("");
                    }}>
                      Cancel and go back
                    </span>
                  </div>
                </form>
              ) : authMethodSelection === "none" ? (
                /* Choice Screen (Mockup Style) */
                <div className="auth-choice-container">
                  <div className="sparkle-container">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="sparkle-icon-svg">
                      <path d="M12 2L14.85 9.15L22 12L14.85 14.85L12 22L9.15 14.85L2 12L9.15 9.15L12 2Z" fill="#7c3aed"/>
                    </svg>
                  </div>
                  
                  <h2 className="choice-title">Welcome to Diving Sanatan</h2>
                  <p className="choice-subtitle">Begin your journey to inner peace and holistic well-being.</p>

                  {loginError && <div className="alert-message error" style={{ marginBottom: "16px" }}>{loginError}</div>}
                  {signupError && <div className="alert-message error" style={{ marginBottom: "16px" }}>{signupError}</div>}

                  <div className="choice-buttons-stack">
                    <button className="auth-provider-btn google" onClick={handleGoogleButtonClick}>
                      <svg className="provider-icon google-svg" width="20" height="20" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                      </svg>
                      <span>Continue with Google</span>
                    </button>

                    <div className="auth-divider">
                      <span className="divider-line"></span>
                      <span className="divider-text">or</span>
                      <span className="divider-line"></span>
                    </div>

                    <button className="auth-provider-btn email" onClick={() => setAuthMethodSelection("email")}>
                      <svg className="provider-icon mail-svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                        <polyline points="22,6 12,13 2,6"/>
                      </svg>
                      <span>Continue with Email</span>
                    </button>
                  </div>

                  <div className="auth-footer-text">
                    {authMode === "login" ? (
                      <>
                        Don't have an account?{" "}
                        <span className="toggle-auth-link" onClick={() => { setAuthMode("signup"); setLoginError(""); setSignupError(""); }}>
                          Sign up
                        </span>
                      </>
                    ) : (
                      <>
                        Already have an account?{" "}
                        <span className="toggle-auth-link" onClick={() => { setAuthMode("login"); setLoginError(""); setSignupError(""); }}>
                          Log in
                        </span>
                      </>
                    )}
                  </div>
                </div>
              ) : (
                /* Email Forms (Login or Multi-step Signup) */
                <div className="auth-email-form-container">
                  <button className="auth-back-btn" onClick={() => { setAuthMethodSelection("none"); setSignUpStep(1); setLoginError(""); setSignupError(""); }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="back-arrow-svg">
                      <line x1="19" y1="12" x2="5" y2="12"></line>
                      <polyline points="12 19 5 12 12 5"></polyline>
                    </svg>
                    <span>Back</span>
                  </button>

                  {authMode === "login" ? (
                    /* Login Form */
                    <form onSubmit={handleLoginSubmit} className="auth-form">
                      <h3 className="auth-section-title">Welcome Back</h3>
                      <p className="auth-section-desc">Log in with your credentials to view your somatic dashboard.</p>

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
                    /* Multi-step Signup Form */
                    <form onSubmit={signUpStep === 1 ? handleEmailSignUpNext : handleSignupSubmit} className="auth-form">
                      <h3 className="auth-section-title">Claim & Sync Profile</h3>
                      <p className="auth-section-desc">
                        {signUpStep === 1 
                          ? "Step 1: Set up your account credentials." 
                          : "Step 2: Provide contact details to sync reports."
                        }
                      </p>

                      {signupError && <div className="alert-message error">{signupError}</div>}
                      {signupSuccess && <div className="alert-message success">{signupSuccess}</div>}

                      {signUpStep === 1 ? (
                        /* Step 1 Fields */
                        <>
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

                          <Button variant="gold" type="submit" className="auth-submit-btn">
                            Next Step
                          </Button>
                        </>
                      ) : (
                        /* Step 2 Fields */
                        <>
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

                          <div className="multi-step-actions" style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "12px", marginTop: "10px" }}>
                            <Button variant="gold-outline" type="button" onClick={() => setSignUpStep(1)}>
                              Back
                            </Button>
                            <Button variant="gold" type="submit" disabled={signupSubmitting}>
                              {signupSubmitting ? "Creating Profile..." : "Create Account"}
                            </Button>
                          </div>
                        </>
                      )}
                    </form>
                  )}
                </div>
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

                    <div className="input-group input-group-mt-16">
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

                    <Button variant="gold" type="submit" disabled={editSubmitting} >
                      {editSubmitting ? "Saving Changes..." : "Save Profile Details"}
                    </Button>
                  </form>
                </Card>
              ) : (
                /* Reports Tab */
                <div className="reports-tab-content reports-tab-stack">


                </div>
              )}
            </div>

          </div>
        )}
      </main>

      <Footer />

      {/* Mock Google Login Modal */}
      {showMockGoogleModal && (
        <div className="mock-google-modal-overlay">
          <div className="mock-google-modal-card">
            <div className="mock-google-header">
              <svg width="32" height="32" viewBox="0 0 24 24" className="mock-g-logo">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
              </svg>
              <h2>Sign in with Google</h2>
              <p>Choose an account to continue to <strong>Diving Sanatan</strong></p>
            </div>
            
            <div className="mock-google-accounts-list">
              <button className="mock-google-account-item" onClick={() => {
                setShowMockGoogleModal(false);
                handleGoogleAuthSuccess("aura.weaver@gmail.com", "Aura Weaver");
              }}>
                <div className="mock-avatar">AW</div>
                <div className="mock-account-details">
                  <span className="mock-account-name">Aura Weaver</span>
                  <span className="mock-account-email">aura.weaver@gmail.com</span>
                </div>
              </button>

              <button className="mock-google-account-item" onClick={() => {
                setShowMockGoogleModal(false);
                handleGoogleAuthSuccess("somatic.traveler@gmail.com", "Somatic Traveler");
              }}>
                <div className="mock-avatar">ST</div>
                <div className="mock-account-details">
                  <span className="mock-account-name">Somatic Traveler</span>
                  <span className="mock-account-email">somatic.traveler@gmail.com</span>
                </div>
              </button>

              {showCustomMockInput ? (
                <div className="mock-custom-form">
                  <input 
                    type="text" 
                    placeholder="Full Name" 
                    value={mockCustomName}
                    onChange={(e) => setMockCustomName(e.target.value)}
                    className="mock-custom-input"
                  />
                  <input 
                    type="email" 
                    placeholder="Email Address" 
                    value={mockCustomEmail}
                    onChange={(e) => setMockCustomEmail(e.target.value)}
                    className="mock-custom-input"
                  />
                  <div className="mock-custom-form-actions">
                    <button className="mock-google-btn-submit" type="button" onClick={() => {
                      if (!mockCustomName || !mockCustomEmail) return;
                      setShowMockGoogleModal(false);
                      handleGoogleAuthSuccess(mockCustomEmail, mockCustomName);
                      setMockCustomEmail("");
                      setMockCustomName("");
                      setShowCustomMockInput(false);
                    }}>
                      Sign In
                    </button>
                    <button className="mock-google-btn-cancel" type="button" onClick={() => setShowCustomMockInput(false)}>
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button className="mock-google-account-item custom" onClick={() => setShowCustomMockInput(true)}>
                  <div className="mock-avatar">+</div>
                  <div className="mock-account-details">
                    <span className="mock-account-name">Use another account</span>
                    <span className="mock-account-email">Test with a custom email</span>
                  </div>
                </button>
              )}
            </div>

            <div className="mock-google-footer">
              <span>To log in with a real Google account, configure <code>NEXT_PUBLIC_GOOGLE_CLIENT_ID</code> in your <code>.env.local</code> file.</span>
              <button className="mock-google-close-btn" type="button" onClick={() => {
                setShowMockGoogleModal(false);
                setShowCustomMockInput(false);
              }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

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
          max-width: 480px;
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
          width: var(--progress, 0%);
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

        /* Sparkle Icon */
        .sparkle-container {
          display: flex;
          justify-content: center;
          align-items: center;
          margin-bottom: 16px;
        }
        .sparkle-icon-svg {
          filter: drop-shadow(0 0 8px rgba(124, 58, 237, 0.3));
          animation: pulseSparkle 2s infinite ease-in-out;
        }
        @keyframes pulseSparkle {
          0%, 100% { transform: scale(1); opacity: 0.9; }
          50% { transform: scale(1.15); opacity: 1; }
        }

        /* Choice Screen Styling */
        .auth-choice-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: 12px 8px;
        }
        .choice-title {
          font-family: var(--font-serif);
          font-size: 1.85rem;
          font-weight: 700;
          color: #1e1b4b;
          margin-bottom: 8px;
        }
        .choice-subtitle {
          font-size: 0.95rem;
          color: #475569;
          margin-bottom: 32px;
          line-height: 1.5;
        }
        .choice-buttons-stack {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-bottom: 24px;
        }
        .auth-provider-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          background: #ffffff;
          border: 1px solid #cbd5e1;
          color: #334155;
          padding: 14px 20px;
          border-radius: 12px;
          font-size: 0.95rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
        }
        .auth-provider-btn:hover {
          background: #f8fafc;
          border-color: #94a3b8;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
        }
        .auth-provider-btn:active {
          transform: translateY(0);
        }
        .provider-icon {
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .provider-icon.mail-svg {
          color: #7c3aed;
        }

        /* Divider */
        .auth-divider {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 16px;
          width: 100%;
          margin: 4px 0;
        }
        .divider-line {
          flex: 1;
          height: 1px;
          background: #e2e8f0;
        }
        .divider-text {
          font-size: 0.85rem;
          color: #94a3b8;
          font-weight: 500;
          text-transform: lowercase;
        }

        /* Back Button */
        .auth-back-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          background: transparent;
          border: none;
          color: #64748b;
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          padding: 6px 12px;
          margin-left: -12px;
          margin-bottom: 12px;
          border-radius: 8px;
          width: fit-content;
          transition: all 0.2s ease;
        }
        .auth-back-btn:hover {
          color: #4c1d95;
          background: rgba(124, 58, 237, 0.05);
        }
        .back-arrow-svg {
          transition: transform 0.2s ease;
        }
        .auth-back-btn:hover .back-arrow-svg {
          transform: translateX(-3px);
        }

        /* Relative Card position */
        .relative-card {
          position: relative;
        }

        /* Auth Footer Text Toggle */
        .auth-footer-text {
          font-size: 0.9rem;
          color: #64748b;
          margin-top: 16px;
          text-align: center;
        }
        .toggle-auth-link {
          color: #7c3aed;
          font-weight: 700;
          cursor: pointer;
          transition: color 0.2s ease;
          text-decoration: none;
        }
        .toggle-auth-link:hover {
          color: #5b21b6;
          text-decoration: underline;
        }

        /* Google Step-2 specific styling */
        .full-width-group {
          grid-column: 1 / -1;
        }

        /* Mock Google Modal Overlay */
        .mock-google-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(4px);
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }
        .mock-google-modal-card {
          background: #ffffff;
          width: 100%;
          max-width: 440px;
          border-radius: 20px;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.8);
          padding: 32px;
          display: flex;
          flex-direction: column;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        }
        .mock-google-header {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          margin-bottom: 24px;
        }
        .mock-g-logo {
          margin-bottom: 16px;
        }
        .mock-google-header h2 {
          font-size: 1.35rem;
          color: #202124;
          font-weight: 500;
          margin: 0 0 8px 0;
        }
        .mock-google-header p {
          font-size: 0.9rem;
          color: #5f6368;
          margin: 0;
        }
        .mock-google-accounts-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-bottom: 24px;
        }
        .mock-google-account-item {
          display: flex;
          align-items: center;
          gap: 12px;
          width: 100%;
          padding: 12px 16px;
          background: transparent;
          border: 1px solid #dadce0;
          border-radius: 8px;
          cursor: pointer;
          text-align: left;
          transition: all 0.2s ease;
        }
        .mock-google-account-item:hover {
          background: #f7f9fa;
          border-color: #d2d4d7;
        }
        .mock-google-account-item.custom {
          border-style: dashed;
        }
        .mock-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: #e8f0fe;
          color: #1a73e8;
          font-weight: 600;
          font-size: 0.9rem;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .mock-google-account-item.custom .mock-avatar {
          background: #f1f3f4;
          color: #5f6368;
        }
        .mock-account-details {
          display: flex;
          flex-direction: column;
        }
        .mock-account-name {
          font-size: 0.9rem;
          font-weight: 600;
          color: #3c4043;
        }
        .mock-account-email {
          font-size: 0.78rem;
          color: #5f6368;
        }
        .mock-google-footer {
          font-size: 0.72rem;
          color: #70757a;
          line-height: 1.4;
          display: flex;
          flex-direction: column;
          gap: 16px;
          border-top: 1px solid #f1f3f4;
          padding-top: 16px;
        }
        .mock-google-footer code {
          background: #f1f3f4;
          padding: 2px 4px;
          border-radius: 4px;
          color: #d93025;
        }
        .mock-google-close-btn {
          align-self: flex-end;
          background: #1a73e8;
          color: #ffffff;
          border: none;
          padding: 8px 24px;
          border-radius: 4px;
          font-weight: 500;
          font-size: 0.85rem;
          cursor: pointer;
          transition: background 0.2s ease;
        }
        .mock-google-close-btn:hover {
          background: #1557b0;
        }

        /* Mock Custom Form */
        .mock-custom-form {
          display: flex;
          flex-direction: column;
          gap: 10px;
          border: 1px dashed #1a73e8;
          padding: 16px;
          border-radius: 8px;
          background: #f8faff;
        }
        .mock-custom-input {
          padding: 10px 12px;
          border: 1px solid #dadce0;
          border-radius: 6px;
          font-size: 0.9rem;
          outline: none;
          background: #ffffff;
          color: #334155;
        }
        .mock-custom-input:focus {
          border-color: #1a73e8;
          box-shadow: 0 0 0 2px rgba(26, 115, 232, 0.15);
        }
        .mock-custom-form-actions {
          display: flex;
          gap: 8px;
          justify-content: flex-end;
          margin-top: 4px;
        }
        .mock-google-btn-submit {
          background: #1a73e8;
          color: #ffffff;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          font-size: 0.85rem;
          font-weight: 500;
          cursor: pointer;
        }
        .mock-google-btn-submit:hover {
          background: #1557b0;
        }
        .mock-google-btn-cancel {
          background: transparent;
          border: 1px solid #dadce0;
          color: #5f6368;
          padding: 8px 16px;
          border-radius: 4px;
          font-size: 0.85rem;
          font-weight: 500;
          cursor: pointer;
        }
        .mock-google-btn-cancel:hover {
          background: #f1f3f4;
        }
      `}</style>
    </div>
  );
}
