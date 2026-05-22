"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import styles from "./AuthModal.module.css";

const initialLogin = { email: "", password: "" };
const initialRegister = { username: "", email: "", password: "" };

function EyeOpen() {
  return (
    <svg className={styles.eyeIcon} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeClosed() {
  return (
    <svg className={styles.eyeIcon} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" strokeLinecap="round" />
      <line x1="1" y1="1" x2="23" y2="23" strokeLinecap="round" />
    </svg>
  );
}

function FilmIcon() {
  return (
    <svg fill="currentColor" viewBox="0 0 24 24" width="20" height="20">
      <path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z" />
    </svg>
  );
}

export default function AuthModal({ isOpen, onClose, onAuth }) {
  const [tab, setTab] = useState("login");
  const [loginForm, setLoginForm] = useState(initialLogin);
  const [registerForm, setRegisterForm] = useState(initialRegister);
  const [error, setError] = useState({ login: "", register: "" });
  const [loading, setLoading] = useState({ login: false, register: false });
  const [showPass, setShowPass] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setLoginForm(initialLogin);
    setRegisterForm(initialRegister);
    setError({ login: "", register: "" });
    setLoading({ login: false, register: false });
    setShowPass(false);
    setTab("login");
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  function update(type, field, value) {
    if (type === "login") setLoginForm((p) => ({ ...p, [field]: value }));
    else setRegisterForm((p) => ({ ...p, [field]: value }));
    setError((p) => ({ ...p, [type]: "" }));
  }

  async function handleSubmit(type, e) {
    e.preventDefault();
    setError((p) => ({ ...p, [type]: "" }));
    setLoading((p) => ({ ...p, [type]: true }));
    try {
      const endpoint = type === "login" ? "/api/auth/login" : "/api/auth/register";
      const body = type === "login" ? loginForm : registerForm;
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError((p) => ({ ...p, [type]: data.error || "Что-то пошло не так" }));
        return;
      }
      onAuth(data.user);
      onClose();
    } catch {
      setError((p) => ({ ...p, [type]: "Ошибка сети. Попробуйте ещё раз." }));
    } finally {
      setLoading((p) => ({ ...p, [type]: false }));
    }
  }

  const isLogin = tab === "login";
  const activeLoading = isLogin ? loading.login : loading.register;
  const activeError = isLogin ? error.login : error.register;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className={styles.overlay}>
          <motion.div
            className={styles.backdrop}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
          />

          <motion.div
            className={styles.card}
            initial={{ opacity: 0, scale: 0.94, y: 32 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Film strip right edge */}
            <div className={styles.filmStrip} />

            {/* Close */}
            <button onClick={onClose} className={styles.close} aria-label="Закрыть">
              <svg fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" width="13" height="13">
                <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className={styles.inner}>
              {/* Brand */}
              <div className={styles.brand}>
                <div className={styles.brandIcon}>
                  <FilmIcon />
                </div>
                <div>
                  <div className={styles.brandName}>KINO</div>
                  <div className={styles.brandSub}>Онлайн кинотеатр</div>
                </div>
              </div>

              {/* Headline */}
              <h2 className={styles.headline}>
                {isLogin ? "Вход в систему" : "Регистрация"}
              </h2>
              <p className={styles.subtitle}>
                {isLogin
                  ? "Войдите, чтобы продолжить просмотр."
                  : "Создайте аккаунт и смотрите вместе."}
              </p>

              {/* Tabs */}
              <div className={styles.tabs}>
                <button
                  type="button"
                  className={`${styles.tab} ${isLogin ? styles.tabActive : ""}`}
                  onClick={() => { setTab("login"); setShowPass(false); }}
                >
                  Войти
                </button>
                <button
                  type="button"
                  className={`${styles.tab} ${!isLogin ? styles.tabActive : ""}`}
                  onClick={() => { setTab("register"); setShowPass(false); }}
                >
                  Регистрация
                </button>
              </div>

              {/* Forms */}
              <AnimatePresence mode="wait" initial={false}>
                {isLogin ? (
                  <motion.form
                    key="login"
                    className={styles.form}
                    onSubmit={(e) => handleSubmit("login", e)}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 16 }}
                    transition={{ duration: 0.2 }}
                  >
                    <label className={styles.field}>
                      <span className={styles.label}>Email</span>
                      <input
                        type="email"
                        placeholder="you@example.com"
                        value={loginForm.email}
                        onChange={(e) => update("login", "email", e.target.value)}
                        required
                        autoComplete="email"
                        className={styles.input}
                      />
                    </label>

                    <label className={styles.field}>
                      <span className={styles.label}>Пароль</span>
                      <div className={styles.passWrap}>
                        <input
                          type={showPass ? "text" : "password"}
                          placeholder="Введите пароль"
                          value={loginForm.password}
                          onChange={(e) => update("login", "password", e.target.value)}
                          required
                          minLength={6}
                          autoComplete="current-password"
                          className={`${styles.input} ${styles.inputPass}`}
                        />
                        <button
                          type="button"
                          className={styles.eye}
                          onClick={() => setShowPass((v) => !v)}
                          aria-label={showPass ? "Скрыть пароль" : "Показать пароль"}
                          tabIndex={-1}
                        >
                          {showPass ? <EyeClosed /> : <EyeOpen />}
                        </button>
                      </div>
                    </label>

                    {activeError && <p className={styles.error}>{activeError}</p>}

                    <button type="submit" disabled={activeLoading} className={styles.btn}>
                      {activeLoading
                        ? <span className={styles.spinner} />
                        : <>Войти в систему <span className={styles.arrow}>→</span></>}
                    </button>

                    <button type="button" className={styles.forgot}>
                      Забыли пароль?
                    </button>
                  </motion.form>
                ) : (
                  <motion.form
                    key="register"
                    className={styles.form}
                    onSubmit={(e) => handleSubmit("register", e)}
                    initial={{ opacity: 0, x: 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -16 }}
                    transition={{ duration: 0.2 }}
                  >
                    <label className={styles.field}>
                      <span className={styles.label}>Имя пользователя</span>
                      <input
                        type="text"
                        placeholder="Выберите имя"
                        value={registerForm.username}
                        onChange={(e) => update("register", "username", e.target.value)}
                        required
                        minLength={3}
                        autoComplete="username"
                        className={styles.input}
                      />
                    </label>

                    <label className={styles.field}>
                      <span className={styles.label}>Email</span>
                      <input
                        type="email"
                        placeholder="you@example.com"
                        value={registerForm.email}
                        onChange={(e) => update("register", "email", e.target.value)}
                        required
                        autoComplete="email"
                        className={styles.input}
                      />
                    </label>

                    <label className={styles.field}>
                      <span className={styles.label}>Пароль</span>
                      <div className={styles.passWrap}>
                        <input
                          type={showPass ? "text" : "password"}
                          placeholder="Придумайте пароль"
                          value={registerForm.password}
                          onChange={(e) => update("register", "password", e.target.value)}
                          required
                          minLength={6}
                          autoComplete="new-password"
                          className={`${styles.input} ${styles.inputPass}`}
                        />
                        <button
                          type="button"
                          className={styles.eye}
                          onClick={() => setShowPass((v) => !v)}
                          aria-label={showPass ? "Скрыть пароль" : "Показать пароль"}
                          tabIndex={-1}
                        >
                          {showPass ? <EyeClosed /> : <EyeOpen />}
                        </button>
                      </div>
                    </label>

                    {activeError && <p className={styles.error}>{activeError}</p>}

                    <button type="submit" disabled={activeLoading} className={styles.btn}>
                      {activeLoading
                        ? <span className={styles.spinner} />
                        : <>Создать аккаунт <span className={styles.arrow}>→</span></>}
                    </button>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>

            {/* Footer */}
            <div className={styles.footer}>
              <span className={styles.footerText}>KINO</span>
              <div className={styles.footerDot} />
              <span className={styles.footerText}>Смотрите вместе</span>
              <div className={styles.footerDot} />
              <span className={styles.footerText}>2025</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
