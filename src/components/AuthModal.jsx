"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import styles from "./AuthModal.module.css";

const initialLogin = { email: "", password: "" };
const initialRegister = { username: "", email: "", password: "" };

export default function AuthModal({ isOpen, onClose, onAuth }) {
  const [loginForm, setLoginForm] = useState(initialLogin);
  const [registerForm, setRegisterForm] = useState(initialRegister);
  const [error, setError] = useState({ login: "", register: "" });
  const [loading, setLoading] = useState({ login: false, register: false });

  useEffect(() => {
    if (!isOpen) return;
    setLoginForm(initialLogin);
    setRegisterForm(initialRegister);
    setError({ login: "", register: "" });
    setLoading({ login: false, register: false });
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (event) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  function updateForm(type, field, value) {
    if (type === "login") {
      setLoginForm((current) => ({ ...current, [field]: value }));
    } else {
      setRegisterForm((current) => ({ ...current, [field]: value }));
    }
    setError((current) => ({ ...current, [type]: "" }));
  }

  async function handleSubmit(type, event) {
    event.preventDefault();
    setError((current) => ({ ...current, [type]: "" }));
    setLoading((current) => ({ ...current, [type]: true }));

    try {
      const endpoint = type === "login" ? "/api/auth/login" : "/api/auth/register";
      const body = type === "login" ? loginForm : registerForm;
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await response.json();

      if (!response.ok) {
        setError((current) => ({ ...current, [type]: data.error || "Something went wrong" }));
        return;
      }

      onAuth(data.user);
      onClose();
    } catch {
      setError((current) => ({ ...current, [type]: "Network error" }));
    } finally {
      setLoading((current) => ({ ...current, [type]: false }));
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
    <div className="fixed inset-0 z-[100] overflow-y-auto p-4 sm:p-6 lg:p-10">
      <motion.div
        className="absolute inset-0 bg-[rgba(3,3,8,0.84)] backdrop-blur-2xl"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        onClick={onClose}
      />

      <div className={`relative mx-auto flex min-h-full items-center justify-center ${styles.shell}`}>
        <motion.div
          className={styles.modalCard}
          initial={{ opacity: 0, scale: 0.94, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 16 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        >
          <button
            onClick={onClose}
            aria-label="Close"
            className="absolute right-5 top-5 z-20 flex h-11 w-11 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.04] text-text-secondary transition-all duration-300 hover:border-white/[0.16] hover:bg-white/[0.08] hover:text-text-primary"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24">
              <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <aside className={styles.introPanel}>
            <div className={styles.introGlow} />
            <p className="mono-label-accent">Member Access</p>
            <div className="space-y-5">
              <h2 className="display-md max-w-[10ch]">
                Your private
                <span className="display-italic gradient-text"> cinema lounge.</span>
              </h2>
              <p className="max-w-[34ch] text-[15px] leading-7 text-text-secondary">
                Sign in to keep your profile close, or create a new account in a separate flow without cramped tabs and crowded fields.
              </p>
            </div>

            <div className={styles.featureList}>
              <div className={styles.featureItem}>
                <span className={styles.featureIndex}>01</span>
                <div>
                  <p className={styles.featureTitle}>Clear split</p>
                  <p className={styles.featureText}>Login and registration live in their own cards.</p>
                </div>
              </div>
              <div className={styles.featureItem}>
                <span className={styles.featureIndex}>02</span>
                <div>
                  <p className={styles.featureTitle}>Editorial spacing</p>
                  <p className={styles.featureText}>More air, stronger hierarchy, cleaner focus.</p>
                </div>
              </div>
              <div className={styles.featureItem}>
                <span className={styles.featureIndex}>03</span>
                <div>
                  <p className={styles.featureTitle}>Fast access</p>
                  <p className={styles.featureText}>Same auth API, cleaner surface.</p>
                </div>
              </div>
            </div>
          </aside>

          <div className={styles.formsGrid}>
            <section className={styles.formCard}>
              <div className="space-y-3">
                <p className="mono-label">Returning member</p>
                <div className="space-y-2">
                  <h3 className={styles.cardTitle}>Login</h3>
                  <p className={styles.cardText}>Continue watching, commenting, and keeping your profile synced.</p>
                </div>
              </div>

              <form className="space-y-4" onSubmit={(event) => handleSubmit("login", event)}>
                <label className={styles.field}>
                  <span className={styles.label}>Email</span>
                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={loginForm.email}
                    onChange={(event) => updateForm("login", "email", event.target.value)}
                    required
                    className={styles.input}
                  />
                </label>

                <label className={styles.field}>
                  <span className={styles.label}>Password</span>
                  <input
                    type="password"
                    placeholder="Enter your password"
                    value={loginForm.password}
                    onChange={(event) => updateForm("login", "password", event.target.value)}
                    required
                    minLength={6}
                    className={styles.input}
                  />
                </label>

                {error.login && <p className={styles.error}>{error.login}</p>}

                <button type="submit" disabled={loading.login} className={`btn-primary w-full ${styles.submitButton}`}>
                  {loading.login ? (
                    <span className="h-5 w-5 rounded-full border-2 border-text-inverse/30 border-t-text-inverse animate-spin" />
                  ) : (
                    "Sign In"
                  )}
                </button>
              </form>
            </section>

            <section className={`${styles.formCard} ${styles.formCardAccent}`}>
              <div className="space-y-3">
                <p className="mono-label-accent">New account</p>
                <div className="space-y-2">
                  <h3 className={styles.cardTitle}>Register</h3>
                  <p className={styles.cardText}>Create a profile in a dedicated card with room for every field.</p>
                </div>
              </div>

              <form className="space-y-4" onSubmit={(event) => handleSubmit("register", event)}>
                <label className={styles.field}>
                  <span className={styles.label}>Username</span>
                  <input
                    type="text"
                    placeholder="Choose a username"
                    value={registerForm.username}
                    onChange={(event) => updateForm("register", "username", event.target.value)}
                    required
                    minLength={3}
                    className={styles.input}
                  />
                </label>

                <label className={styles.field}>
                  <span className={styles.label}>Email</span>
                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={registerForm.email}
                    onChange={(event) => updateForm("register", "email", event.target.value)}
                    required
                    className={styles.input}
                  />
                </label>

                <label className={styles.field}>
                  <span className={styles.label}>Password</span>
                  <input
                    type="password"
                    placeholder="Create a strong password"
                    value={registerForm.password}
                    onChange={(event) => updateForm("register", "password", event.target.value)}
                    required
                    minLength={6}
                    className={styles.input}
                  />
                </label>

                {error.register && <p className={styles.error}>{error.register}</p>}

                <button type="submit" disabled={loading.register} className={`btn-primary w-full ${styles.submitButton}`}>
                  {loading.register ? (
                    <span className="h-5 w-5 rounded-full border-2 border-text-inverse/30 border-t-text-inverse animate-spin" />
                  ) : (
                    "Create Account"
                  )}
                </button>
              </form>
            </section>
          </div>
        </motion.div>
      </div>
    </div>
      )}
    </AnimatePresence>
  );
}
