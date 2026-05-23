import { useState, useEffect } from "react"
import { auth, db } from "../../firebase"
import { signInWithEmailAndPassword } from "firebase/auth"
import { doc, getDoc } from "firebase/firestore"
import { useNavigate, Link } from "react-router-dom"
import "../../styles/auth.css"

/* ── Translations ─────────────────────────────────────── */
const T = {
  en: {
    balloon: "Cheer ET",
    tagline: "Cheer up Ethiopia",
    title: "Welcome back",
    sub: "Log in to your creator dashboard",
    email: "Email",
    password: "Password",
    forgot: "Forgot password?",
    loginBtn: "Log In",
    loggingIn: "Logging in…",
    noAccount: "Don't have an account?",
    signup: "Sign up",
    err: {
      noEmail: "Please enter your email address.",
      noPass:  "Please enter your password.",
      notFound:    "No account found with that email. Want to sign up?",
      wrongPass:   "That password isn't right — give it another try.",
      badCred:     "Email or password is incorrect. Please try again.",
      badEmail:    "That email address doesn't look right.",
      tooMany:     "Too many failed attempts. Wait a few minutes and try again.",
      noNet:       "No internet connection. Check your network and try again.",
      disabled:    "This account has been disabled. Contact support.",
      banned:      "Your account has been suspended. Please contact support.",
      generic:     "Something went wrong. Please try again.",
    },
  },
  am: {
    balloon: "Cheer ET",
    tagline: "Cheer up Ethiopia",
    title: "እንኳን ደህና መጡ",
    sub: "ወደ creator ዳሽቦርድዎ ይግቡ",
    email: "ኢሜይል (email)",
    password: "የይለፍ ቃል",
    forgot: "የይለፍ ቃል ረሱ?",
    loginBtn: "ግባ",
    loggingIn: "እየገባ ነው…",
    noAccount: "መለያ የለዎትም?",
    signup: "ይመዝገቡ",
    err: {
      noEmail: "ኢሜይልዎን ያስገቡ።",
      noPass:  "የይለፍ ቃልዎን ያስገቡ።",
      notFound:    "በዚህ ኢሜይል ምንም መለያ አልተገኘም። ይመዝገቡ?",
      wrongPass:   "የይለፍ ቃሉ ትክክል አይደለም — ደግሞ ይሞክሩ።",
      badCred:     "ኢሜይሉ ወይም የይለፍ ቃሉ ትክክል አይደለም።",
      badEmail:    "ኢሜይሉ ትክክል አይደለም።",
      tooMany:     "ብዙ ሙከራዎች። ጥቂት ቆይ ደግሞ ይሞክሩ።",
      noNet:       "ኢንተርኔት የለም። ኔትዎርክዎን ያረጋግጡ።",
      disabled:    "ይህ መለያ ተሰናክሏል። ድጋፍ ያግኙ።",
      banned:      "መለያዎ ታግዷል። ድጋፍ ያግኙ።",
      generic:     "ስህተት ተፈጥሯል። ደግሞ ይሞክሩ።",
    },
  },
}

const FLOATING_ICONS = [
  { icon: "bi-star-fill",         x: "7%",  y: "10%", size: 20, delay: 0.0 },
  { icon: "bi-heart-fill",        x: "80%", y: "15%", size: 16, delay: 0.5 },
  { icon: "bi-lightning-fill",    x: "5%",  y: "70%", size: 18, delay: 1.0 },
  { icon: "bi-gem",               x: "85%", y: "60%", size: 15, delay: 0.3 },
  { icon: "bi-trophy-fill",       x: "12%", y: "85%", size: 17, delay: 0.8 },
  { icon: "bi-music-note-beamed", x: "78%", y: "80%", size: 16, delay: 1.4 },
  { icon: "bi-camera-video-fill", x: "88%", y: "35%", size: 19, delay: 0.2 },
  { icon: "bi-broadcast",         x: "3%",  y: "40%", size: 16, delay: 1.1 },
  { icon: "bi-gift-fill",         x: "72%", y: "8%",  size: 14, delay: 0.7 },
  { icon: "bi-currency-dollar",   x: "20%", y: "6%",  size: 15, delay: 1.6 },
]

function FloatingLabel({ label, isAmharic, children }) {
  return (
    <div className="float-field">
      {children}
      <label className={`float-label${isAmharic ? " amharic" : ""}`}>{label}</label>
    </div>
  )
}

function CheerBalloon({ up, text, isAmharic }) {
  return (
    <div className={`balloon-scene ${up ? "balloon-up" : ""}`}>
      <div
        className={`cheer-balloon-text${isAmharic ? " amharic" : ""}`}
        data-text={text}
      >
        {text}
      </div>
      <div className="balloon-knot" />
      <svg className="balloon-string-svg" width="36" height="120" viewBox="0 0 36 120">
        <path
          d="M18,0 Q28,24 12,48 Q2,72 22,96 Q28,108 18,120"
          stroke="rgba(255,255,255,0.42)"
          strokeWidth="1.8"
          fill="none"
          strokeLinecap="round"
        />
      </svg>
    </div>
  )
}

