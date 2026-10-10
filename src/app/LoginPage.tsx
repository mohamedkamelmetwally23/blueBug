import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Check,
  CheckCheck,
  Eye,
  EyeOff,
  Globe2,
  LoaderCircle,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Sparkles,
  Users,
  Zap,
  Bug,
} from "lucide-react";
import { api, type User } from "./api";
import "./login.css";
import { ThemeToggle } from "./ThemeToggle";

type Reaction =
  "idle" | "email" | "password" | "peek" | "loading" | "success" | "error";
const words = {
  en: {
    tagline: "A LITTLE BUG. A BIG DIFFERENCE.",
    title: "Good work starts",
    accent: "with a little spark.",
    intro:
      "Your tasks, your team, your next big idea.\nAll in one happy place.",
    welcome: "Welcome back.",
    subtitle: "Your workspace missed you. Let’s get you in.",
    email: "Email",
    password: "Password",
    emailPlaceholder: "you@company.com",
    passwordPlaceholder: "Enter your password",
    signIn: "Sign in",
    loading: "Opening your workspace…",
    success: "You’re in. Let’s go!",
    secure: "Safe, secure, and ready for you",
    note: "Your team’s next great day starts here.",
    required: "Enter your password.",
    invalidEmail: "Enter a valid email address.",
    error: "We couldn’t sign you in. Check your credentials and try again.",
    hide: "Hide password",
    show: "Show password",
    organized: "Stay organized",
    team: "Work together",
    fast: "Move things forward",
    idle: "Ready when you are.",
    attentive: "You have my full attention.",
    privacy: "Your secret’s safe with me.",
    peek: "I’ll give you a little privacy.",
    waiting: "Finding your happy place…",
    retry: "Let’s give that another try.",
    footer: "Made for people. Powered by teamwork.",
  },
  ar: {
    tagline: "حشرة صغيرة. فرق كبير.",
    title: "العمل الرائع يبدأ",
    accent: "بشرارة صغيرة.",
    intro: "مهامك وفريقك وفكرتك القادمة.\nكلها في مكان واحد.",
    welcome: "مرحبًا بعودتك.",
    subtitle: "مساحة عملك بانتظارك. لنبدأ يومًا رائعًا.",
    email: "البريد الإلكتروني",
    password: "كلمة المرور",
    emailPlaceholder: "you@company.com",
    passwordPlaceholder: "أدخل كلمة المرور",
    signIn: "تسجيل الدخول",
    loading: "جارٍ فتح مساحة العمل…",
    success: "تم الدخول. هيا بنا!",
    secure: "دخول آمن وجاهز لك",
    note: "يوم فريقك الرائع يبدأ هنا.",
    required: "أدخل كلمة المرور.",
    invalidEmail: "أدخل بريدًا إلكترونيًا صالحًا.",
    error: "تعذر تسجيل الدخول. تحقق من بيانات الدخول وحاول مرة أخرى.",
    hide: "إخفاء كلمة المرور",
    show: "إظهار كلمة المرور",
    organized: "نظّم مهامك",
    team: "اعمل مع فريقك",
    fast: "حقق تقدمًا",
    idle: "جاهز عندما تكون مستعدًا.",
    attentive: "كل انتباهي لك.",
    privacy: "سرّك بأمان معي.",
    peek: "سأمنحك بعض الخصوصية.",
    waiting: "جارٍ فتح مساحتك…",
    retry: "لنحاول مرة أخرى.",
    footer: "صُمّم للأشخاص. بقوة العمل الجماعي.",
  },
};