export default function Login() {
  const navigate = useNavigate()
  const [lang, setLang]           = useState("en")
  const [form, setForm]           = useState({ email: "", password: "" })
  const [error, setError]         = useState("")
  const [loading, setLoading]     = useState(false)
  const [showPass, setShowPass]   = useState(false)
  const [balloonUp, setBalloonUp] = useState(false)
  const t                         = T[lang]
  const isAmharic                 = lang === "am"

  useEffect(() => { setTimeout(() => setBalloonUp(true), 250) }, [])

  function handleChange(e) {
    setForm(p => ({ ...p, [e.target.name]: e.target.value }))
    setError("")
  }

  function validate() {
    if (!form.email)    return t.err.noEmail
    if (!form.password) return t.err.noPass
    return null
  }

  function friendlyError(code) {
    const map = {
      "auth/user-not-found":         t.err.notFound,
      "auth/wrong-password":         t.err.wrongPass,
      "auth/invalid-credential":     t.err.badCred,
      "auth/invalid-email":          t.err.badEmail,
      "auth/too-many-requests":      t.err.tooMany,
      "auth/network-request-failed": t.err.noNet,
      "auth/user-disabled":          t.err.disabled,
    }
    return map[code] || t.err.generic
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const err = validate()
    if (err) { setError(err); return }
    setLoading(true); setError("")
    try {
      const cred = await signInWithEmailAndPassword(auth, form.email, form.password)
      const snap = await getDoc(doc(db, "users", cred.user.uid))
      if (snap.exists() && snap.data().status === "banned") {
        await auth.signOut()
        setError(t.err.banned)
        return
      }
      navigate("/dashboard")
    } catch (err) {
      setError(friendlyError(err.code))
    } finally { setLoading(false) }
  }

  return (
    <div className="auth-container">

      {/* ── LEFT PANEL ── */}
      <div className="auth-left">
        <div className="moving-bg" />

        {/* Language toggle */}
        <div className="lang-toggle">
          <button className={`lang-btn ${lang === "en" ? "active" : ""}`}
            onClick={() => setLang("en")}>EN</button>
          <button className={`lang-btn ${lang === "am" ? "active" : ""}`}
            onClick={() => setLang("am")}>አማ</button>
        </div>

        {FLOATING_ICONS.map((fi, i) => (
          <i key={i} className={`bi ${fi.icon} floating-icon`}
            style={{ left: fi.x, top: fi.y, fontSize: fi.size, animationDelay: `${fi.delay}s` }} />
        ))}

        <CheerBalloon up={balloonUp} text={t.balloon} isAmharic={isAmharic} />

        <p className={`auth-tagline${isAmharic ? " amharic" : ""}`}>{t.tagline}</p>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className="auth-right">
        <div className="auth-card">

          <div className="login-icon">
            <i className="bi bi-person-circle" />
          </div>

          <h2 className={`card-title${isAmharic ? " amharic" : ""}`}>{t.title}</h2>
          <p className={`card-sub${isAmharic ? " amharic" : ""}`}>{t.sub}</p>

          {error && (
            <div className={`auth-error${isAmharic ? " amharic" : ""}`}>
              <i className="bi bi-exclamation-circle" style={{ flexShrink: 0 }} /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <FloatingLabel label={t.email} isAmharic={isAmharic}>
              <input className="auth-input" name="email" type="email"
                value={form.email} onChange={handleChange}
                required autoComplete="email" />
            </FloatingLabel>

            <FloatingLabel label={t.password} isAmharic={isAmharic}>
              <input className="auth-input" name="password"
                type={showPass ? "text" : "password"}
                value={form.password} onChange={handleChange}
                required autoComplete="current-password"
                style={{ paddingRight: "48px" }} />
              <button type="button" className="show-pass-btn"
                onClick={() => setShowPass(s => !s)}
                tabIndex={-1}
                aria-label={showPass ? "Hide password" : "Show password"}>
                <i className={`bi ${showPass ? "bi-eye-slash" : "bi-eye"}`} />
              </button>
            </FloatingLabel>

            <div className="forgot-wrap">
              <Link to="/forgot-password"
                className={`forgot-link${isAmharic ? " amharic" : ""}`}>
                {t.forgot}
              </Link>
            </div>

            <button type="submit"
              className={`auth-btn${isAmharic ? " amharic" : ""}`}
              disabled={loading}>
              {loading
                ? <><i className="bi bi-arrow-repeat spin" /> {t.loggingIn}</>
                : <>{t.loginBtn} <i className="bi bi-arrow-right" /></>}
            </button>
          </form>

          <div className={`auth-link${isAmharic ? " amharic" : ""}`}>
            {t.noAccount} <Link to="/register">{t.signup}</Link>
          </div>

        </div>
      </div>
    </div>
  )
}