function BlueBugMascot({
  reaction,
  caption,
}: {
  reaction: Reaction;
  caption: string;
}) {
  const [missing, setMissing] = useState(false);
  const stage = useRef<HTMLDivElement>(null);
  return (
    <div
      className={`bug-scene reaction-${reaction}`}
      ref={stage}
      onPointerMove={(event) => {
        if (
          event.pointerType === "touch" ||
          window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
        )
          return;
        const box = event.currentTarget.getBoundingClientRect();
        stage.current?.style.setProperty(
          "--look",
          `${((event.clientX - box.left) / box.width - 0.5) * 7}deg`,
        );
      }}
      onPointerLeave={() => stage.current?.style.setProperty("--look", "0deg")}
    >
      <div className="bug-orbit orbit-one" />
      <span className="bug-spark spark-one" />
      <span className="bug-spark spark-two" />
      <div className="bug-caption" key={caption}>
        <span />
        {caption}
      </div>
      <div className="bug-float">
        <div className="bug-character">
          {missing ? (
            <Bug
              className="bug-existing-mark"
              aria-label="Blue Bug"
              strokeWidth={1.1}
            />
          ) : (
            <img
              src="/blue-bug-mascot.png"
              alt="Blue Bug mascot"
              onError={() => setMissing(true)}
              draggable={false}
            />
          )}
        </div>
      </div>
      <div className="bug-platform" />
      <div className="celebration" aria-hidden="true">
        <Sparkles />
        <Sparkles />
        <Sparkles />
      </div>
    </div>
  );
}

export function LoginPage({
  onAuthenticated,
}: {
  onAuthenticated: (user: User) => void;
}) {
  const [language, setLanguage] = useState<"en" | "ar">(() =>
    document.documentElement.lang.startsWith("ar") ? "ar" : "en",
  );
  const t = words[language];
  const [focused, setFocused] = useState<"email" | "password" | null>(null);
  const [visible, setVisible] = useState(false);
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [errors, setErrors] = useState({ email: false, password: false });
  const lock = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  const reaction: Reaction =
    status !== "idle"
      ? status
      : focused === "password"
        ? visible
          ? "peek"
          : "password"
        : (focused ?? "idle");
  const captions = {
    idle: t.idle,
    email: t.attentive,
    password: t.privacy,
    peek: t.peek,
    loading: t.waiting,
    success: t.success,
    error: t.retry,
  };
  const busy = status === "loading" || status === "success";
  return (
    <main
      className="blue-login"
      lang={language}
      dir={language === "ar" ? "rtl" : "ltr"}
    >
      <section className="login-story" aria-labelledby="story-title">
        <a className="login-brand" href="/" aria-label="Blue Bug Operations">
          <span className="login-brand-icon">
            <Bug size={27} />
          </span>
          <span>
            <strong>Blue Bug</strong>
            <small>OPERATIONS</small>
          </span>
        </a>
        <div className="story-main">
          <div className="story-copy">
            <div className="story-eyebrow">
              <span />
              {t.tagline}
            </div>
            <h1 id="story-title">
              {t.title}
              <br />
              <em>{t.accent}</em>
            </h1>
            <p>{t.intro}</p>
          </div>
          <BlueBugMascot reaction={reaction} caption={captions[reaction]} />
        </div>
        <div className="story-footer">
          <div className="story-benefits">
            <span>
              <CheckCheck />
              {t.organized}
            </span>
            <span>
              <Users />
              {t.team}
            </span>
            <span>
              <Zap />
              {t.fast}
            </span>
          </div>
          <span className="story-coordinate" aria-hidden="true">
            BLUE BUG / YOUR DAILY CO-PILOT
          </span>
        </div>
      </section>
      <section className="login-entry" aria-labelledby="login-title">
        <div
          className="login-controls"
          role="group"
          aria-label={language === "ar" ? "إعدادات العرض" : "Display settings"}
        >
          <ThemeToggle language={language} />
          <button
            className="login-language"
            type="button"
            onClick={() => setLanguage(language === "en" ? "ar" : "en")}
          >
            <Globe2 size={16} />
            {language === "en" ? "العربية" : "English"}
          </button>
        </div>
        <div className="login-card">
          <div className="login-greeting" aria-hidden="true">
            <Sparkles size={23} />
          </div>
          <div className="login-card-eyebrow">BLUE BUG OPERATIONS</div>
          <h2 id="login-title">{t.welcome}</h2>
          <p className="login-subtitle">{t.subtitle}</p>
          <form
            noValidate
            onSubmit={async (event) => {
              event.preventDefault();
              if (lock.current) return;
              const values = new FormData(event.currentTarget);
              const email = String(values.get("email") ?? "").trim();
              const password = String(values.get("password") ?? "");
              const invalid = {
                email: !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
                password: !password,
              };
              setErrors(invalid);
              if (invalid.email || invalid.password) {
                event.currentTarget
                  .querySelector<HTMLInputElement>(
                    invalid.email ? "#login-email" : "#login-password",
                  )
                  ?.focus();
                return;
              }
              lock.current = true;
              setStatus("loading");
              try {
                const result = await api<{ token: string; user: User }>(
                  "/auth/login",
                  "POST",
                  { email, password },
                );
                sessionStorage.setItem("ops-token", result.token);
                setStatus("success");
                timer.current = setTimeout(
                  () => {
                    history.replaceState(
                      null,
                      "",
                      result.user.role === "manager"
                        ? "/manager/overview"
                        : result.user.role === "coordinator"
                          ? "/coordinator/tasks"
                          : "/employee/tasks",
                    );
                    onAuthenticated(result.user);
                  },
                  window.matchMedia?.("(prefers-reduced-motion: reduce)")
                    .matches
                    ? 0
                    : 650,
                );
              } catch {
                lock.current = false;
                setStatus("error");
              }
            }}
          >
            <div className="login-field">
              <label htmlFor="login-email">{t.email}</label>
              <div className="login-input">
                <Mail size={19} />
                <input
                  id="login-email"
                  name="email"
                  type="email"
                  dir="ltr"
                  placeholder={t.emailPlaceholder}
                  autoComplete="username"
                  required
                  disabled={busy}
                  aria-invalid={errors.email}
                  aria-describedby={errors.email ? "email-error" : undefined}
                  onFocus={() => setFocused("email")}
                  onBlur={() => setFocused(null)}
                  onChange={() => {
                    setErrors((e) => ({ ...e, email: false }));
                    if (status === "error") setStatus("idle");
                  }}
                />
              </div>
              {errors.email && (
                <p className="login-validation" id="email-error">
                  {t.invalidEmail}
                </p>
              )}
            </div>
            <div className="login-field">
              <label htmlFor="login-password">{t.password}</label>
              <div className="login-input">
                <LockKeyhole size={19} />
                <input
                  id="login-password"
                  name="password"
                  type={visible ? "text" : "password"}
                  placeholder={t.passwordPlaceholder}
                  autoComplete="current-password"
                  required
                  maxLength={200}
                  disabled={busy}
                  aria-invalid={errors.password}
                  aria-describedby={
                    errors.password ? "password-error" : undefined
                  }
                  onFocus={() => setFocused("password")}
                  onBlur={() => setFocused(null)}
                  onChange={() => {
                    setErrors((e) => ({ ...e, password: false }));
                    if (status === "error") setStatus("idle");
                  }}
                />
                <button
                  className="login-reveal"
                  type="button"
                  aria-label={visible ? t.hide : t.show}
                  aria-pressed={visible}
                  aria-controls="login-password"
                  disabled={busy}
                  onClick={() => {
                    setVisible(!visible);
                    setFocused("password");
                  }}
                >
                  {visible ? <EyeOff size={19} /> : <Eye size={19} />}
                </button>
              </div>
              {errors.password && (
                <p className="login-validation" id="password-error">
                  {t.required}
                </p>
              )}
            </div>
            {status === "error" && (
              <p className="login-validation login-auth-error" role="alert">
                {t.error}
              </p>
            )}
            <button
              className={`login-submit ${status === "success" ? "is-success" : ""}`}
              disabled={busy}
              type="submit"
            >
              {status === "loading"
                ? t.loading
                : status === "success"
                  ? t.success
                  : t.signIn}
              {status === "loading" ? (
                <LoaderCircle className="login-spinner" size={19} />
              ) : status === "success" ? (
                <Check size={20} />
              ) : (
                <ArrowRight size={19} />
              )}
            </button>
            <span className="login-sr" role="status">
              {busy ? (status === "success" ? t.success : t.loading) : ""}
            </span>
          </form>
          <div className="login-security">
            <ShieldCheck size={18} />
            <span>{t.secure}</span>
          </div>
          <p className="login-card-note">{t.note}</p>
        </div>
        <footer className="login-footer">
          <span className="footer-dot" />
          {t.footer}
        </footer>
      </section>
    </main>
  );
}
